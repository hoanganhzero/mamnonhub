"use client";
import { useEffect, useState } from "react";
import "./chibi.css";
import * as XLSX from "xlsx";

const kids = [
  ["🌸", "Nguyễn Gia Hân", "Ăn sáng tốt", "Đã đến"],
  ["🦕", "Trần Minh Khang", "Ngủ đủ giấc", "Đã đến"],
  ["🌈", "Lê Bảo Ngọc", "Nghỉ ốm", "Xin nghỉ"],
  ["🚀", "Phạm Đức Anh", "Vui vẻ", "Đã đến"],
];
const nav = [
  ["🏡", "Tổng quan"],
  ["🧒", "Hồ sơ trẻ"],
  ["🙋", "Điểm danh"],
  ["💗", "Ăn · Ngủ · Sức khỏe"],
  ["📔", "Nhật ký lớp"],
  ["🍱", "Thực đơn"],
  ["📣", "Thông báo"],
  ["🧸", "Thiết lập"],
];
const iconMap: Record<string, string> = {
  "🏡": "dashboard",
  "🏫": "school",
  "🌈": "classroom",
  "👩🏻‍🏫": "teacher",
  "🧒": "child",
  "👧": "child",
  "♙": "child",
  "🙋": "attendance",
  "✓": "attendance",
  "👨‍👩‍👧": "family",
  "📣": "megaphone",
  "🍱": "meal",
  "🍚": "meal",
  "🍲": "meal",
  "🥣": "meal",
  "🥛": "meal",
  "😴": "sleep",
  "☁️": "sleep",
  "💗": "health",
  "♥": "health",
  "📔": "diary",
  "✎": "diary",
  "📊": "report",
  "⇧": "import",
  "🔐": "account",
  "👤": "account",
  "🧸": "settings",
  "⚙": "settings",
  "◷": "report",
  "🕘": "report",
};
function ChibiIcon({
  icon,
  className = "",
}: {
  icon: string;
  className?: string;
}) {
  const name = iconMap[icon] || icon;
  return (
    <span aria-hidden="true" className={`chibi chibi-${name} ${className}`} />
  );
}

export default function Home() {
  const [role, setRole] = useState<"admin" | "teacher" | "parent">("teacher"),
    [active, setActive] = useState("Tổng quan"),
    [setup, setSetup] = useState(false),
    [profileOpen, setProfileOpen] = useState(false),
    [toast, setToast] = useState(""),
    [authUser, setAuthUser] = useState<AuthUser | null>(null),
    [schoolBrand, setSchoolBrand] = useState<any>(null),
    [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setAuthUser(d.user);
          setRole(
            d.user.role === "superadmin" || d.user.role === "admin"
              ? "admin"
              : d.user.role,
          );
        }
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    if (authUser?.schoolId)
      fetch("/api/schools")
        .then((r) => r.json())
        .then((d) => setSchoolBrand(d.schools?.[0] || null));
    else setSchoolBrand(null);
  }, [authUser?.schoolId]);
  const ping = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2200);
  };
  if (!authReady)
    return (
      <div className="auth-loading">
        <img src="/loading-logo.png" alt="Logo Mầm Non Yêu Thương" />
        <p>Đang mở Mầm Non Yêu Thương…</p>
      </div>
    );
  if (!authUser)
    return (
      <AuthScreen
        onLogin={(u) => {
          setAuthUser(u);
          setRole(
            u.role === "superadmin" || u.role === "admin" ? "admin" : u.role,
          );
        }}
      />
    );
  const navItems =
    authUser.role === "superadmin"
      ? [
          ["🏡", "Tổng quan"],
          ["🏫", "Trường học"],
          ["🔐", "Tài khoản"],
          ["📊", "Báo cáo"],
        ]
      : authUser.role === "admin"
        ? [
            ["🏡", "Tổng quan"],
            ["👩🏻‍🏫", "Tài khoản"],
            ["🏫", "Thiết lập"],
            ["📣", "Thông báo"],
          ]
        : authUser.role === "teacher"
          ? [
              ["🏡", "Tổng quan"],
              ["🧒", "Hồ sơ trẻ"],
              ["🙋", "Điểm danh"],
              ["👨‍👩‍👧", "Phụ huynh"],
              ["📣", "Thông báo"],
            ]
          : [
              ["🏡", "Tổng quan"],
              ["📣", "Thông báo"],
            ];
  return (
    <main className="shell">
      <aside>
        <div className="brand">
          <img
            src={
              schoolBrand?.logoKey
                ? `/api/branding?key=${encodeURIComponent(schoolBrand.logoKey)}`
                : "/mam-non-yeu-thuong-logo.png"
            }
            alt={schoolBrand?.name || "Mầm Non Yêu Thương"}
          />
        </div>
        <div className="school">
          <ChibiIcon icon="🏫" />
          <div>
            <b>{authUser.schoolName}</b>
            <small>
              {authUser.academicYear
                ? `Năm học ${authUser.academicYear}`
                : "Quản lý toàn hệ thống"}
            </small>
          </div>
        </div>
        <nav>
          {navItems.map(([i, n]) => (
            <button
              className={active === n ? "on" : ""}
              key={n}
              onClick={() => {
                setActive(n);
              }}
            >
              <i>
                <ChibiIcon icon={i} />
              </i>
              {n}
              {n === "Thông báo" && <em>3</em>}
            </button>
          ))}
        </nav>
        <div className="help">
          <ChibiIcon icon="🔐" />
          <div>
            <b>Cần hỗ trợ?</b>
            <small>Liên hệ quản trị nhà trường</small>
          </div>
        </div>
      </aside>
      <section className="work">
        <header>
          <div className="class">
            <small>
              {authUser.role === "superadmin"
                ? "Trung tâm điều hành"
                : role === "admin"
                  ? "Quản trị trường"
                  : "Lớp đang quản lý"}
            </small>
            <b>
              {authUser.role === "superadmin"
                ? "Tất cả trường"
                : role === "admin"
                  ? authUser.schoolName
                  : "Lớp đang phụ trách"}
            </b>
          </div>
          <div className="tools">
            <button className="bell" aria-label="Thông báo">
              <ChibiIcon icon="📣" />
              <em>3</em>
            </button>
            <span className="role-pill">
              {authUser.role === "superadmin"
                ? "Quản trị tối cao"
                : authUser.role === "admin"
                  ? "Quản trị trường"
                  : role === "teacher"
                    ? "Giáo viên"
                    : "Phụ huynh"}
            </span>
            <button
              className="user user-button"
              onClick={() => setProfileOpen(true)}
            >
              {authUser.avatarKey ? (
                <img
                  src={`/api/avatar?key=${encodeURIComponent(authUser.avatarKey)}`}
                  alt="Ảnh đại diện"
                />
              ) : (
                <i>
                  <ChibiIcon
                    icon={
                      role === "admin" ? "🔐" : role === "teacher" ? "👩🏻‍🏫" : "👨‍👩‍👧"
                    }
                  />
                </i>
              )}
              <div>
                <b>{authUser.fullName}</b>
                <small>@{authUser.username} · Chỉnh hồ sơ</small>
              </div>
            </button>
            <button
              className="logout"
              onClick={async () => {
                await fetch("/api/auth", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action: "logout" }),
                });
                setAuthUser(null);
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <div className="content">
          {schoolBrand?.bannerKey && (
            <img
              className="school-banner"
              src={`/api/branding?key=${encodeURIComponent(schoolBrand.bannerKey)}`}
              alt={`Banner ${schoolBrand.name}`}
            />
          )}
          {role === "admin" ? (
            authUser.role === "superadmin" ? (
              <SuperAdmin active={active} setActive={setActive} ping={ping} />
            ) : (
              <Admin active={active} setActive={setActive} ping={ping} />
            )
          ) : role === "teacher" ? (
            <TeacherArea active={active} ping={ping} />
          ) : (
            <Parent active={active} ping={ping} />
          )}
        </div>
        <div className="mobile-nav">
          {navItems.slice(0, 5).map(([i, n]) => (
            <button
              className={active === n ? "on" : ""}
              key={n}
              onClick={() => setActive(n)}
            >
              <i>
                <ChibiIcon icon={i} />
              </i>
              {n.split(" ")[0]}
            </button>
          ))}
        </div>
      </section>
      {setup && (
        <div className="back" onClick={() => setSetup(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setSetup(false);
              ping("Đã lưu cấu hình nhà trường");
            }}
          >
            <button type="button" className="x" onClick={() => setSetup(false)}>
              ×
            </button>
            <i className="big">
              <ChibiIcon icon="🏫" />
            </i>
            <h2>Thiết lập nhà trường</h2>
            <p>Thông tin dùng chung cho các lớp và báo cáo.</p>
            <label>
              Tên trường
              <input defaultValue="Trường Mầm non Hoa Nắng" />
            </label>
            <div className="row">
              <label>
                Năm học
                <select defaultValue="2026–2027">
                  <option>2026–2027</option>
                  <option>2027–2028</option>
                </select>
              </label>
              <label>
                Tên lớp
                <input defaultValue="Lá 1" />
              </label>
            </div>
            <div className="row">
              <label>
                Độ tuổi
                <select>
                  <option>5–6 tuổi</option>
                  <option>4–5 tuổi</option>
                  <option>3–4 tuổi</option>
                  <option>Nhà trẻ</option>
                </select>
              </label>
              <label>
                Giáo viên chủ nhiệm
                <input defaultValue="Nguyễn Minh Thư" />
              </label>
            </div>
            <button className="save">Lưu thiết lập</button>
          </form>
        </div>
      )}
      {profileOpen && (
        <ProfileModal
          user={authUser}
          close={() => setProfileOpen(false)}
          updated={(u) => {
            setAuthUser(u);
            ping("Đã cập nhật thông tin cá nhân");
          }}
          logout={() => setAuthUser(null)}
        />
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: "superadmin" | "admin" | "teacher" | "parent";
  status: string;
  phone?: string;
  address?: string;
  avatarKey?: string | null;
  fatherName?: string;
  fatherBirthDate?: string;
  fatherJob?: string;
  fatherPhone?: string;
  motherName?: string;
  motherBirthDate?: string;
  motherJob?: string;
  motherPhone?: string;
  zaloPhone?: string;
  schoolId?: number | null;
  schoolName: string;
  schoolCode: string;
  academicYear: string;
};
function AuthScreen({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, action: "login" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Không thể đăng nhập");
      onLogin(d.user);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="auth-brand">
          <img src="/mam-non-yeu-thuong-logo.png" alt="Mầm Non Yêu Thương" />
        </div>
        <div className="auth-scene">
          <img
            src="/truong-mam-non.png"
            alt="Khung cảnh trường mầm non thân thiện"
          />
        </div>
        <h1>
          Kết nối yêu thương
          <br />
          mỗi ngày đến lớp
        </h1>
        <p>
          Hệ thống quản lý nội bộ dành cho nhà trường, giáo viên và phụ huynh đã
          được cấp tài khoản.
        </p>
      </section>
      <section className="auth-form">
        <div className="mobile-auth-brand">
          <img src="/mam-non-yeu-thuong-logo.png" alt="Mầm Non Yêu Thương" />
        </div>
        <div className="auth-card">
          <h2>Chào mừng trở lại!</h2>
          <p>Nhập tên đăng nhập và mật khẩu do đơn vị quản lý cấp.</p>
          <form onSubmit={submit}>
            <label>
              Tên đăng nhập
              <input
                name="username"
                autoComplete="username"
                placeholder="Tên đăng nhập"
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Mật khẩu"
                required
                minLength={8}
              />
            </label>
            {error && <div className="auth-error">⚠ {error}</div>}
            {message && <div className="auth-success">✓ {message}</div>}
            <button className="auth-submit" disabled={busy}>
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
          <button
            type="button"
            className="forgot"
            onClick={() => {
              setError("");
              setMessage(
                "Vui lòng liên hệ người đã cấp tài khoản để đặt lại mật khẩu.",
              );
            }}
          >
            Quên mật khẩu?
          </button>
        </div>
        <small className="auth-note">
          Không đăng ký công khai. Tài khoản được cấp theo đúng cấp quản lý.
        </small>
      </section>
    </main>
  );
}

function ProfileModal({
  user,
  close,
  updated,
  logout,
}: {
  user: AuthUser;
  close: () => void;
  updated: (u: AuthUser) => void;
  logout: () => void;
}) {
  const [tab, setTab] = useState<"info" | "password">("info"),
    [error, setError] = useState("");
  async function info(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget),
      body = Object.fromEntries(f);
    const file = f.get("avatar");
    if (file instanceof File && file.size) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("scope", "profile");
      const ur = await fetch("/api/avatar", { method: "POST", body: fd }),
        ud = await ur.json();
      if (!ur.ok) {
        setError(ud.error);
        return;
      }
      user = ud.user;
    }
    const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, action: "update-profile" }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    updated({ ...d.user, avatarKey: user.avatarKey });
    close();
  }
  async function password(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    if (f.get("newPassword") !== f.get("confirm")) {
      setError("Mật khẩu nhập lại chưa khớp");
      return;
    }
    const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(f),
          action: "change-password",
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    logout();
  }
  return (
    <div className="back" onClick={close}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>
        <h2>Hồ sơ cá nhân</h2>
        <p>Tự cập nhật thông tin và bảo mật tài khoản.</p>
        <div className="profile-tabs">
          <button
            className={tab === "info" ? "on" : ""}
            onClick={() => setTab("info")}
          >
            Thông tin cá nhân
          </button>
          <button
            className={tab === "password" ? "on" : ""}
            onClick={() => setTab("password")}
          >
            Đổi mật khẩu
          </button>
        </div>
        {tab === "info" ? (
          <form onSubmit={info}>
            <div className="avatar-editor">
              {user.avatarKey ? (
                <img
                  src={`/api/avatar?key=${encodeURIComponent(user.avatarKey)}`}
                  alt="Ảnh đại diện"
                />
              ) : (
                <i>👤</i>
              )}
              <label>
                Chọn ảnh mới
                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp"
                />
              </label>
            </div>
            <label>
              Họ và tên
              <input name="fullName" defaultValue={user.fullName} required />
            </label>
            <div className="row">
              <label>
                Tên đăng nhập
                <input value={user.username} disabled />
              </label>
              <label>
                Số điện thoại
                <input name="phone" defaultValue={user.phone || ""} />
              </label>
            </div>
            <label>
              Địa chỉ
              <input name="address" defaultValue={user.address || ""} />
            </label>
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="save">Lưu thay đổi</button>
          </form>
        ) : (
          <form onSubmit={password}>
            <label>
              Mật khẩu hiện tại
              <input type="password" name="currentPassword" required />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                name="newPassword"
                minLength={8}
                required
              />
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input type="password" name="confirm" minLength={8} required />
            </label>
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="save">Đổi mật khẩu</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Hero({
  parent = false,
  ping,
}: {
  parent?: boolean;
  ping: (s: string) => void;
}) {
  return (
    <section className="hero">
      <div>
        <p>
          {parent ? "Không gian của phụ huynh" : "Thứ Sáu, 21 tháng 8, 2026"}
        </p>
        <h1>
          {parent ? "Hôm nay của Gia Hân 🌸" : "Chào buổi sáng, Cô Thư! 🌻"}
        </h1>
        <p>
          {parent
            ? "Cùng theo dõi những khoảnh khắc đáng yêu của con tại trường."
            : "Chúc cô và các con có một ngày thật vui tại lớp Lá 1."}
        </p>
      </div>
      <button
        onClick={() =>
          ping(
            parent
              ? "Đã mở trò chuyện với cô giáo"
              : "Đã mở sổ điểm danh hôm nay",
          )
        }
      >
        {parent ? "💌 Nhắn cô giáo" : "🙋 Điểm danh ngay"}
      </button>
    </section>
  );
}
const statTeacher = [
  ["🧒", "SĨ SỐ LỚP", "28 trẻ", "14 nam · 14 nữ", "pink"],
  ["🙋", "ĐÃ ĐẾN LỚP", "25 trẻ", "↑ 89% có mặt", "green"],
  ["☁️", "XIN NGHỈ", "3 trẻ", "2 có phép · 1 chưa báo", "yellow"],
  ["💗", "CẦN LƯU Ý", "2 trẻ", "Dị ứng · Sức khỏe", "blue"],
];
function Stats({ parent = false }: { parent?: boolean }) {
  const data = parent
    ? [
        ["🙋", "ĐẾN LỚP", "07:12", "Cô Thư đã đón bé", "green"],
        ["🍚", "BỮA TRƯA", "Ăn hết", "1 suất · Uống đủ nước", "yellow"],
        ["😴", "GIẤC NGỦ", "1h 35p", "Ngủ ngon, đúng giờ", "blue"],
        ["🥰", "TÂM TRẠNG", "Vui vẻ", "Hòa đồng cùng các bạn", "pink"],
      ]
    : statTeacher;
  return (
    <section className="stats">
      {data.map(([i, l, v, p, c]) => (
        <article key={l}>
          <i className={c}>
            <ChibiIcon icon={i} />
          </i>
          <div>
            <small>{l}</small>
            <b>{v}</b>
            <p>{p}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
function TeacherArea({
  active,
  ping,
}: {
  active: string;
  ping: (s: string) => void;
}) {
  if (active === "Hồ sơ trẻ") return <ChildrenManager ping={ping} />;
  if (active === "Điểm danh") return <Attendance ping={ping} />;
  if (active === "Phụ huynh")
    return <AccountManager ping={ping} back={() => {}} />;
  if (active === "Thông báo") return <Notices ping={ping} />;
  if (active === "Thiết lập") return <SchoolSetup ping={ping} />;
  return <Teacher ping={ping} />;
}

function PageHead({
  icon,
  title,
  sub,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="pagehead">
      <div className="pageicon">
        <ChibiIcon icon={icon} />
      </div>
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action && <button onClick={onClick}>＋ {action}</button>}
    </div>
  );
}

type SchoolSummary = {
  id: number;
  code: string;
  name: string;
  academicYear: string;
  status: string;
  children: number;
  teachers: number;
  parents: number;
  admins: number;
  pending: number;
  announcements: number;
};
type SystemStatsData = {
  totals: {
    schools: number;
    activeSchools: number;
    children: number;
    teachers: number;
    parents: number;
    pending: number;
    announcements: number;
  };
  perSchool: SchoolSummary[];
};
function SuperAdmin({
  active,
  setActive,
  ping,
}: {
  active: string;
  setActive: (s: string) => void;
  ping: (s: string) => void;
}) {
  const [data, setData] = useState<SystemStatsData | null>(null);
  const load = () =>
    fetch("/api/system-stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.totals) setData(d);
      });
  useEffect(() => {
    load();
  }, []);
  if (active === "Trường học")
    return (
      <SchoolManager
        ping={ping}
        back={() => {
          setActive("Tổng quan");
          load();
        }}
      />
    );
  if (active === "Tài khoản")
    return <AccountManager ping={ping} back={() => setActive("Tổng quan")} />;
  if (!data)
    return (
      <div className="panel empty">Đang tổng hợp dữ liệu toàn hệ thống…</div>
    );
  const exportReport = () => {
    const head = [
        "Mã trường",
        "Tên trường",
        "Năm học",
        "Trẻ",
        "Giáo viên",
        "Phụ huynh",
        "Quản trị",
        "Chờ duyệt",
        "Thông báo",
        "Trạng thái",
      ],
      rows = data.perSchool.map((s) => [
        s.code,
        s.name,
        s.academicYear,
        s.children,
        s.teachers,
        s.parents,
        s.admins,
        s.pending,
        s.announcements,
        s.status === "active" ? "Hoạt động" : "Đã khóa",
      ]),
      csv =
        "\uFEFF" +
        [head, ...rows]
          .map((r) =>
            r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
          )
          .join("\n"),
      url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "bao-cao-toan-he-thong.csv";
    a.click();
    URL.revokeObjectURL(url);
    ping("Đã xuất báo cáo toàn hệ thống");
  };
  if (active === "Báo cáo")
    return (
      <>
        <PageHead
          icon="📊"
          title="Báo cáo toàn hệ thống"
          sub="So sánh quy mô và tình trạng hoạt động giữa các trường"
          action="Xuất báo cáo"
          onClick={exportReport}
        />
        <SystemSchoolTable rows={data.perSchool} />
      </>
    );
  return (
    <>
      <div className="system-hero">
        <div>
          <small>TRUNG TÂM ĐIỀU HÀNH</small>
          <h1>Quản trị toàn hệ thống</h1>
          <p>Theo dõi và kiểm soát độc lập mọi trường trên một dashboard.</p>
        </div>
        <button onClick={() => setActive("Trường học")}>＋ Thêm trường</button>
      </div>
      <section className="system-stats">
        <article>
          <i>
            <ChibiIcon icon="🏫" />
          </i>
          <div>
            <small>TỔNG SỐ TRƯỜNG</small>
            <b>{data.totals.schools}</b>
            <p>{data.totals.activeSchools} trường đang hoạt động</p>
          </div>
        </article>
        <article>
          <i>
            <ChibiIcon icon="🧒" />
          </i>
          <div>
            <small>TỔNG SỐ TRẺ</small>
            <b>{data.totals.children}</b>
            <p>Dữ liệu liên trường</p>
          </div>
        </article>
        <article>
          <i>
            <ChibiIcon icon="👩🏻‍🏫" />
          </i>
          <div>
            <small>GIÁO VIÊN</small>
            <b>{data.totals.teachers}</b>
            <p>Tài khoản giáo viên</p>
          </div>
        </article>
        <article>
          <i>
            <ChibiIcon icon="👨‍👩‍👧" />
          </i>
          <div>
            <small>PHỤ HUYNH</small>
            <b>{data.totals.parents}</b>
            <p>Tài khoản phụ huynh</p>
          </div>
        </article>
        <article className={data.totals.pending ? "attention" : ""}>
          <i>
            <ChibiIcon icon="📊" />
          </i>
          <div>
            <small>CHỜ PHÊ DUYỆT</small>
            <b>{data.totals.pending}</b>
            <p>Cần xử lý tài khoản</p>
          </div>
        </article>
      </section>
      <section className="system-actions">
        <button onClick={() => setActive("Trường học")}>
          <i>
            <ChibiIcon icon="🏫" />
          </i>
          <b>Quản lý trường</b>
          <small>Tạo, khóa và cấu hình từng trường</small>
        </button>
        <button onClick={() => setActive("Tài khoản")}>
          <i>
            <ChibiIcon icon="🔐" />
          </i>
          <b>Tài khoản toàn hệ thống</b>
          <small>Duyệt và phân quyền theo trường</small>
        </button>
        <button onClick={() => setActive("Báo cáo")}>
          <i>
            <ChibiIcon icon="📊" />
          </i>
          <b>Báo cáo liên trường</b>
          <small>So sánh và xuất dữ liệu tổng hợp</small>
        </button>
      </section>
      <div className="system-grid">
        <div>
          <div className="section-head">
            <div>
              <h2>Tổng quan từng trường</h2>
              <p>Dữ liệu được tổng hợp trực tiếp từ hệ thống</p>
            </div>
            <button onClick={() => setActive("Báo cáo")}>Xem báo cáo →</button>
          </div>
          <SystemSchoolTable rows={data.perSchool} />
        </div>
        <aside className="panel system-health">
          <h2>Tình trạng hệ thống</h2>
          <div>
            <span>Trường hoạt động</span>
            <b>
              {data.totals.activeSchools}/{data.totals.schools}
            </b>
          </div>
          <div>
            <span>Tài khoản chờ duyệt</span>
            <b className={data.totals.pending ? "warn-text" : ""}>
              {data.totals.pending}
            </b>
          </div>
          <div>
            <span>Thông báo đã gửi</span>
            <b>{data.totals.announcements}</b>
          </div>
          <hr />
          <small>
            ✓ Dữ liệu từng trường được phân tách và kiểm soát theo quyền truy
            cập.
          </small>
        </aside>
      </div>
    </>
  );
}
function SystemSchoolTable({ rows }: { rows: SchoolSummary[] }) {
  return (
    <div className="panel tablewrap system-table">
      <table>
        <thead>
          <tr>
            <th>TRƯỜNG</th>
            <th>MÃ TRƯỜNG</th>
            <th>TRẺ</th>
            <th>GIÁO VIÊN</th>
            <th>PHỤ HUYNH</th>
            <th>CHỜ DUYỆT</th>
            <th>TRẠNG THÁI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>
                <b>{s.name}</b>
                <small>Năm học {s.academicYear}</small>
              </td>
              <td>
                <span className="tag ok">{s.code}</span>
              </td>
              <td>
                <b>{s.children}</b>
              </td>
              <td>{s.teachers}</td>
              <td>{s.parents}</td>
              <td>
                <span className={s.pending ? "tag warn" : "tag ok"}>
                  {s.pending}
                </span>
              </td>
              <td>
                <span
                  className={
                    s.status === "active" ? "status-dot active" : "status-dot"
                  }
                >
                  {s.status === "active" ? "Hoạt động" : "Đã khóa"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty">Chưa có dữ liệu trường.</div>}
    </div>
  );
}

function Admin({
  active,
  setActive,
  ping,
}: {
  active: string;
  setActive: (s: string) => void;
  ping: (s: string) => void;
}) {
  if (active === "Tài khoản")
    return <AccountManager ping={ping} back={() => setActive("Tổng quan")} />;
  if (active === "Thiết lập") return <SchoolSetup ping={ping} />;
  if (active === "Hồ sơ trẻ") return <ChildrenManager ping={ping} />;
  if (active === "Điểm danh") return <Attendance ping={ping} />;
  if (active === "Thông báo") return <Notices ping={ping} />;
  return <SchoolAdminDashboard setActive={setActive} />;
}

function SchoolAdminDashboard({
  setActive,
}: {
  setActive: (s: string) => void;
}) {
  const [children, setChildren] = useState<Child[]>([]),
    [users, setUsers] = useState<ManagedUser[]>([]);
  useEffect(() => {
    fetch("/api/children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children || []));
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  }, []);
  const teachers = users.filter((x) => x.role === "teacher"),
    parents = users.filter((x) => x.role === "parent"),
    classes = new Map<string, number>();
  children.forEach((x) =>
    classes.set(
      x.className || "Chưa xếp lớp",
      (classes.get(x.className || "Chưa xếp lớp") || 0) + 1,
    ),
  );
  return (
    <>
      <PageHead
        icon="🏫"
        title="Điều hành nhà trường"
        sub="Dữ liệu thực tế trong phạm vi trường"
      />
      <section className="stats">
        <article>
          <i className="pink">
            <ChibiIcon icon="🧒" />
          </i>
          <div>
            <small>TỔNG SỐ TRẺ</small>
            <b>{children.length}</b>
            <p>{classes.size} lớp có dữ liệu</p>
          </div>
        </article>
        <article>
          <i className="green">
            <ChibiIcon icon="👩🏻‍🏫" />
          </i>
          <div>
            <small>GIÁO VIÊN</small>
            <b>{teachers.length}</b>
            <p>
              {teachers.filter((x) => x.status === "active").length} đang hoạt
              động
            </p>
          </div>
        </article>
        <article>
          <i className="blue">
            <ChibiIcon icon="👨‍👩‍👧" />
          </i>
          <div>
            <small>PHỤ HUYNH</small>
            <b>{parents.length}</b>
            <p>
              {parents.filter((x) => x.status === "active").length} đã kích hoạt
            </p>
          </div>
        </article>
        <article>
          <i className="yellow">
            <ChibiIcon icon="🏫" />
          </i>
          <div>
            <small>LỚP CÓ DỮ LIỆU</small>
            <b>{classes.size}</b>
            <p>Thống kê từ hồ sơ trẻ</p>
          </div>
        </article>
      </section>
      <section className="admin-grid">
        <div className="panel">
          <Title
            title="Nghiệp vụ quản trị"
            sub="Các chức năng đúng phạm vi nhà trường"
          />
          <div className="module-grid">
            <button onClick={() => setActive("Tài khoản")}>
              <i>
                <ChibiIcon icon="👩🏻‍🏫" />
              </i>
              <b>Tài khoản giáo viên</b>
              <small>Tạo, khóa và quản lý giáo viên</small>
            </button>
            <button onClick={() => setActive("Thiết lập")}>
              <i>
                <ChibiIcon icon="🏫" />
              </i>
              <b>Điểm trường và lớp</b>
              <small>Tạo lớp, phân hiệu và phân công chủ nhiệm</small>
            </button>
            <button onClick={() => setActive("Thông báo")}>
              <i>
                <ChibiIcon icon="📣" />
              </i>
              <b>Thông báo</b>
              <small>Gửi thông tin trong hệ thống</small>
            </button>
          </div>
        </div>
        <div className="panel">
          <Title title="Sĩ số theo lớp" sub="Tổng hợp từ hồ sơ thật" />
          {Array.from(classes).map(([name, count]) => (
            <div className="classline" key={name}>
              <div>
                <b>{name}</b>
                <small>Hồ sơ đang lưu</small>
              </div>
              <span>{count} trẻ</span>
            </div>
          ))}
          {!classes.size && <div className="empty">Chưa có hồ sơ trẻ.</div>}
        </div>
      </section>
    </>
  );
}

type ManagedUser = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  status: string;
  schoolId?: number | null;
  schoolName: string;
};
type Campus = { id: number; name: string; address: string; status: string };
type ClassRow = {
  id: number;
  campusId: number;
  name: string;
  ageGroup: string;
  academicYear: string;
  teacherId?: number | null;
  status: string;
};
function SchoolSetup({ ping }: { ping: (s: string) => void }) {
  const [school, setSchool] = useState<any>(null),
    [campuses, setCampuses] = useState<Campus[]>([]),
    [classes, setClasses] = useState<ClassRow[]>([]),
    [teachers, setTeachers] = useState<{ id: number; fullName: string }[]>([]),
    [modal, setModal] = useState<"campus" | "class" | null>(null),
    [editing, setEditing] = useState<Campus | ClassRow | null>(null),
    [error, setError] = useState("");
  const load = async () => {
    const [a, b] = await Promise.all([
      fetch("/api/schools").then((r) => r.json()),
      fetch("/api/school-structure").then((r) => r.json()),
    ]);
    setSchool(a.schools?.[0] || null);
    setCampuses(b.campuses || []);
    setClasses(b.classes || []);
    setTeachers((b.teachers || []).filter((x: { status: string }) => x.status === "active"));
  };
  useEffect(() => {
    load();
  }, []);
  async function saveSchool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch("/api/schools", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error);
      return;
    }
    setSchool(d.school);
    ping("Đã lưu thông tin trường");
  }
  function openStructure(type: "campus" | "class", item: Campus | ClassRow | null = null) {
    setError("");
    setEditing(item);
    setModal(type);
  }
  async function saveStructure(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/school-structure", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(e.currentTarget)),
          type: modal,
          ...(editing ? { id: editing.id } : {}),
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    setModal(null);
    setEditing(null);
    await load();
    ping(editing ? "Đã lưu thay đổi" : modal === "campus" ? "Đã tạo điểm trường" : "Đã tạo lớp học");
  }
  async function remove(type: string, id: number) {
    if (!confirm("Xóa dữ liệu này?")) return;
    const r = await fetch(`/api/school-structure?type=${type}&id=${id}`, {
        method: "DELETE",
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error);
      return;
    }
    await load();
    ping("Đã xóa");
  }
  async function brand(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", type);
    const r = await fetch("/api/branding", { method: "POST", body: fd }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error);
      return;
    }
    setSchool(d.school);
    ping("Đã cập nhật nhận diện trường");
  }
  if (!school) return <div className="empty">Đang tải cấu hình…</div>;
  return (
    <>
      <PageHead
        icon="⚙"
        title="Thiết lập nhà trường"
        sub="Thông tin, điểm trường, lớp học và nhận diện riêng"
      />
      <form className="panel setup-form" onSubmit={saveSchool}>
        <div className="row">
          <label>
            Tên trường
            <input name="name" defaultValue={school.name} required />
          </label>
          <label>
            Năm học
            <input
              name="academicYear"
              defaultValue={school.academicYear}
              required
            />
          </label>
        </div>
        <label>
          Địa chỉ trường
          <input name="address" defaultValue={school.address || ""} />
        </label>
        <button className="save">Lưu thông tin trường</button>
      </form>
      <section className="branding-grid">
        <div className="panel">
          <Title title="Logo riêng" sub="PNG, JPG hoặc WEBP" />
          {school.logoKey && (
            <img
              className="brand-preview logo-preview"
              src={`/api/branding?key=${encodeURIComponent(school.logoKey)}`}
              alt="Logo trường"
            />
          )}
          <label className="excel-btn">
            Chọn logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => brand(e, "logo")}
            />
          </label>
        </div>
        <div className="panel">
          <Title title="Banner riêng" sub="Khuyến nghị ảnh ngang" />
          {school.bannerKey && (
            <img
              className="brand-preview"
              src={`/api/branding?key=${encodeURIComponent(school.bannerKey)}`}
              alt="Banner trường"
            />
          )}
          <label className="excel-btn">
            Chọn banner
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => brand(e, "banner")}
            />
          </label>
        </div>
      </section>
      <div className="section-head">
        <div>
          <h2>Điểm trường · Phân hiệu</h2>
          <p>Tạo cơ sở trước khi tạo lớp</p>
        </div>
        <button onClick={() => openStructure("campus")}>＋ Thêm điểm trường</button>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>TÊN</th>
              <th>ĐỊA CHỈ</th>
              <th>TRẠNG THÁI</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campuses.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.name}</b>
                </td>
                <td>{x.address}</td>
                <td>Đang hoạt động</td>
                <td>
                  <div className="user-actions">
                    <button className="editbtn" onClick={() => openStructure("campus", x)}>Sửa</button>
                    <button className="editbtn danger" onClick={() => remove("campus", x.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!campuses.length && <div className="empty">Chưa có điểm trường.</div>}
      </div>
      <div className="section-head">
        <div>
          <h2>Lớp học</h2>
          <p>Gắn lớp với điểm trường và giáo viên chủ nhiệm</p>
        </div>
        <button onClick={() => openStructure("class")}>＋ Thêm lớp</button>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>LỚP</th>
              <th>ĐIỂM TRƯỜNG</th>
              <th>ĐỘ TUỔI</th>
              <th>GIÁO VIÊN CHỦ NHIỆM</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {classes.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.name}</b>
                </td>
                <td>{campuses.find((c) => c.id == x.campusId)?.name}</td>
                <td>{x.ageGroup}</td>
                <td>
                  {teachers.find((t) => t.id == x.teacherId)?.fullName ||
                    "Chưa phân công"}
                </td>
                <td>
                  <div className="user-actions">
                    <button className="editbtn" onClick={() => openStructure("class", x)}>Sửa</button>
                    <button className="editbtn danger" onClick={() => remove("class", x.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!classes.length && <div className="empty">Chưa có lớp học.</div>}
      </div>
      {modal && (
        <div className="back">
          <form className="modal" onSubmit={saveStructure}>
            <button type="button" className="x" onClick={() => { setModal(null); setEditing(null); }}>
              ×
            </button>
            <h2>
              {modal === "campus"
                ? `${editing ? "Sửa" : "Thêm"} điểm trường · Phân hiệu`
                : `${editing ? "Sửa" : "Thêm"} lớp học`}
            </h2>
            <label>
              Tên
              <input name="name" defaultValue={editing?.name || ""} required />
            </label>
            {modal === "campus" ? (
              <label>
                Địa chỉ
                <input name="address" defaultValue={(editing as Campus | null)?.address || ""} />
              </label>
            ) : (
              <>
                <label>
                  Điểm trường
                  <select name="campusId" defaultValue={(editing as ClassRow | null)?.campusId || ""} required>
                    <option value="">Chọn điểm trường</option>
                    {campuses.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="row">
                  <label>
                    Nhóm tuổi
                    <input name="ageGroup" defaultValue={(editing as ClassRow | null)?.ageGroup || ""} placeholder="5–6 tuổi" />
                  </label>
                  <label>
                    Năm học
                    <input
                      name="academicYear"
                      defaultValue={(editing as ClassRow | null)?.academicYear || school.academicYear}
                    />
                  </label>
                </div>
                <label>
                  Giáo viên chủ nhiệm
                  <select name="teacherId" defaultValue={(editing as ClassRow | null)?.teacherId || ""}>
                    <option value="">Chưa phân công</option>
                    {teachers.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="save">{editing ? "Lưu thay đổi" : "Tạo mới"}</button>
          </form>
        </div>
      )}
    </>
  );
}
function AccountManager({
  ping,
  back,
}: {
  ping: (s: string) => void;
  back: () => void;
}) {
  const [rows, setRows] = useState<ManagedUser[]>([]),
    [actor, setActor] = useState<AuthUser | null>(null),
    [schools, setSchools] = useState<School[]>([]),
    [childOptions, setChildOptions] = useState<Child[]>([]),
    [open, setOpen] = useState(false),
    [editingUser, setEditingUser] = useState<ManagedUser | null>(null),
    [error, setError] = useState("");
  const load = () =>
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setRows(d.users || []));
  useEffect(() => {
    load();
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setActor(d.user);
        if (d.user?.role === "superadmin")
          fetch("/api/schools")
            .then((r) => r.json())
            .then((x) => setSchools(x.schools || []));
        if (d.user?.role === "teacher")
          fetch("/api/children")
            .then((r) => r.json())
            .then((x) => setChildOptions(x.children || []));
      });
  }, []);
  const allowed =
    actor?.role === "superadmin"
      ? rows.filter((x) => x.role === "admin")
      : actor?.role === "admin"
        ? rows.filter((x) => x.role === "teacher")
        : rows.filter((x) => x.role === "parent");
  const label =
    actor?.role === "superadmin"
      ? "quản trị trường"
      : actor?.role === "admin"
        ? "giáo viên"
        : "phụ huynh";
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget,
      r = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error || "Không thể tạo tài khoản");
      return;
    }
    form.reset();
    setOpen(false);
    await load();
    ping(`Đã tạo tài khoản ${label}`);
  }
  async function update(id: number, status: string) {
    const r = await fetch("/api/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Không thể cập nhật");
      return;
    }
    await load();
    ping("Đã cập nhật tài khoản");
  }
  async function saveUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: editingUser.id, ...values }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error || "Không thể cập nhật tài khoản");
    setEditingUser(null);
    await load();
    ping("Đã lưu thông tin tài khoản");
  }
  async function removeUser(id: number) {
    if (!confirm("Xóa tài khoản này?")) return;
    const r = await fetch(`/api/users?id=${id}`, { method: "DELETE" }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error);
      return;
    }
    await load();
    ping("Đã xóa tài khoản");
  }
  return (
    <>
      <div className="pagehead">
        <button className="backbtn" onClick={back}>
          ←
        </button>
        <div className="pageicon">
          <ChibiIcon icon="🔐" />
        </div>
        <div>
          <h1>Quản lý tài khoản {label}</h1>
          <p>
            Tài khoản được tạo trực tiếp theo đúng cấp quản lý, không đăng ký
            công khai
          </p>
        </div>
        <button onClick={() => setOpen(true)}>＋ Tạo tài khoản</button>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>HỌ VÀ TÊN</th>
              <th>TÊN ĐĂNG NHẬP</th>
              <th>TRƯỜNG</th>
              <th>VAI TRÒ</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {allowed.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.fullName}</b>
                </td>
                <td>@{u.username}</td>
                <td>{u.schoolName}</td>
                <td>
                  {u.role === "admin"
                    ? "Quản trị trường"
                    : u.role === "teacher"
                      ? "Giáo viên"
                      : "Phụ huynh"}
                </td>
                <td>
                  <span
                    className={u.status === "active" ? "tag ok" : "tag warn"}
                  >
                    {u.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td>
                  <div className="user-actions">
                    <button onClick={() => { setError(""); setEditingUser(u); }}>Sửa</button>
                    <button
                      onClick={() =>
                        update(
                          u.id,
                          u.status === "active" ? "locked" : "active",
                        )
                      }
                    >
                      {u.status === "active" ? "Khóa" : "Mở lại"}
                    </button>
                    <button className="danger" onClick={() => removeUser(u.id)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!allowed.length && (
          <div className="empty">Chưa có tài khoản {label}.</div>
        )}
      </div>
      {open && (
        <div className="back">
          <form className="modal" onSubmit={create}>
            <button type="button" className="x" onClick={() => setOpen(false)}>
              ×
            </button>
            <i className="big">
              <ChibiIcon icon="🔐" />
            </i>
            <h2>Tạo tài khoản {label}</h2>
            <p>Tài khoản được kích hoạt ngay sau khi tạo.</p>
            <label>
              Họ và tên
              <input name="fullName" required />
            </label>
            {actor?.role === "superadmin" && (
              <label>
                Trường
                <select name="schoolId" required>
                  <option value="">Chọn trường</option>
                  {schools
                    .filter((s) => s.status === "active")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.code}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {actor?.role === "teacher" && (
              <label>
                Liên kết với trẻ
                <select name="childId" required>
                  <option value="">Chọn hồ sơ trẻ</option>
                  {childOptions.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} · {x.className}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="row">
              <label>
                Tên đăng nhập
                <input name="username" minLength={4} required />
              </label>
              <label>
                Mật khẩu ban đầu
                <input name="password" type="password" minLength={8} required />
              </label>
            </div>
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="save">Tạo và kích hoạt</button>
          </form>
        </div>
      )}
      {editingUser && (
        <div className="back">
          <form className="modal" onSubmit={saveUser}>
            <button type="button" className="x" onClick={() => setEditingUser(null)}>×</button>
            <i className="big"><ChibiIcon icon="🔐" /></i>
            <h2>Sửa tài khoản {label}</h2>
            <label>Họ và tên<input name="fullName" defaultValue={editingUser.fullName} required /></label>
            <label>Tên đăng nhập<input name="username" defaultValue={editingUser.username} minLength={4} required /></label>
            <label>Mật khẩu mới <small>(để trống nếu giữ nguyên)</small><input name="password" type="password" minLength={8} /></label>
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="save">Lưu thay đổi</button>
          </form>
        </div>
      )}
    </>
  );
}

type School = {
  id: number;
  code: string;
  name: string;
  academicYear: string;
  status: string;
};
function SchoolManager({
  ping,
  back,
}: {
  ping: (s: string) => void;
  back: () => void;
}) {
  const [rows, setRows] = useState<School[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const load = () =>
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => setRows(d.schools || []));
  useEffect(() => {
    load();
  }, []);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget,
      r = await fetch("/api/schools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error || "Không thể tạo trường");
      return;
    }
    form.reset();
    setOpen(false);
    await load();
    ping("Đã tạo trường và vùng dữ liệu riêng");
  }
  async function toggle(s: School) {
    await fetch("/api/schools", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: s.id,
        status: s.status === "active" ? "locked" : "active",
      }),
    });
    await load();
    ping("Đã cập nhật trạng thái trường");
  }
  return (
    <>
      <div className="pagehead">
        <button className="backbtn" onClick={back}>
          ←
        </button>
        <div className="pageicon">
          <ChibiIcon icon="🏫" />
        </div>
        <div>
          <h1>Quản lý các trường</h1>
          <p>Mỗi trường có mã định danh và vùng dữ liệu độc lập</p>
        </div>
        <button onClick={() => setOpen(true)}>＋ Thêm trường</button>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>TÊN TRƯỜNG</th>
              <th>MÃ TRƯỜNG</th>
              <th>NĂM HỌC</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <b>{s.name}</b>
                </td>
                <td>
                  <span className="tag ok">{s.code}</span>
                </td>
                <td>{s.academicYear}</td>
                <td>{s.status === "active" ? "Đang hoạt động" : "Đã khóa"}</td>
                <td>
                  <button className="editbtn" onClick={() => toggle(s)}>
                    {s.status === "active" ? "Khóa trường" : "Mở lại"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">Chưa có trường nào.</div>}
      </div>
      {open && (
        <div className="back">
          <form className="modal" onSubmit={create}>
            <button type="button" className="x" onClick={() => setOpen(false)}>
              ×
            </button>
            <i className="big">
              <ChibiIcon icon="🏫" />
            </i>
            <h2>Thêm trường mới</h2>
            <p>Dữ liệu của trường mới sẽ được tách riêng tự động.</p>
            <label>
              Tên trường
              <input
                name="name"
                placeholder="Trường Mầm non Hoa Nắng"
                required
              />
            </label>
            <div className="row">
              <label>
                Mã trường
                <input name="code" placeholder="BAN MAI" required />
              </label>
              <label>
                Năm học
                <input name="academicYear" defaultValue="2026–2027" required />
              </label>
            </div>
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="save">Tạo trường</button>
          </form>
        </div>
      )}
    </>
  );
}

type Child = {
  id?: number;
  name: string;
  className: string;
  birthDate: string;
  guardian: string;
  phone: string;
  allergy: string;
  status: string;
  avatarKey?: string | null;
};
function ChildrenManager({ ping }: { ping: (s: string) => void }) {
  const [rows, setRows] = useState<Child[]>([]),
    [editing, setEditing] = useState<Child | null | undefined>(undefined),
    [query, setQuery] = useState(""),
    [classFilter, setClassFilter] = useState("Tất cả lớp"),
    [classOptions, setClassOptions] = useState<ClassRow[]>([]),
    [importing, setImporting] = useState(false);
  const load = () =>
    fetch("/api/children")
      .then((r) => r.json())
      .then((d) => setRows(d.children || []));
  useEffect(() => {
    load();
    fetch("/api/school-structure")
      .then((r) => r.json())
      .then((d) => setClassOptions(d.classes || []));
  }, []);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      body = Object.fromEntries(f) as Record<string, string>;
    let child: Child;
    if (editing?.id) {
      const r = await fetch("/api/children", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, id: editing.id }),
        }),
        d = await r.json();
      if (!r.ok) {
        ping(d.error || "Không thể cập nhật");
        return;
      }
      child = d.child;
    } else {
      const r = await fetch("/api/children", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) {
        ping(d.error || "Không thể thêm trẻ");
        return;
      }
      child = d.child;
    }
    const file = f.get("avatar");
    if (file instanceof File && file.size) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("scope", "child");
      fd.set("id", String(child.id));
      const r = await fetch("/api/avatar", { method: "POST", body: fd }),
        d = await r.json();
      if (!r.ok) {
        ping(d.error || "Không thể tải ảnh");
        return;
      }
      child = d.child;
    }
    await load();
    setEditing(undefined);
    ping(editing?.id ? "Đã cập nhật hồ sơ trẻ" : "Đã thêm hồ sơ trẻ");
  }
  async function importExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        book.Sheets[book.SheetNames[0]],
        { defval: "" },
      );
      const pick = (row: Record<string, unknown>, names: string[]) => {
        const key = Object.keys(row).find((k) =>
          names.includes(k.trim().toLowerCase()),
        );
        return key ? String(row[key]).trim() : "";
      };
      const items = raw.map((row) => ({
        name: pick(row, ["họ và tên", "họ tên", "tên trẻ", "ho ten"]),
        birthDate: pick(row, ["ngày sinh", "ngay sinh"]),
        className: pick(row, ["lớp", "tên lớp", "lop"]),
        guardian: pick(row, ["phụ huynh", "họ tên phụ huynh", "nguoi giam ho"]),
        phone: pick(row, ["số điện thoại", "sđt", "dien thoai"]),
        allergy: pick(row, ["dị ứng", "lưu ý sức khỏe", "sức khỏe"]),
        fatherName: pick(row, ["họ tên cha", "tên cha"]),
        fatherBirthDate: pick(row, ["ngày sinh cha"]),
        fatherJob: pick(row, ["nghề nghiệp cha"]),
        fatherPhone: pick(row, ["sđt cha", "số điện thoại cha"]),
        motherName: pick(row, ["họ tên mẹ", "tên mẹ"]),
        motherBirthDate: pick(row, ["ngày sinh mẹ"]),
        motherJob: pick(row, ["nghề nghiệp mẹ"]),
        motherPhone: pick(row, ["sđt mẹ", "số điện thoại mẹ"]),
        zaloPhone: pick(row, ["sđt zalo", "số điện thoại zalo", "zalo"]),
      }));
      const r = await fetch("/api/children", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Không thể nhập danh sách");
      await load();
      ping(`Đã nhập thành công ${d.count} hồ sơ trẻ`);
    } catch (x) {
      ping(x instanceof Error ? x.message : "Tệp Excel không hợp lệ");
    } finally {
      setImporting(false);
    }
  }
  function exportExcel() {
    const data = rows.map((x) => ({
      "Họ và tên": x.name,
      "Ngày sinh": x.birthDate,
      Lớp: x.className,
      "Phụ huynh": x.guardian,
      "Số điện thoại": x.phone,
      "Dị ứng/Lưu ý sức khỏe": x.allergy,
      "Trạng thái": x.status,
      "Họ tên cha": x.fatherName,
      "Ngày sinh cha": x.fatherBirthDate,
      "Nghề nghiệp cha": x.fatherJob,
      "SĐT cha": x.fatherPhone,
      "Họ tên mẹ": x.motherName,
      "Ngày sinh mẹ": x.motherBirthDate,
      "Nghề nghiệp mẹ": x.motherJob,
      "SĐT mẹ": x.motherPhone,
      "SĐT Zalo": x.zaloPhone,
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(data),
      "Hồ sơ trẻ",
    );
    XLSX.writeFile(book, "danh-sach-tre.xlsx");
    ping("Đã xuất danh sách trẻ ra Excel");
  }
  const classes = Array.from(new Set(rows.map((x) => x.className))).filter(
    Boolean,
  );
  const list = rows.filter(
    (x) =>
      x.name.toLowerCase().includes(query.toLowerCase()) &&
      (classFilter === "Tất cả lớp" || x.className === classFilter),
  );
  async function removeChild(id: number) {
    if (!confirm("Xóa hồ sơ trẻ này?")) return;
    const r = await fetch(`/api/children?id=${id}`, { method: "DELETE" }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error);
      return;
    }
    await load();
    ping("Đã xóa hồ sơ trẻ");
  }
  return (
    <>
      <PageHead
        icon="🧒"
        title="Hồ sơ trẻ"
        sub={`${rows.length} trẻ · Dữ liệu đang lưu trên hệ thống`}
        action="Thêm trẻ"
        onClick={() => setEditing(null)}
      />
      <div className="toolbar">
        <input
          placeholder="⌕  Tìm theo họ tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option>Tất cả lớp</option>
          {classes.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label className="excel-btn">
          {importing ? "Đang nhập…" : "⇧ Nhập Excel"}
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={importExcel}
            disabled={importing}
          />
        </label>
        <button onClick={exportExcel}>⇩ Xuất Excel</button>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>TRẺ</th>
              <th>NGÀY SINH</th>
              <th>PHỤ HUYNH</th>
              <th>SỨC KHỎE</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id}>
                <td>
                  <div className="person">
                    {x.avatarKey ? (
                      <img
                        src={`/api/avatar?key=${encodeURIComponent(x.avatarKey)}`}
                        alt={x.name}
                      />
                    ) : (
                      <i>
                        <ChibiIcon icon="🧒" />
                      </i>
                    )}
                    <div>
                      <b>{x.name}</b>
                      <small>
                        {x.className} · MN{String(x.id).padStart(3, "0")}
                      </small>
                    </div>
                  </div>
                </td>
                <td>{x.birthDate}</td>
                <td>
                  <b>{x.guardian}</b>
                  <small>{x.phone}</small>
                </td>
                <td>
                  <span
                    className={x.allergy === "Không" ? "tag ok" : "tag warn"}
                  >
                    {x.allergy}
                  </span>
                </td>
                <td>
                  <span
                    className={x.status === "Đã đến" ? "tag ok" : "tag warn"}
                  >
                    {x.status}
                  </span>
                </td>
                <td>
                  <button className="editbtn" onClick={() => setEditing(x)}>
                    ✎ Chỉnh sửa
                  </button>
                  <button
                    className="editbtn danger"
                    onClick={() => removeChild(x.id!)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty">
            Chưa có hồ sơ trẻ. Chọn “Thêm trẻ” để bắt đầu.
          </div>
        )}
      </div>
      {editing !== undefined && (
        <div className="back">
          <form className="modal" onSubmit={save}>
            <button
              type="button"
              className="x"
              onClick={() => setEditing(undefined)}
            >
              ×
            </button>
            <div className="child-edit-head">
              {editing?.avatarKey ? (
                <img
                  src={`/api/avatar?key=${encodeURIComponent(editing.avatarKey)}`}
                  alt="Ảnh trẻ"
                />
              ) : (
                <i>
                  <ChibiIcon icon="🧒" />
                </i>
              )}
              <div>
                <h2>
                  {editing?.id ? "Chỉnh sửa hồ sơ trẻ" : "Thêm hồ sơ trẻ"}
                </h2>
                <p>Giáo viên có thể cập nhật thông tin và ảnh đại diện.</p>
              </div>
            </div>
            <label>
              Ảnh đại diện
              <input
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
              />
            </label>
            <div className="row">
              <label>
                Họ và tên
                <input
                  name="name"
                  defaultValue={editing?.name || ""}
                  required
                />
              </label>
              <label>
                Ngày sinh
                <input
                  name="birthDate"
                  type="date"
                  defaultValue={editing?.birthDate || ""}
                  required
                />
              </label>
            </div>
            <div className="row">
              <label>
                Lớp
                <select
                  name="className"
                  defaultValue={editing?.className || "Lá 1"}
                >
                  <option value="">Chọn lớp</option>
                  {classOptions
                    .filter((x) => x.status === "active")
                    .map((x) => (
                      <option key={x.id}>{x.name}</option>
                    ))}
                </select>
              </label>
              <label>
                Trạng thái
                <select
                  name="status"
                  defaultValue={editing?.status || "Đã đến"}
                >
                  <option>Đã đến</option>
                  <option>Xin nghỉ</option>
                  <option>Đã chuyển lớp</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label>
                Phụ huynh
                <input
                  name="guardian"
                  defaultValue={editing?.guardian || ""}
                  required
                />
              </label>
              <label>
                Số điện thoại
                <input
                  name="phone"
                  defaultValue={editing?.phone || ""}
                  required
                />
              </label>
            </div>
            <label>
              Dị ứng/lưu ý sức khỏe
              <input
                name="allergy"
                defaultValue={editing?.allergy || "Không"}
              />
            </label>
            <h3>Thông tin cha</h3>
            <div className="row">
              <label>
                Họ tên cha
                <input
                  name="fatherName"
                  defaultValue={editing?.fatherName || ""}
                />
              </label>
              <label>
                Ngày sinh cha
                <input
                  type="date"
                  name="fatherBirthDate"
                  defaultValue={editing?.fatherBirthDate || ""}
                />
              </label>
            </div>
            <div className="row">
              <label>
                Nghề nghiệp cha
                <input
                  name="fatherJob"
                  defaultValue={editing?.fatherJob || ""}
                />
              </label>
              <label>
                Số điện thoại cha
                <input
                  name="fatherPhone"
                  defaultValue={editing?.fatherPhone || ""}
                />
              </label>
            </div>
            <h3>Thông tin mẹ</h3>
            <div className="row">
              <label>
                Họ tên mẹ
                <input
                  name="motherName"
                  defaultValue={editing?.motherName || ""}
                />
              </label>
              <label>
                Ngày sinh mẹ
                <input
                  type="date"
                  name="motherBirthDate"
                  defaultValue={editing?.motherBirthDate || ""}
                />
              </label>
            </div>
            <div className="row">
              <label>
                Nghề nghiệp mẹ
                <input
                  name="motherJob"
                  defaultValue={editing?.motherJob || ""}
                />
              </label>
              <label>
                Số điện thoại mẹ
                <input
                  name="motherPhone"
                  defaultValue={editing?.motherPhone || ""}
                />
              </label>
            </div>
            <label>
              Số điện thoại dùng Zalo
              <input
                name="zaloPhone"
                defaultValue={editing?.zaloPhone || ""}
                placeholder="Chỉ lưu liên hệ; gửi tự động cần Zalo OA"
              />
            </label>
            <button className="save">Lưu hồ sơ</button>
          </form>
        </div>
      )}
    </>
  );
}

function Attendance({ ping }: { ping: (s: string) => void }) {
  const [rows, setRows] = useState<Child[]>([]),
    [state, setState] = useState<Record<number, string>>({});
  useEffect(() => {
    fetch("/api/children")
      .then((r) => r.json())
      .then((d) => {
        const list = d.children || [];
        setRows(list);
        setState(
          Object.fromEntries(
            list.map((x: Child) => [x.id!, x.status || "Chưa điểm danh"]),
          ),
        );
      });
  }, []);
  const present = Object.values(state).filter((x) => x === "Đã đến").length;
  async function finish() {
    const changed = rows.filter((x) => state[x.id!] !== x.status);
    const results = await Promise.all(
      changed.map((x) =>
        fetch("/api/children", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: x.id, status: state[x.id!] }),
        }),
      ),
    );
    if (results.some((r) => !r.ok)) {
      ping("Có hồ sơ chưa lưu được");
      return;
    }
    setRows((s) => s.map((x) => ({ ...x, status: state[x.id!] })));
    ping(`Đã lưu điểm danh ${rows.length} trẻ`);
  }
  return (
    <>
      <PageHead
        icon="🙋"
        title="Điểm danh hôm nay"
        sub="Dữ liệu được lưu trực tiếp vào hồ sơ trẻ"
      />
      <div className="attendance-summary">
        <b>
          {present}/{rows.length}
        </b>
        <span>trẻ đã đến</span>
        <div className="progress">
          <i
            style={{
              width: `${rows.length ? (present / rows.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <div className="panel">
        <div className="att-grid">
          {rows.map((x) => (
            <div className="att-card" key={x.id}>
              <i>
                <ChibiIcon icon="🧒" />
              </i>
              <b>{x.name}</b>
              <small>
                {x.className} · {state[x.id!]}
              </small>
              <div>
                <button
                  className={state[x.id!] === "Đã đến" ? "selected" : ""}
                  onClick={() => setState((s) => ({ ...s, [x.id!]: "Đã đến" }))}
                >
                  ✓ Có mặt
                </button>
                <button
                  className={state[x.id!] === "Xin nghỉ" ? "abs-selected" : ""}
                  onClick={() =>
                    setState((s) => ({ ...s, [x.id!]: "Xin nghỉ" }))
                  }
                >
                  × Vắng
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="save finish" onClick={finish}>
          Hoàn tất điểm danh
        </button>
      </div>
      {!rows.length && (
        <div className="empty">Chưa có hồ sơ trẻ để điểm danh.</div>
      )}
    </>
  );
}

function Care({ ping }: { ping: (s: string) => void }) {
  return (
    <>
      <PageHead
        icon="♥"
        title="Ăn · Ngủ · Sức khỏe"
        sub="Theo dõi chăm sóc hằng ngày"
      />
      <div className="care-tabs">
        <button className="on">🍚 Bữa ăn</button>
        <button>☾ Giấc ngủ</button>
        <button>♥ Sức khỏe</button>
        <button>😊 Tâm trạng</button>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>TRẺ</th>
              <th>BỮA SÁNG</th>
              <th>BỮA TRƯA</th>
              <th>GIẤC NGỦ</th>
              <th>TÂM TRẠNG</th>
              <th>LƯU Ý</th>
            </tr>
          </thead>
          <tbody>
            {kids.map(([a, n], i) => (
              <tr key={n}>
                <td>
                  <div className="person">
                    <i>
                      <ChibiIcon icon="🧒" />
                    </i>
                    <b>{n}</b>
                  </div>
                </td>
                <td>
                  <select defaultValue={i == 2 ? "Nửa suất" : "Ăn hết"}>
                    <option>Ăn hết</option>
                    <option>Nửa suất</option>
                    <option>Không ăn</option>
                  </select>
                </td>
                <td>
                  <select>
                    <option>Ăn hết</option>
                    <option>Nửa suất</option>
                  </select>
                </td>
                <td>
                  <select>
                    <option>Ngủ ngon</option>
                    <option>Khó ngủ</option>
                  </select>
                </td>
                <td>
                  <select>
                    <option>😊 Vui vẻ</option>
                    <option>😴 Mệt</option>
                  </select>
                </td>
                <td>
                  <input placeholder="Ghi chú..." />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="save finish"
          onClick={() => ping("Đã lưu nhật ký chăm sóc")}
        >
          Lưu theo dõi hôm nay
        </button>
      </div>
    </>
  );
}

function Journal({ ping }: { ping: (s: string) => void }) {
  return (
    <>
      <PageHead
        icon="✎"
        title="Nhật ký lớp"
        sub="Chia sẻ hoạt động và sự tiến bộ của trẻ"
        action="Tạo bài viết"
        onClick={() => ping("Đã mở trình soạn nhật ký")}
      />
      <section className="grid">
        <div className="panel journal-card">
          <div className="journal-art">🌱 🌼 🦋</div>
          <small>09:05 · HOẠT ĐỘNG HỌC</small>
          <h2>Khám phá thế giới thực vật</h2>
          <p>
            Các con tự tay gieo hạt, tưới cây và cùng tìm hiểu điều kiện để cây
            lớn lên.
          </p>
          <footer>
            <span>📷 12 ảnh</span>
            <span>👁 26 phụ huynh đã xem</span>
          </footer>
        </div>
        <div className="panel">
          <Title title="Gợi ý ghi nhận" sub="Theo mục tiêu phát triển" />
          {[
            "Thể chất",
            "Nhận thức",
            "Ngôn ngữ",
            "Tình cảm – xã hội",
            "Thẩm mỹ",
          ].map((x, i) => (
            <div className="classline" key={x}>
              <div>
                <b>{x}</b>
                <small>
                  {
                    [
                      "Vận động khéo léo",
                      "Biết quan sát và đặt câu hỏi",
                      "Mạnh dạn trình bày",
                      "Hợp tác cùng bạn",
                      "Sáng tạo với màu sắc",
                    ][i]
                  }
                </small>
              </div>
              <button onClick={() => ping(`Đã chọn ${x}`)}>＋</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function Menu({ ping }: { ping: (s: string) => void }) {
  return (
    <>
      <PageHead
        icon="🍲"
        title="Thực đơn tuần"
        sub="Tuần 4 · 17/08 – 21/08/2026"
        action="Cập nhật"
        onClick={() => ping("Đã mở chỉnh sửa thực đơn")}
      />
      <div className="menu-week">
        {["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"].map((d, i) => (
          <article className={i == 4 ? "today" : ""} key={d}>
            <header>
              <b>{d}</b>
              <small>{17 + i}/08</small>
            </header>
            <div>
              <i>🥣</i>
              <small>BỮA SÁNG</small>
              <p>{i % 2 ? "Bún thịt rau củ" : "Cháo thịt bằm"}</p>
            </div>
            <div>
              <i>
                <ChibiIcon icon="🍱" />
              </i>
              <small>BỮA TRƯA</small>
              <p>
                Cơm · Cá sốt cà
                <br />
                Canh rau ngót
              </p>
            </div>
            <div>
              <i>🥛</i>
              <small>BỮA XẾ</small>
              <p>Sữa chua · Trái cây</p>
            </div>
          </article>
        ))}
      </div>
      <div className="nutrition panel">
        <b>🧑🏻‍🍳 Dinh dưỡng tuần</b>
        <span>
          Năng lượng trung bình: <strong>690 kcal/ngày</strong>
        </span>
        <span>
          Đạm: <strong>32g</strong>
        </span>
        <span>
          Rau củ: <strong>180g</strong>
        </span>
        <button onClick={() => ping("Đã mở danh sách trẻ dị ứng")}>
          Xem lưu ý dị ứng
        </button>
      </div>
    </>
  );
}
function Notices({ ping }: { ping: (s: string) => void }) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<
      {
        id: number;
        title: string;
        content: string;
        audience: string;
        createdAt: string;
      }[]
    >([]);
  const load = () =>
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []));
  useEffect(() => {
    load();
  }, []);
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      x = {
        title: String(f.get("title")),
        content: String(f.get("content")),
        audience: String(f.get("audience")),
      };
    const r = await fetch("/api/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(x),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Không thể gửi thông báo");
      return;
    }
    await load();
    setOpen(false);
    ping("Đã gửi thông báo tới phụ huynh");
  }
  return (
    <>
      <PageHead
        icon="📣"
        title="Thông báo"
        sub="Kết nối nhà trường với phụ huynh"
        action="Soạn thông báo"
        onClick={() => setOpen(true)}
      />
      <div className="notice-layout">
        <div>
          {items.map((x) => (
            <article className="panel notice" key={x.id}>
              <i>
                <ChibiIcon icon="📣" />
              </i>
              <section>
                <small>
                  {x.audience} · {x.createdAt}
                </small>
                <h2>{x.title}</h2>
                <p>{x.content}</p>
                <footer>
                  <span>✓ Đã lưu trong hệ thống</span>
                </footer>
              </section>
            </article>
          ))}
          {!items.length && (
            <div className="panel empty">Chưa có thông báo nào.</div>
          )}
        </div>
        <div className="panel">
          <Title title="Kênh gửi" sub="Trạng thái kết nối" />
          <div className="channel">
            <i className="green">✓</i>
            <div>
              <b>Thông báo trong hệ thống</b>
              <small>Đang hoạt động</small>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div className="back">
          <form className="modal" onSubmit={send}>
            <button type="button" className="x" onClick={() => setOpen(false)}>
              ×
            </button>
            <i className="big">
              <ChibiIcon icon="📣" />
            </i>
            <h2>Soạn thông báo</h2>
            <p>Gửi thông tin đến đúng nhóm phụ huynh.</p>
            <label>
              Tiêu đề
              <input name="title" required />
            </label>
            <label>
              Người nhận
              <select name="audience">
                <option>Phụ huynh lớp Lá 1</option>
                <option>Toàn trường</option>
                <option>Giáo viên</option>
              </select>
            </label>
            <label>
              Nội dung
              <textarea name="content" required rows={5} />
            </label>
            <button className="save">Gửi thông báo</button>
          </form>
        </div>
      )}
    </>
  );
}
function Teacher({ ping }: { ping: (s: string) => void }) {
  const [children, setChildren] = useState<Child[]>([]),
    [parents, setParents] = useState<ManagedUser[]>([]);
  useEffect(() => {
    fetch("/api/children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children || []));
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) =>
        setParents(
          (d.users || []).filter((x: ManagedUser) => x.role === "parent"),
        ),
      );
  }, []);
  const present = children.filter((x) => x.status === "Đã đến").length,
    absent = children.filter((x) => x.status === "Xin nghỉ").length;
  return (
    <>
      <section className="hero">
        <div>
          <p>Không gian làm việc của giáo viên</p>
          <h1>Quản lý lớp học 🌻</h1>
          <p>
            Các số liệu dưới đây được tổng hợp trực tiếp từ hồ sơ của trường.
          </p>
        </div>
      </section>
      <section className="stats">
        <article>
          <i className="pink">
            <ChibiIcon icon="🧒" />
          </i>
          <div>
            <small>HỒ SƠ TRẺ</small>
            <b>{children.length}</b>
            <p>Dữ liệu đang lưu</p>
          </div>
        </article>
        <article>
          <i className="green">
            <ChibiIcon icon="🙋" />
          </i>
          <div>
            <small>ĐÃ ĐẾN</small>
            <b>{present}</b>
            <p>Theo trạng thái hiện tại</p>
          </div>
        </article>
        <article>
          <i className="yellow">
            <ChibiIcon icon="😴" />
          </i>
          <div>
            <small>XIN NGHỈ</small>
            <b>{absent}</b>
            <p>Theo trạng thái hiện tại</p>
          </div>
        </article>
        <article>
          <i className="blue">
            <ChibiIcon icon="👨‍👩‍👧" />
          </i>
          <div>
            <small>PHỤ HUYNH</small>
            <b>{parents.length}</b>
            <p>
              {parents.filter((x) => x.status === "active").length} tài khoản
              hoạt động
            </p>
          </div>
        </article>
      </section>
      <div className="panel">
        <Title title="Hồ sơ trẻ gần nhất" sub="Dữ liệu thực tế của trường" />
        {children.slice(0, 8).map((x) => (
          <div className="kid" key={x.id}>
            <i>
              <ChibiIcon icon="🧒" />
            </i>
            <div>
              <b>{x.name}</b>
              <small>
                {x.className} · {x.guardian || "Chưa cập nhật phụ huynh"}
              </small>
            </div>
            <span className={x.status === "Đã đến" ? "yes" : "no"}>
              {x.status}
            </span>
          </div>
        ))}
        {!children.length && (
          <div className="empty">
            Chưa có hồ sơ trẻ. Hãy vào “Hồ sơ trẻ” để thêm mới hoặc nhập Excel.
          </div>
        )}
      </div>
    </>
  );
}
function Parent({ active }: { active: string; ping: (s: string) => void }) {
  const [items, setItems] = useState<
      {
        id: number;
        title: string;
        content: string;
        audience: string;
        createdAt: string;
      }[]
    >([]),
    [children, setChildren] = useState<Child[]>([]);
  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []));
    fetch("/api/children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children || []));
  }, []);
  return (
    <>
      <PageHead
        icon={active === "Thông báo" ? "📣" : "👨‍👩‍👧"}
        title={
          active === "Thông báo"
            ? "Thông báo từ nhà trường"
            : "Không gian phụ huynh"
        }
        sub="Chỉ hiển thị dữ liệu thật do nhà trường và giáo viên cập nhật"
      />
      {active !== "Thông báo" && (
        <div className="panel">
          <Title
            title="Hồ sơ trẻ đã liên kết"
            sub={`${children.length} hồ sơ`}
          />
          {children.map((x) => (
            <div className="profile" key={x.id}>
              <i>
                <ChibiIcon icon="🧒" />
              </i>
              <div>
                <small>HỒ SƠ CỦA CON</small>
                <h2>{x.name}</h2>
                <p>
                  {x.className} · Ngày sinh {x.birthDate || "Chưa cập nhật"}
                </p>
              </div>
              <span>{x.status}</span>
            </div>
          ))}
          {!children.length && (
            <div className="empty">
              Tài khoản chưa được giáo viên liên kết với hồ sơ trẻ.
            </div>
          )}
        </div>
      )}
      <div className="panel">
        <Title
          title="Thông báo mới nhất"
          sub={`${items.length} thông báo trong hệ thống`}
        />
        {items.map((x) => (
          <article className="notice" key={x.id}>
            <i>
              <ChibiIcon icon="📣" />
            </i>
            <section>
              <small>
                {x.audience} · {x.createdAt}
              </small>
              <h2>{x.title}</h2>
              <p>{x.content}</p>
            </section>
          </article>
        ))}
        {!items.length && (
          <div className="empty">Chưa có thông báo nào từ nhà trường.</div>
        )}
      </div>
    </>
  );
}
function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="title">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <button>Xem tất cả →</button>
    </div>
  );
}
function Timeline({
  t,
  x,
  s,
  c,
}: {
  t: string;
  x: string;
  s: string;
  c: string;
}) {
  return (
    <div className="time">
      <i className={c} />
      <time>{t}</time>
      <div>
        <b>{x}</b>
        <small>{s}</small>
      </div>
    </div>
  );
}
