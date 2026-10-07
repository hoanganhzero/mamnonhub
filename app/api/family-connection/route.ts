import { env } from "cloudflare:workers";
import { currentUser } from "../../../lib/session";
import { scopedChildren } from "../../../lib/scope";
import { vnNow, vnToday } from "../../../lib/day";

const REACTIONS = ["Đã biết", "Cảm ơn cô", "Tôi sẽ theo dõi thêm", "Trao đổi với cô"];
const APPOINTMENT_MODES = ["Trực tiếp", "Điện thoại", "Video"];
const APPOINTMENT_STATUSES = ["Chờ xác nhận", "Đã xác nhận", "Từ chối", "Đã hủy", "Hoàn thành"];

async function context(request: Request) {
  const user = await currentUser(request);
  if (!user) return null;
  const scope = await scopedChildren(user);
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("childId"));
  const child = scope.rows.find((x) => x.id === requested) || scope.rows[0];
  return { user, scope, child };
}

function rows<T = Record<string, unknown>>(result: D1Result<T>) {
  return Array.from(result.results || []);
}

export async function GET(request: Request) {
  try {
    const ctx = await context(request);
    if (!ctx) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const { user, scope, child } = ctx;
    if (!child)
      return Response.json({ children: [], today: null, feedback: [], tasks: [], appointments: [], timeline: [] });

    const url = new URL(request.url);
    const date = url.searchParams.get("date") || vnToday();
    const db = env.DB;
    const [attendance, log, feedback, tasks, appointments, messages, incidents, leaves] = await Promise.all([
      db.prepare("SELECT * FROM attendance WHERE child_id=? AND date=? LIMIT 1").bind(child.id, date).all(),
      db.prepare("SELECT * FROM daily_logs WHERE child_id=? AND date=? LIMIT 1").bind(child.id, date).all(),
      db.prepare("SELECT * FROM family_feedback WHERE child_id=? ORDER BY id DESC LIMIT 60").bind(child.id).all(),
      db.prepare("SELECT * FROM family_tasks WHERE child_id=? ORDER BY CASE WHEN status='Chưa làm' THEN 0 ELSE 1 END, due_date ASC, id DESC LIMIT 100").bind(child.id).all(),
      db.prepare("SELECT * FROM family_appointments WHERE child_id=? ORDER BY id DESC LIMIT 60").bind(child.id).all(),
      db.prepare("SELECT id, body, sender_id, sender_role, read_at, created_at FROM messages WHERE child_id=? ORDER BY id DESC LIMIT 80").bind(child.id).all(),
      db.prepare("SELECT id, kind, severity, description, handling, acknowledged_at, date, time, created_at FROM incidents WHERE child_id=? ORDER BY id DESC LIMIT 40").bind(child.id).all(),
      db.prepare("SELECT id, from_date, to_date, reason, note, status, created_at FROM leave_requests WHERE child_id=? ORDER BY id DESC LIMIT 40").bind(child.id).all(),
    ]);

    const timeline = [
      ...rows(messages).map((x: any) => ({ type: "message", id: x.id, at: x.created_at, title: x.sender_id === user.id ? "Bạn đã nhắn" : "Tin nhắn mới", detail: x.body, role: x.sender_role })),
      ...rows(incidents).map((x: any) => ({ type: "incident", id: x.id, at: x.created_at || `${x.date} ${x.time || ""}`, title: `${x.kind} · ${x.severity}`, detail: x.handling ? `${x.description} · Xử lý: ${x.handling}` : x.description, acknowledged: Boolean(x.acknowledged_at) })),
      ...rows(leaves).map((x: any) => ({ type: "leave", id: x.id, at: x.created_at, title: `Xin nghỉ: ${x.status}`, detail: `${x.from_date}${x.to_date !== x.from_date ? ` → ${x.to_date}` : ""} · ${x.reason}${x.note ? ` · ${x.note}` : ""}` })),
      ...rows(feedback).map((x: any) => ({ type: "feedback", id: x.id, at: x.created_at, title: x.reaction, detail: x.note || "Phản hồi nhanh", role: x.created_role })),
      ...rows(tasks).map((x: any) => ({ type: "task", id: x.id, at: x.created_at, title: `Việc cần làm: ${x.title}`, detail: `${x.status}${x.due_date ? ` · Hạn ${x.due_date}` : ""}${x.detail ? ` · ${x.detail}` : ""}` })),
      ...rows(appointments).map((x: any) => ({ type: "appointment", id: x.id, at: x.created_at, title: `Lịch hẹn: ${x.status}`, detail: `${x.mode} · ${x.confirmed_date || x.requested_date} ${x.confirmed_time || x.requested_time}${x.topic ? ` · ${x.topic}` : ""}` })),
    ].sort((a, b) => String(b.at || "").localeCompare(String(a.at || ""))).slice(0, 120);

    return Response.json({
      date,
      role: user.role,
      children: scope.rows.map((x) => ({ id: x.id, name: x.name, className: x.className })),
      child: { id: child.id, name: child.name, className: child.className },
      today: {
        attendance: rows(attendance)[0] || null,
        log: rows(log)[0] || null,
      },
      feedback: rows(feedback),
      tasks: rows(tasks),
      appointments: rows(appointments),
      timeline,
      reactions: REACTIONS,
      appointmentModes: APPOINTMENT_MODES,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (!["parent", "teacher", "admin"].includes(user.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const body = await request.json() as Record<string, string | number>;
    const scope = await scopedChildren(user);
    const child = scope.rows.find((x) => x.id === Number(body.childId));
    if (!child) return Response.json({ error: "Trẻ không thuộc phạm vi tài khoản" }, { status: 403 });
    const action = String(body.action || "");

    if (action === "feedback") {
      const reaction = String(body.reaction || "");
      if (!REACTIONS.includes(reaction)) return Response.json({ error: "Phản hồi không hợp lệ" }, { status: 400 });
      const note = String(body.note || "").trim().slice(0, 700);
      const result = await env.DB.prepare(
        "INSERT INTO family_feedback (school_id,child_id,source_type,source_id,reaction,note,created_by,created_role) VALUES (?,?,?,?,?,?,?,?) RETURNING *",
      ).bind(child.schoolId, child.id, String(body.sourceType || "daily_log").slice(0, 40), Number(body.sourceId) || null, reaction, note, user.id, user.role).first();
      return Response.json({ feedback: result }, { status: 201 });
    }

    if (action === "task") {
      if (!["teacher", "admin"].includes(user.role)) return Response.json({ error: "Chỉ GVCN/nhà trường được giao việc" }, { status: 403 });
      const title = String(body.title || "").trim().slice(0, 160);
      if (!title) return Response.json({ error: "Nhập nội dung việc cần làm" }, { status: 400 });
      const result = await env.DB.prepare(
        "INSERT INTO family_tasks (school_id,child_id,title,detail,due_date,created_by) VALUES (?,?,?,?,?,?) RETURNING *",
      ).bind(child.schoolId, child.id, title, String(body.detail || "").trim().slice(0, 800), String(body.dueDate || "").slice(0, 10), user.id).first();
      return Response.json({ task: result }, { status: 201 });
    }

    if (action === "appointment") {
      const date = String(body.date || "").slice(0, 10);
      const time = String(body.time || "").slice(0, 5);
      const mode = String(body.mode || "Trực tiếp");
      if (!date || !time) return Response.json({ error: "Chọn ngày và giờ hẹn" }, { status: 400 });
      if (!APPOINTMENT_MODES.includes(mode)) return Response.json({ error: "Hình thức hẹn không hợp lệ" }, { status: 400 });
      const result = await env.DB.prepare(
        "INSERT INTO family_appointments (school_id,child_id,requested_by,requested_role,mode,requested_date,requested_time,topic,note) VALUES (?,?,?,?,?,?,?,?,?) RETURNING *",
      ).bind(child.schoolId, child.id, user.id, user.role, mode, date, time, String(body.topic || "").trim().slice(0, 200), String(body.note || "").trim().slice(0, 800)).first();
      return Response.json({ appointment: result }, { status: 201 });
    }

    return Response.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const body = await request.json() as Record<string, string | number>;
    const action = String(body.action || "");
    const id = Number(body.id);
    if (!id) return Response.json({ error: "Thiếu mã dữ liệu" }, { status: 400 });
    const scope = await scopedChildren(user);

    if (action === "task-status") {
      const item = await env.DB.prepare("SELECT * FROM family_tasks WHERE id=? LIMIT 1").bind(id).first<any>();
      if (!item || !scope.rows.some((x) => x.id === item.child_id)) return Response.json({ error: "Không tìm thấy việc" }, { status: 404 });
      const status = String(body.status || "");
      if (!["Chưa làm", "Đã hoàn thành"].includes(status)) return Response.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
      const completed = status === "Đã hoàn thành";
      await env.DB.prepare("UPDATE family_tasks SET status=?, completed_by=?, completed_at=? WHERE id=?")
        .bind(status, completed ? user.id : null, completed ? `${vnToday()} ${vnNow()}` : "", id).run();
      return Response.json({ ok: true });
    }

    if (action === "appointment-status") {
      const item = await env.DB.prepare("SELECT * FROM family_appointments WHERE id=? LIMIT 1").bind(id).first<any>();
      if (!item || !scope.rows.some((x) => x.id === item.child_id)) return Response.json({ error: "Không tìm thấy lịch hẹn" }, { status: 404 });
      const status = String(body.status || "");
      if (!APPOINTMENT_STATUSES.includes(status)) return Response.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
      if (["Đã xác nhận", "Từ chối", "Hoàn thành"].includes(status) && !["teacher", "admin"].includes(user.role))
        return Response.json({ error: "Chỉ GVCN/nhà trường được xác nhận lịch" }, { status: 403 });
      const confirmedDate = String(body.date || item.requested_date || "").slice(0, 10);
      const confirmedTime = String(body.time || item.requested_time || "").slice(0, 5);
      await env.DB.prepare("UPDATE family_appointments SET status=?, confirmed_date=?, confirmed_time=?, reviewed_by=?, reviewed_at=? WHERE id=?")
        .bind(status, status === "Đã xác nhận" ? confirmedDate : item.confirmed_date || "", status === "Đã xác nhận" ? confirmedTime : item.confirmed_time || "", user.id, `${vnToday()} ${vnNow()}`, id).run();
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
