"use client";

import { useEffect, useMemo, useState } from "react";

type Child = { id: number; name: string; className: string };
type Task = { id: number; title: string; detail: string; due_date: string; status: string };
type Appointment = { id: number; mode: string; requested_date: string; requested_time: string; confirmed_date: string; confirmed_time: string; topic: string; note: string; status: string; requested_role: string };
type Timeline = { type: string; id: number; at: string; title: string; detail: string; role?: string; acknowledged?: boolean };
type Data = {
  role: string;
  date: string;
  child: Child | null;
  children: Child[];
  today: { attendance: any; log: any } | null;
  tasks: Task[];
  appointments: Appointment[];
  timeline: Timeline[];
  reactions: string[];
  appointmentModes: string[];
};

const tabs = [
  ["today", "Hôm nay của bé"],
  ["timeline", "Dòng thời gian"],
  ["tasks", "Việc cần làm"],
  ["appointments", "Lịch hẹn"],
] as const;

function todayIso() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function boxStyle(): React.CSSProperties {
  return { background: "#fff", border: "1px solid #dfe9e5", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px rgba(15,71,61,.06)" };
}

export default function FamilyConnectionPage() {
  const [data, setData] = useState<Data | null>(null);
  const [childId, setChildId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("today");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load(nextChildId = childId, nextDate = date) {
    setLoading(true);
    setMessage("");
    try {
      const q = new URLSearchParams({ date: nextDate });
      if (nextChildId) q.set("childId", nextChildId);
      const r = await fetch(`/api/family-connection?${q}`, { cache: "no-store" });
      const d = await r.json();
      if (r.status === 401) {
        location.href = "/";
        return;
      }
      if (!r.ok) throw new Error(d.error || "Không tải được dữ liệu");
      setData(d);
      if (!nextChildId && d.child?.id) setChildId(String(d.child.id));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load("", date); }, []);
  useEffect(() => { if (childId) void load(childId, date); }, [childId, date]);

  const isStaff = data?.role === "teacher" || data?.role === "admin";
  const pendingTasks = useMemo(() => data?.tasks.filter((x) => x.status !== "Đã hoàn thành") || [], [data]);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/family-connection", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: Number(childId), ...body }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Không lưu được");
    await load();
  }

  async function patch(body: Record<string, unknown>) {
    const r = await fetch("/api/family-connection", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Không cập nhật được");
    await load();
  }

  async function feedback(reaction: string) {
    try {
      const note = reaction === "Trao đổi với cô" ? window.prompt("Nội dung muốn trao đổi với GVCN:") || "" : "";
      if (reaction === "Trao đổi với cô" && !note.trim()) return;
      await post({ action: "feedback", reaction, note, sourceType: "daily_log" });
      setMessage("Đã gửi phản hồi đến GVCN.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Không gửi được phản hồi"); }
  }

  async function createTask(form: FormData) {
    try {
      await post({ action: "task", title: form.get("title"), detail: form.get("detail"), dueDate: form.get("dueDate") });
      setMessage("Đã giao việc cho phụ huynh.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Không tạo được việc"); }
  }

  async function createAppointment(form: FormData) {
    try {
      await post({ action: "appointment", mode: form.get("mode"), date: form.get("date"), time: form.get("time"), topic: form.get("topic"), note: form.get("note") });
      setMessage("Đã gửi đề nghị lịch hẹn.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Không tạo được lịch hẹn"); }
  }

  const attendance = data?.today?.attendance;
  const log = data?.today?.log;

  return (
    <main style={{ minHeight: "100vh", background: "#f4f8f7", color: "#173b34", fontFamily: "Arial, sans-serif", padding: "18px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <a href="/" style={{ textDecoration: "none", color: "#087e66", fontWeight: 800 }}>← Mầm Non Yêu Thương</a>
            <h1 style={{ margin: "8px 0 4px", fontSize: 30 }}>Kết nối gia đình</h1>
            <p style={{ margin: 0, color: "#60766f" }}>Một nơi để GVCN và phụ huynh cùng theo dõi, phản hồi và phối hợp chăm sóc trẻ.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select value={childId} onChange={(e) => setChildId(e.target.value)} style={{ minHeight: 44, padding: "8px 12px", border: "1px solid #cddbd6", borderRadius: 12, background: "#fff" }}>
              {(data?.children || []).map((x) => <option value={x.id} key={x.id}>{x.name} · {x.className}</option>)}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ minHeight: 44, padding: "8px 12px", border: "1px solid #cddbd6", borderRadius: 12, background: "#fff" }} />
          </div>
        </header>

        <nav style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }}>
          {tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} style={{ border: 0, borderRadius: 999, padding: "11px 16px", whiteSpace: "nowrap", fontWeight: 800, background: tab === key ? "#087e66" : "#e4efeb", color: tab === key ? "#fff" : "#244c43" }}>{label}{key === "tasks" && pendingTasks.length ? ` (${pendingTasks.length})` : ""}</button>)}
        </nav>

        {message && <div style={{ ...boxStyle(), marginBottom: 14, background: "#fff8db", borderColor: "#f1dfa0" }}>{message}</div>}
        {loading && <div style={boxStyle()}>Đang tải dữ liệu…</div>}
        {!loading && !data?.child && <div style={boxStyle()}>Tài khoản chưa có trẻ/lớp được liên kết.</div>}

        {!loading && data?.child && tab === "today" && <section style={{ display: "grid", gap: 14 }}>
          <div style={boxStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><small style={{ color: "#6e827c" }}>HÔM NAY CỦA BÉ</small><h2 style={{ margin: "5px 0" }}>{data.child.name}</h2><span>{data.child.className} · {date}</span></div>
              <div style={{ fontWeight: 800, padding: "10px 14px", borderRadius: 14, background: attendance ? "#eaf7ef" : "#f3f4f4" }}>{attendance?.status || "Chưa ghi điểm danh"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {[ ["Giờ đến", attendance?.check_in_at || "—"], ["Giờ về", attendance?.check_out_at || "—"], ["Bữa sáng", log?.breakfast || "—"], ["Bữa trưa", log?.lunch || "—"], ["Bữa xế", log?.snack || "—"], ["Giấc ngủ", log?.sleep ? `${log.sleep}${log.sleep_minutes ? ` · ${log.sleep_minutes} phút` : ""}` : "—"], ["Tâm trạng", log?.mood || "—"], ["Sức khỏe", log?.health || "—"] ].map(([label, value]) => <article key={label} style={boxStyle()}><small style={{ color: "#728781", fontWeight: 700 }}>{label}</small><div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>{value}</div></article>)}
          </div>
          {log?.note && <div style={boxStyle()}><b>Ghi chú của cô</b><p style={{ marginBottom: 0, lineHeight: 1.6 }}>{log.note}</p></div>}
          <div style={boxStyle()}>
            <b>Phản hồi nhanh</b>
            <p style={{ color: "#657b74" }}>Phụ huynh có thể phản hồi ngay dưới thông tin trong ngày; GVCN sẽ thấy trong dòng thời gian của trẻ.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(data.reactions || []).map((x) => <button key={x} onClick={() => void feedback(x)} style={{ padding: "10px 14px", border: "1px solid #bcd4cb", borderRadius: 12, background: "#fff", fontWeight: 700 }}>{x}</button>)}</div>
          </div>
        </section>}

        {!loading && data?.child && tab === "timeline" && <section style={{ display: "grid", gap: 10 }}>
          {(data.timeline || []).length === 0 ? <div style={boxStyle()}>Chưa có hoạt động trao đổi.</div> : data.timeline.map((x, i) => <article key={`${x.type}-${x.id}-${i}`} style={boxStyle()}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><b>{x.title}</b><small style={{ color: "#758983" }}>{x.at || ""}</small></div><p style={{ margin: "8px 0 0", lineHeight: 1.55 }}>{x.detail}</p></article>)}
        </section>}

        {!loading && data?.child && tab === "tasks" && <section style={{ display: "grid", gap: 14 }}>
          {isStaff && <form action={(fd) => void createTask(fd)} style={boxStyle()}>
            <h2 style={{ marginTop: 0 }}>Giao việc cho phụ huynh</h2>
            <div style={{ display: "grid", gap: 10 }}><input name="title" required placeholder="Ví dụ: Mang 2 bộ quần áo dự phòng" style={{ minHeight: 44, padding: 10, border: "1px solid #ccd9d5", borderRadius: 10 }} /><textarea name="detail" placeholder="Ghi chú thêm" rows={3} style={{ padding: 10, border: "1px solid #ccd9d5", borderRadius: 10 }} /><label>Hạn hoàn thành <input name="dueDate" type="date" style={{ marginLeft: 8, minHeight: 40, padding: 8, border: "1px solid #ccd9d5", borderRadius: 10 }} /></label><button style={{ width: "fit-content", padding: "11px 16px", border: 0, borderRadius: 12, background: "#087e66", color: "#fff", fontWeight: 800 }}>Giao việc</button></div>
          </form>}
          {(data.tasks || []).map((x) => <article key={x.id} style={boxStyle()}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><b>{x.title}</b><p style={{ margin: "6px 0", color: "#60766f" }}>{x.detail || "Không có ghi chú"}</p><small>{x.due_date ? `Hạn: ${x.due_date}` : "Không đặt hạn"}</small></div><button onClick={() => void patch({ action: "task-status", id: x.id, status: x.status === "Đã hoàn thành" ? "Chưa làm" : "Đã hoàn thành" })} style={{ height: 42, padding: "0 14px", border: 0, borderRadius: 12, background: x.status === "Đã hoàn thành" ? "#e4efeb" : "#ff8f70", color: x.status === "Đã hoàn thành" ? "#244c43" : "#fff", fontWeight: 800 }}>{x.status}</button></div></article>)}
        </section>}

        {!loading && data?.child && tab === "appointments" && <section style={{ display: "grid", gap: 14 }}>
          <form action={(fd) => void createAppointment(fd)} style={boxStyle()}>
            <h2 style={{ marginTop: 0 }}>Đề nghị lịch trao đổi</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
              <select name="mode" style={{ minHeight: 44, padding: 9, border: "1px solid #ccd9d5", borderRadius: 10 }}>{(data.appointmentModes || []).map((x) => <option key={x}>{x}</option>)}</select>
              <input name="date" type="date" required min={todayIso()} style={{ minHeight: 44, padding: 9, border: "1px solid #ccd9d5", borderRadius: 10 }} />
              <input name="time" type="time" required style={{ minHeight: 44, padding: 9, border: "1px solid #ccd9d5", borderRadius: 10 }} />
              <input name="topic" placeholder="Nội dung cần trao đổi" style={{ minHeight: 44, padding: 9, border: "1px solid #ccd9d5", borderRadius: 10 }} />
            </div>
            <textarea name="note" rows={3} placeholder="Ghi chú" style={{ width: "100%", boxSizing: "border-box", marginTop: 10, padding: 10, border: "1px solid #ccd9d5", borderRadius: 10 }} />
            <button style={{ marginTop: 10, padding: "11px 16px", border: 0, borderRadius: 12, background: "#087e66", color: "#fff", fontWeight: 800 }}>Gửi đề nghị</button>
          </form>
          {(data.appointments || []).map((x) => <article key={x.id} style={boxStyle()}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><b>{x.mode} · {x.status}</b><p style={{ margin: "6px 0" }}>{x.confirmed_date || x.requested_date} {x.confirmed_time || x.requested_time}</p><small>{x.topic || "Trao đổi về trẻ"}{x.note ? ` · ${x.note}` : ""}</small></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{isStaff && x.status === "Chờ xác nhận" && <><button onClick={() => void patch({ action: "appointment-status", id: x.id, status: "Đã xác nhận" })} style={{ padding: "9px 12px", border: 0, borderRadius: 10, background: "#087e66", color: "white", fontWeight: 800 }}>Xác nhận</button><button onClick={() => void patch({ action: "appointment-status", id: x.id, status: "Từ chối" })} style={{ padding: "9px 12px", border: 0, borderRadius: 10, background: "#e9eeec", color: "#314c45", fontWeight: 800 }}>Từ chối</button></>}</div></div></article>)}
        </section>}
      </div>
    </main>
  );
}
