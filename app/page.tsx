"use client";
import { useEffect, useState } from "react";
import "./chibi.css";
import * as XLSX from "xlsx";
import { vnNow, vnToday } from "../lib/day";
import { weekStartOf } from "../lib/week";

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
    [profileOpen, setProfileOpen] = useState(false),
    [toast, setToast] = useState(""),
    [authUser, setAuthUser] = useState<AuthUser | null>(null),
    [alerts, setAlerts] = useState<{
      total: number;
      items: { kind: string; label: string; count: number; target: string }[];
    }>({ total: 0, items: [] }),
    [alertsOpen, setAlertsOpen] = useState(false),
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
          setActive(
            d.user.role === "parent" ? "Hôm nay của con" : "Tổng quan",
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
  useEffect(() => {
    let live = true;
    if (!authUser) return;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { total: 0, items: [] }))
      .then(
        (d) =>
          live && setAlerts({ total: d.total || 0, items: d.items || [] }),
      )
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [authUser, active, toast]);
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
          setActive(u.role === "parent" ? "Hôm nay của con" : "Tổng quan");
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
            ["🍲", "Thực đơn"],
            ["💰", "Học phí"],
            ["📊", "Báo cáo"],
            ["📣", "Thông báo"],
          ]
        : authUser.role === "teacher"
          ? [
              ["🏡", "Tổng quan"],
              ["🙋", "Điểm danh"],
              ["♥", "Sổ chăm sóc"],
              ["✎", "Nhật ký"],
              ["💬", "Tin nhắn"],
              ["🧒", "Hồ sơ trẻ"],
              ["📣", "Thông báo"],
              ["👨‍👩‍👧", "Phụ huynh"],
            ]
          : [
              ["👨‍👩‍👧", "Hôm nay của con"],
              ["✎", "Nhật ký"],
              ["💬", "Tin nhắn"],
              ["☁️", "Xin nghỉ"],
              ["📣", "Thông báo"],
              ["💗", "Sức khỏe"],
              ["🍲", "Thực đơn"],
              ["💰", "Học phí"],
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
              {alerts.items.find((a) => a.target === n) && (
                <em>{alerts.items.find((a) => a.target === n)!.count}</em>
              )}
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
            <button
              className="bell"
              aria-label={`Thông báo: ${alerts.total} việc cần xem`}
              onClick={() => setAlertsOpen((x) => !x)}
            >
              <ChibiIcon icon="📣" />
              {alerts.total > 0 && <em>{alerts.total}</em>}
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
                setAlerts({ total: 0, items: [] });
                setAlertsOpen(false);
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        {alertsOpen && (
          <div className="alert-panel">
            <b>Việc cần xem</b>
            {alerts.items.map((a) => (
              <button
                key={a.kind}
                onClick={() => {
                  setActive(a.target);
                  setAlertsOpen(false);
                }}
              >
                <em>{a.count}</em>
                <span>{a.label}</span>
                <small>Mở {a.target} →</small>
              </button>
            ))}
            {!alerts.items.length && (
              <p>Không có việc nào đang chờ. Mọi thứ đã xong.</p>
            )}
          </div>
        )}
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

function TeacherArea({
  active,
  ping,
}: {
  active: string;
  ping: (s: string) => void;
}) {
  if (active === "Hồ sơ trẻ") return <ChildrenManager ping={ping} />;
  if (active === "Điểm danh") return <Attendance ping={ping} />;
  if (active === "Sổ chăm sóc") return <CareArea ping={ping} />;
  if (active === "Nhật ký") return <Journal ping={ping} />;
  if (active === "Tin nhắn") return <Messages ping={ping} />;
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
  if (active === "Thực đơn")
    return (
      <>
        <PageHead
          icon="🍲"
          title="Thực đơn tuần"
          sub="Nhập một lần, mọi lớp cùng dùng và tự đối chiếu dị ứng"
        />
        <MenuBoard ping={ping} editable />
      </>
    );
  if (active === "Học phí") return <FeeManager ping={ping} />;
  if (active === "Báo cáo") return <ReportBoard />;
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
  children?: { id: number; name: string; className: string }[];
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
  async function linkChild(userId: number, childId: number, unlink = false) {
    const r = await fetch("/api/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: userId,
          [unlink ? "unlinkChildId" : "linkChildId"]: childId,
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Chưa cập nhật được liên kết");
      return;
    }
    await load();
    ping(unlink ? "Đã gỡ liên kết" : "Đã liên kết thêm bé");
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
                  {u.role === "parent" && actor?.role === "teacher" && (
                    <div className="guardian-links">
                      {(u.children || []).map((c) => (
                        <span key={c.id}>
                          {c.name}
                          <button
                            title={`Gỡ liên kết ${c.name}`}
                            onClick={() => linkChild(u.id, c.id, true)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          if (id) linkChild(u.id, id);
                        }}
                      >
                        <option value="">＋ Liên kết bé…</option>
                        {childOptions
                          .filter(
                            (c) =>
                              !(u.children || []).some((x) => x.id === c.id),
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} · {c.className}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
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
  classId?: number | null;
  birthDate: string;
  guardian: string;
  phone: string;
  allergy: string;
  status: string;
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
                    className={x.status === "Đang học" ? "tag ok" : "tag warn"}
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
                Tình trạng theo học
                <select
                  name="status"
                  defaultValue={editing?.status || "Đang học"}
                >
                  <option>Đang học</option>
                  <option>Tạm nghỉ dài ngày</option>
                  <option>Đã chuyển lớp</option>
                  <option>Đã nghỉ học</option>
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

type ClassOption = { id: number; name: string; ageGroup: string };
type AttRow = {
  childId: number;
  name: string;
  className: string;
  classId: number | null;
  allergy: string;
  status: string;
  note: string;
  checkInAt: string;
  checkOutAt: string;
  recorded: boolean;
  leaveReason: string;
};
type LeaveRow = {
  id: number;
  childId: number;
  childName: string;
  className: string;
  fromDate: string;
  toDate: string;
  reason: string;
  note: string;
  status: string;
  createdAt: string;
};
const ATT_CHOICES = [
  ["Có mặt", "✓ Có mặt", "yes"],
  ["Vắng có phép", "Có phép", "warn"],
  ["Vắng không phép", "Không phép", "no"],
];

function DayBar({
  date,
  setDate,
  today,
  classes,
  classId,
  setClassId,
  scope,
}: {
  date: string;
  setDate: (s: string) => void;
  today: string;
  classes: ClassOption[];
  classId: string;
  setClassId: (s: string) => void;
  scope: string;
}) {
  return (
    <div className="daybar">
      <label>
        Ngày
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value || today)}
        />
      </label>
      {classes.length > 0 && (
        <label>
          Lớp
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Tất cả lớp của tôi</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="0">Chưa xếp lớp</option>
          </select>
        </label>
      )}
      {date !== today && (
        <button className="ghost" onClick={() => setDate(today)}>
          Về hôm nay
        </button>
      )}
      {scope === "school" && (
        <p className="daybar-note">
          Bạn chưa được phân lớp chủ nhiệm nên đang xem toàn trường. Nhờ quản
          trị trường gán lớp trong mục Thiết lập để danh sách gọn lại.
        </p>
      )}
    </div>
  );
}

function Attendance({ ping }: { ping: (s: string) => void }) {
  const [date, setDate] = useState(vnToday()),
    [today, setToday] = useState(vnToday()),
    [classId, setClassId] = useState(""),
    [classes, setClasses] = useState<ClassOption[]>([]),
    [scope, setScope] = useState(""),
    [rows, setRows] = useState<AttRow[]>([]),
    [draft, setDraft] = useState<
      Record<
        number,
        { status: string; note: string; checkInAt: string; checkOutAt: string }
      >
    >({}),
    [leaves, setLeaves] = useState<LeaveRow[]>([]),
    [pickups, setPickups] = useState<PickupNotice[]>([]),
    [saving, setSaving] = useState(false),
    [loading, setLoading] = useState(true),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    const query = new URLSearchParams({ date });
    if (classId !== "") query.set("classId", classId);
    fetch(`/api/attendance?${query}`)
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!live) return;
        setLoading(false);
        if (!ok) {
          ping(d.error || "Không tải được sổ điểm danh");
          return;
        }
        setToday(d.today);
        setClasses(d.classes || []);
        setScope(d.scope);
        setRows(d.rows || []);
        setDraft(
          Object.fromEntries(
            (d.rows || []).map((x: AttRow) => [
              x.childId,
              {
                status: x.status,
                note: x.note,
                checkInAt: x.checkInAt,
                checkOutAt: x.checkOutAt,
              },
            ]),
          ),
        );
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, classId, tick]);
  useEffect(() => {
    let live = true;
    fetch(`/api/pickup?date=${date}`)
      .then((r) => (r.ok ? r.json() : { notices: [] }))
      .then((d) => live && setPickups(d.notices || []))
      .catch(() => {});
    fetch("/api/leave-requests")
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => {
        if (live)
          setLeaves(
            (d.requests || []).filter(
              (x: LeaveRow) => x.status === "Chờ duyệt",
            ),
          );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, date]);

  const reload = () => setTick((t) => t + 1);
  // Bấm "Có mặt" cho hôm nay thì tự điền giờ đến hiện tại, cô sửa được sau.
  const pick = (childId: number, status: string) =>
    setDraft((s) => ({
      ...s,
      [childId]: {
        status,
        note: status === "Có mặt" ? "" : s[childId]?.note || "",
        checkInAt:
          status === "Có mặt"
            ? s[childId]?.checkInAt || (date === today ? vnNow() : "")
            : "",
        checkOutAt: status === "Có mặt" ? s[childId]?.checkOutAt || "" : "",
      },
    }));
  const setTime = (childId: number, field: "checkInAt" | "checkOutAt", value: string) =>
    setDraft((s) => ({ ...s, [childId]: { ...s[childId], [field]: value } }));
  const allPresent = () =>
    setDraft((s) =>
      Object.fromEntries(
        rows.map((x) => [
          x.childId,
          {
            status: "Có mặt",
            note: "",
            checkInAt:
              s[x.childId]?.checkInAt || (date === today ? vnNow() : ""),
            checkOutAt: s[x.childId]?.checkOutAt || "",
          },
        ]),
      ),
    );
  const present = rows.filter(
    (x) => (draft[x.childId]?.status || "Có mặt") === "Có mặt",
  ).length;
  const recorded = rows.filter((x) => x.recorded).length;
  const pending = leaves.filter((x) => x.toDate >= date);

  async function save() {
    if (!rows.length) return;
    setSaving(true);
    const r = await fetch("/api/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date,
          items: rows.map((x) => ({
            childId: x.childId,
            status: draft[x.childId]?.status || "Có mặt",
            note: draft[x.childId]?.note || "",
            checkInAt: draft[x.childId]?.checkInAt || "",
            checkOutAt: draft[x.childId]?.checkOutAt || "",
          })),
        }),
      }),
      d = await r.json();
    setSaving(false);
    if (!r.ok) {
      ping(d.error || "Chưa lưu được điểm danh");
      return;
    }
    setRows((s) =>
      s.map((x) => ({
        ...x,
        recorded: true,
        status: draft[x.childId]?.status || "Có mặt",
        note: draft[x.childId]?.note || "",
      })),
    );
    ping(`Đã lưu: ${d.present} có mặt · ${d.absent} vắng`);
  }

  async function review(id: number, status: string) {
    const r = await fetch("/api/leave-requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Không xử lý được đơn");
      return;
    }
    ping(status === "Đã duyệt" ? "Đã duyệt đơn xin nghỉ" : "Đã từ chối đơn");
    reload();
  }

  return (
    <>
      <PageHead
        icon="🙋"
        title="Điểm danh"
        sub="Mặc định cả lớp có mặt — cô chỉ bấm những bé vắng rồi lưu một lần"
      />
      <DayBar
        date={date}
        setDate={setDate}
        today={today}
        classes={classes}
        classId={classId}
        setClassId={setClassId}
        scope={scope}
      />
      {pending.length > 0 && (
        <div className="panel leave-inbox">
          <Title
            title="Đơn xin nghỉ chờ duyệt"
            sub={`${pending.length} đơn từ phụ huynh`}
          />
          {pending.map((x) => (
            <div className="leave-line" key={x.id}>
              <div>
                <b>{x.childName}</b>
                <small>
                  {x.fromDate === x.toDate
                    ? x.fromDate
                    : `${x.fromDate} → ${x.toDate}`}{" "}
                  · {x.reason}
                  {x.note ? ` · ${x.note}` : ""}
                </small>
              </div>
              <button className="approve" onClick={() => review(x.id, "Đã duyệt")}>
                Duyệt
              </button>
              <button className="reject" onClick={() => review(x.id, "Từ chối")}>
                Từ chối
              </button>
            </div>
          ))}
        </div>
      )}
      {pickups.length > 0 && (
        <div className="panel leave-inbox">
          <Title
            title="Người đón hôm nay"
            sub={`${pickups.length} lượt phụ huynh đã báo trước`}
          />
          {pickups.map((x) => (
            <div className="leave-line" key={x.id}>
              <div>
                <b>
                  {x.childName} — {x.personName}
                  {x.relation ? ` (${x.relation})` : ""}
                </b>
                <small>
                  {x.expectedTime ? `Khoảng ${x.expectedTime}` : "Chưa rõ giờ"}
                  {x.phone ? ` · ${x.phone}` : ""}
                  {x.note ? ` · ${x.note}` : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="attendance-summary">
        <b>
          {present}/{rows.length}
        </b>
        <span>trẻ có mặt</span>
        <div className="progress">
          <i
            style={{
              width: `${rows.length ? (present / rows.length) * 100 : 0}%`,
            }}
          />
        </div>
        <button className="ghost" onClick={allPresent}>
          Tất cả có mặt
        </button>
      </div>
      {recorded > 0 && (
        <p className="daybar-note saved-note">
          Ngày {date} đã có {recorded} trẻ được ghi nhận. Sửa lại rồi bấm lưu sẽ
          ghi đè.
        </p>
      )}
      {rows.length > 0 && (
        <p className="export-line">
          <button
            className="linkbtn"
            onClick={async () => {
              const month = date.slice(0, 7);
              const r = await fetch(`/api/attendance?month=${month}`),
                d = await r.json();
              if (!r.ok) {
                ping(d.error || "Không xuất được bảng chuyên cần");
                return;
              }
              const days = [
                ...new Set(
                  (d.marks || []).map((m: { date: string }) => m.date),
                ),
              ].sort() as string[];
              const sheet = XLSX.utils.json_to_sheet(
                (d.children || []).map(
                  (c: { childId: number; name: string; className: string }) => {
                    const row: Record<string, string | number> = {
                      "Họ tên": c.name,
                      "Lớp": c.className,
                    };
                    let present = 0;
                    for (const day of days) {
                      const mark = (d.marks || []).find(
                        (m: { childId: number; date: string }) =>
                          m.childId === c.childId && m.date === day,
                      );
                      row[day.slice(8)] = mark
                        ? mark.status === "Có mặt"
                          ? "x"
                          : mark.status === "Vắng có phép"
                            ? "P"
                            : "K"
                        : "";
                      if (mark?.status === "Có mặt") present += 1;
                    }
                    row["Ngày ăn"] = present;
                    return row;
                  },
                ),
              );
              const book = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(book, sheet, month);
              XLSX.writeFile(book, `diem-danh-${month}.xlsx`);
              ping(`Đã xuất bảng chuyên cần tháng ${month}`);
            }}
          >
            ⇩ Xuất bảng chuyên cần tháng {date.slice(0, 7)} (x = có mặt · P = có
            phép · K = không phép)
          </button>
        </p>
      )}
      <div className="panel">
        <div className="att-grid">
          {rows.map((x) => {
            const status = draft[x.childId]?.status || "Có mặt";
            return (
              <div className="att-card" key={x.childId}>
                <i>
                  <ChibiIcon icon="🧒" />
                </i>
                <b>{x.name}</b>
                <small>
                  {x.className}
                  {x.leaveReason ? " · phụ huynh đã xin nghỉ" : ""}
                </small>
                <div className="att-choice">
                  {ATT_CHOICES.map(([value, label, tone]) => (
                    <button
                      key={value}
                      className={status === value ? `on ${tone}` : ""}
                      onClick={() => pick(x.childId, value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {status === "Có mặt" ? (
                  <div className="att-times">
                    <label>
                      Đến
                      <input
                        type="time"
                        value={draft[x.childId]?.checkInAt || ""}
                        onChange={(e) =>
                          setTime(x.childId, "checkInAt", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Về
                      <input
                        type="time"
                        value={draft[x.childId]?.checkOutAt || ""}
                        onChange={(e) =>
                          setTime(x.childId, "checkOutAt", e.target.value)
                        }
                      />
                    </label>
                  </div>
                ) : (
                  <input
                    className="att-note"
                    placeholder="Lý do (không bắt buộc)"
                    value={draft[x.childId]?.note || ""}
                    onChange={(e) =>
                      setDraft((s) => ({
                        ...s,
                        [x.childId]: { ...s[x.childId], status, note: e.target.value },
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        {rows.length > 0 && (
          <button className="save finish" onClick={save} disabled={saving}>
            {saving ? "Đang lưu…" : `Lưu điểm danh ${rows.length} trẻ`}
          </button>
        )}
      </div>
      {!loading && !rows.length && (
        <div className="empty">
          Chưa có hồ sơ trẻ trong phạm vi này. Vào “Hồ sơ trẻ” để thêm mới hoặc
          nhập từ Excel.
        </div>
      )}
    </>
  );
}

type CareRow = {
  childId: number;
  name: string;
  className: string;
  allergy: string;
  breakfast: string;
  lunch: string;
  snack: string;
  sleep: string;
  sleepMinutes: number | null;
  mood: string;
  health: string;
  note: string;
  recorded: boolean;
};
type CareOptions = {
  meals: string[];
  sleeps: string[];
  moods: string[];
  health: string[];
};
const CARE_COLUMNS: [keyof CareRow, string, keyof CareOptions][] = [
  ["breakfast", "BỮA SÁNG", "meals"],
  ["lunch", "BỮA TRƯA", "meals"],
  ["snack", "BỮA XẾ", "meals"],
  ["sleep", "GIẤC NGỦ", "sleeps"],
  ["mood", "TÂM TRẠNG", "moods"],
  ["health", "SỨC KHỎE", "health"],
];

function Care({ ping }: { ping: (s: string) => void }) {
  const [date, setDate] = useState(vnToday()),
    [today, setToday] = useState(vnToday()),
    [classId, setClassId] = useState(""),
    [classes, setClasses] = useState<ClassOption[]>([]),
    [scope, setScope] = useState(""),
    [rows, setRows] = useState<CareRow[]>([]),
    [options, setOptions] = useState<CareOptions>({
      meals: [],
      sleeps: [],
      moods: [],
      health: [],
    }),
    [saving, setSaving] = useState(false),
    [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const query = new URLSearchParams({ date });
    if (classId !== "") query.set("classId", classId);
    fetch(`/api/daily-logs?${query}`)
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!live) return;
        setLoading(false);
        if (!ok) {
          ping(d.error || "Không tải được sổ chăm sóc");
          return;
        }
        setToday(d.today);
        setClasses(d.classes || []);
        setScope(d.scope);
        setRows(d.rows || []);
        setOptions(d.options);
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, classId]);

  const edit = (childId: number, field: keyof CareRow, value: string) =>
    setRows((s) =>
      s.map((x) => (x.childId === childId ? { ...x, [field]: value } : x)),
    );
  const applyAll = (field: keyof CareRow, value: string) => {
    if (!value) return;
    setRows((s) => s.map((x) => ({ ...x, [field]: value })));
    ping(`Đã áp dụng “${value}” cho cả lớp`);
  };

  async function save() {
    if (!rows.length) return;
    setSaving(true);
    const r = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date,
          items: rows.map((x) => ({
            childId: x.childId,
            breakfast: x.breakfast,
            lunch: x.lunch,
            snack: x.snack,
            sleep: x.sleep,
            sleepMinutes: x.sleepMinutes ?? "",
            mood: x.mood,
            health: x.health,
            note: x.note,
          })),
        }),
      }),
      d = await r.json();
    setSaving(false);
    if (!r.ok) {
      ping(d.error || "Chưa lưu được sổ chăm sóc");
      return;
    }
    setRows((s) => s.map((x) => ({ ...x, recorded: true })));
    ping(`Đã lưu sổ chăm sóc ${d.saved} trẻ`);
  }

  return (
    <>
      <DayBar
        date={date}
        setDate={setDate}
        today={today}
        classes={classes}
        classId={classId}
        setClassId={setClassId}
        scope={scope}
      />
      <div className="panel tablewrap care-table">
        <table>
          <thead>
            <tr>
              <th>TRẺ</th>
              {CARE_COLUMNS.map(([field, label, group]) => (
                <th key={field}>
                  <span>{label}</span>
                  <select
                    value=""
                    onChange={(e) => applyAll(field, e.target.value)}
                  >
                    <option value="">Cả lớp…</option>
                    {options[group].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </th>
              ))}
              <th>LƯU Ý RIÊNG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.childId}>
                <td>
                  <div className="person">
                    <i>
                      <ChibiIcon icon="🧒" />
                    </i>
                    <div>
                      <b>{x.name}</b>
                      {x.allergy && x.allergy !== "Không" && (
                        <small className="allergy">Dị ứng: {x.allergy}</small>
                      )}
                    </div>
                  </div>
                </td>
                {CARE_COLUMNS.map(([field, , group]) => (
                  <td key={field}>
                    <select
                      value={String(x[field] ?? "")}
                      onChange={(e) => edit(x.childId, field, e.target.value)}
                    >
                      <option value="">—</option>
                      {options[group].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {field === "sleep" && (
                      <input
                        className="sleep-minutes"
                        inputMode="numeric"
                        placeholder="phút"
                        value={x.sleepMinutes ?? ""}
                        onChange={(e) =>
                          setRows((s) =>
                            s.map((r) =>
                              r.childId === x.childId
                                ? {
                                    ...r,
                                    sleepMinutes:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value) || 0,
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    )}
                  </td>
                ))}
                <td>
                  <input
                    placeholder="Ghi chú gửi phụ huynh…"
                    value={x.note}
                    onChange={(e) => edit(x.childId, "note", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 0 && (
          <button className="save finish" onClick={save} disabled={saving}>
            {saving ? "Đang lưu…" : `Lưu sổ chăm sóc ${rows.length} trẻ`}
          </button>
        )}
      </div>
      {!loading && !rows.length && (
        <div className="empty">Chưa có hồ sơ trẻ trong phạm vi này.</div>
      )}
    </>
  );
}

type MediaRef = { key: string; contentType: string };
type PostRow = {
  id: number;
  classId: number | null;
  title: string;
  content: string;
  category: string;
  date: string;
  authorId: number;
  authorName: string;
  media: MediaRef[];
  children: { id: number; name: string }[];
  taggedCount: number;
};
type MessageRow = {
  id: number;
  childId: number;
  body: string;
  senderName: string;
  senderRole: string;
  mine: boolean;
  readAt: string;
  createdAt: string;
};
type ThreadRow = {
  childId: number;
  name: string;
  className: string;
  lastBody: string;
  lastAt: string;
  unread: number;
};
type IncidentRow = {
  id: number;
  childId: number;
  childName: string;
  className: string;
  date: string;
  time: string;
  kind: string;
  severity: string;
  description: string;
  handling: string;
  mediaKey: string | null;
  recordedName: string;
  acknowledgedBy: number | null;
  acknowledgedAt: string;
};
type HealthPoint = {
  date: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  note: string;
};
type HealthChild = {
  childId: number;
  name: string;
  className: string;
  birthDate: string;
  history: HealthPoint[];
  latest: HealthPoint | null;
};
type MenuDay = {
  weekday: number;
  label: string;
  date: string;
  breakfast: string;
  lunch: string;
  snack: string;
  note: string;
};
type MenuWarning = {
  childId: number;
  childName: string;
  className: string;
  weekday: number;
  dayLabel: string;
  meal: string;
  dish: string;
  allergens: string[];
};

function mediaUrl(key: string) {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

/** Nhật ký lớp: cô đăng bài kèm ảnh và gắn thẻ những bé có trong ảnh. */
function Journal({ ping }: { ping: (s: string) => void }) {
  const [items, setItems] = useState<PostRow[]>([]),
    [categories, setCategories] = useState<string[]>([]),
    [children, setChildren] = useState<Child[]>([]),
    [classes, setClasses] = useState<ClassOption[]>([]),
    [open, setOpen] = useState(false),
    [me, setMe] = useState<number | null>(null),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch("/api/posts").then((r) => (r.ok ? r.json() : { posts: [] })),
      fetch("/api/children").then((r) => (r.ok ? r.json() : { children: [] })),
      fetch("/api/auth").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p, c, a]) => {
        if (!live) return;
        setItems(p.posts || []);
        setCategories(p.categories || []);
        setChildren(c.children || []);
        setClasses(c.classes || []);
        setMe(a?.user?.id ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  async function remove(id: number) {
    if (!confirm("Xóa bài viết này cùng toàn bộ ảnh?")) return;
    const r = await fetch(`/api/posts?id=${id}`, { method: "DELETE" }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Không xóa được bài");
      return;
    }
    ping("Đã xóa bài viết");
    setTick((t) => t + 1);
  }

  return (
    <>
      <PageHead
        icon="✎"
        title="Nhật ký lớp"
        sub="Đăng ảnh và hoạt động — phụ huynh chỉ thấy ảnh có con mình"
        action="Viết bài"
        onClick={() => setOpen(true)}
      />
      <div className="journal-list">
        {items.map((x) => (
          <article className="panel journal-post" key={x.id}>
            <header>
              <div>
                <small>
                  {x.category} · {x.date} · {x.authorName}
                </small>
                <h2>{x.title}</h2>
              </div>
              {me === x.authorId && (
                <button className="linkbtn" onClick={() => remove(x.id)}>
                  Xóa
                </button>
              )}
            </header>
            {x.content && <p>{x.content}</p>}
            {x.media.length > 0 && (
              <div className="photo-grid">
                {x.media.map((m) => (
                  <a
                    key={m.key}
                    href={mediaUrl(m.key)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={mediaUrl(m.key)} alt={x.title} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
            <footer>
              <span>📷 {x.media.length} ảnh</span>
              <span>
                {x.taggedCount
                  ? `🏷 ${x.children.map((c) => c.name).join(", ") || `${x.taggedCount} bé`}`
                  : "🏷 Bài chung cả lớp"}
              </span>
            </footer>
          </article>
        ))}
        {!items.length && (
          <div className="panel empty">
            Chưa có bài viết nào. Bấm “Viết bài” để chia sẻ hoạt động hôm nay.
          </div>
        )}
      </div>
      {open && (
        <PostComposer
          categories={categories}
          classes={classes}
          childList={children}
          ping={ping}
          close={() => setOpen(false)}
          done={() => {
            setOpen(false);
            setTick((t) => t + 1);
            ping("Đã đăng bài lên nhật ký lớp");
          }}
        />
      )}
    </>
  );
}

function PostComposer({
  categories,
  classes,
  childList,
  ping,
  close,
  done,
}: {
  categories: string[];
  classes: ClassOption[];
  childList: Child[];
  ping: (s: string) => void;
  close: () => void;
  done: () => void;
}) {
  const [media, setMedia] = useState<MediaRef[]>([]),
    [tagged, setTagged] = useState<number[]>([]),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    for (const file of files) form.append("file", file);
    const r = await fetch("/api/media", { method: "POST", body: form }),
      d = await r.json();
    setUploading(false);
    if (!r.ok) {
      setError(d.error || "Không tải được ảnh");
      return;
    }
    setMedia((s) => [...s, ...d.media].slice(0, 12));
    ping(`Đã tải lên ${d.media.length} ảnh`);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: String(f.get("title")),
          content: String(f.get("content") || ""),
          category: String(f.get("category")),
          date: String(f.get("date")),
          classId: Number(f.get("classId")) || null,
          childIds: tagged,
          media,
        }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Chưa đăng được bài");
      return;
    }
    done();
  }

  return (
    <div className="back">
      <form className="modal wide" onSubmit={submit}>
        <button type="button" className="x" onClick={close}>
          ×
        </button>
        <i className="big">
          <ChibiIcon icon="✎" />
        </i>
        <h2>Viết nhật ký lớp</h2>
        <p>Gắn thẻ bé nào có trong ảnh để đúng phụ huynh đó nhìn thấy.</p>
        <label>
          Tiêu đề
          <input name="title" required placeholder="Ví dụ: Khám phá vườn rau" />
        </label>
        <div className="row">
          <label>
            Chủ đề
            <select name="category">
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Ngày
            <input type="date" name="date" defaultValue={vnToday()} max={vnToday()} />
          </label>
        </div>
        {classes.length > 0 && (
          <label>
            Lớp
            <select name="classId">
              <option value="">Toàn trường</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Nội dung
          <textarea name="content" rows={4} placeholder="Hôm nay các con…" />
        </label>
        <label className="upload-label">
          Ảnh ({media.length}/12)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={upload}
            disabled={uploading || media.length >= 12}
          />
        </label>
        {uploading && <p className="daybar-note">Đang tải ảnh lên…</p>}
        {media.length > 0 && (
          <div className="upload-preview">
            {media.map((m) => (
              <div key={m.key}>
                <img src={mediaUrl(m.key)} alt="Ảnh đã tải lên" />
                <button
                  type="button"
                  onClick={() =>
                    setMedia((s) => s.filter((x) => x.key !== m.key))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="tag-picker">
          <b>Gắn thẻ bé có trong bài</b>
          <small>
            Không chọn ai nghĩa là bài chung, mọi phụ huynh trong lớp đều xem
            được.
          </small>
          <div>
            {childList.map((c) => (
              <button
                type="button"
                key={c.id}
                className={tagged.includes(c.id!) ? "on" : ""}
                onClick={() =>
                  setTagged((s) =>
                    s.includes(c.id!)
                      ? s.filter((x) => x !== c.id)
                      : [...s, c.id!],
                  )
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="save" disabled={busy || uploading}>
          {busy ? "Đang đăng…" : "Đăng bài"}
        </button>
      </form>
    </div>
  );
}

/** Hội thoại phụ huynh – giáo viên, dùng chung cho cả hai vai trò. */
function Messages({
  ping,
  parentView = false,
}: {
  ping: (s: string) => void;
  parentView?: boolean;
}) {
  const [threads, setThreads] = useState<ThreadRow[]>([]),
    [list, setList] = useState<MessageRow[]>([]),
    [childId, setChildId] = useState<number | null>(null),
    [office, setOffice] = useState({ from: "07:00", to: "17:30" }),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    const query = childId ? `?childId=${childId}` : "";
    fetch(`/api/messages${query}`)
      .then((r) => (r.ok ? r.json() : { threads: [], messages: [] }))
      .then((d) => {
        if (!live) return;
        setThreads(d.threads || []);
        setList(d.messages || []);
        if (d.officeHours) setOffice(d.officeHours);
        if (d.childId && d.childId !== childId) setChildId(d.childId);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, tick]);

  const now = vnNow();
  const offHours = now < office.from || now > office.to;
  const current = threads.find((x) => x.childId === childId);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() || !childId) return;
    setBusy(true);
    const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId, body: draft }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) {
      ping(d.error || "Chưa gửi được tin nhắn");
      return;
    }
    setDraft("");
    setTick((t) => t + 1);
  }

  return (
    <>
      <PageHead
        icon="💬"
        title="Tin nhắn"
        sub={
          parentView
            ? "Trao đổi riêng với giáo viên chủ nhiệm của con"
            : "Trao đổi riêng với phụ huynh từng bé"
        }
      />
      {!threads.length ? (
        <div className="empty">
          {parentView
            ? "Tài khoản chưa được liên kết với hồ sơ trẻ."
            : "Chưa có hồ sơ trẻ trong lớp bạn phụ trách."}
        </div>
      ) : (
        <div className="chat-layout">
          <div className="panel chat-threads">
            <Title title="Hội thoại" sub={`${threads.length} bé`} />
            {threads.map((t) => (
              <button
                key={t.childId}
                className={`thread${t.childId === childId ? " on" : ""}`}
                onClick={() => setChildId(t.childId)}
              >
                <i>
                  <ChibiIcon icon="🧒" />
                </i>
                <div>
                  <b>{t.name}</b>
                  <small>{t.lastBody || "Chưa có tin nhắn"}</small>
                </div>
                {t.unread > 0 && <em>{t.unread}</em>}
              </button>
            ))}
          </div>
          <div className="panel chat-box">
            <Title
              title={current ? current.name : "Hội thoại"}
              sub={current?.className || ""}
            />
            <div className="chat-log">
              {list.map((m) => (
                <div className={`bubble${m.mine ? " mine" : ""}`} key={m.id}>
                  <small>
                    {m.senderName}
                    {m.senderRole === "parent" ? " · phụ huynh" : " · giáo viên"}
                  </small>
                  <p>{m.body}</p>
                  <time>{m.createdAt}</time>
                </div>
              ))}
              {!list.length && (
                <div className="empty">
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.
                </div>
              )}
            </div>
            {parentView && offHours && (
              <p className="daybar-note">
                Ngoài giờ làm việc ({office.from}–{office.to}). Tin vẫn được gửi,
                cô sẽ trả lời vào sáng mai.
              </p>
            )}
            <form className="chat-send" onSubmit={send}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nhập tin nhắn…"
                maxLength={2000}
              />
              <button className="save" disabled={busy || !draft.trim()}>
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


/** Ghi nhận sự cố và y tế: gửi ngay cho phụ huynh, có xác nhận đã đọc. */
function Incidents({ ping }: { ping: (s: string) => void }) {
  const [rows, setRows] = useState<IncidentRow[]>([]),
    [children, setChildren] = useState<Child[]>([]),
    [kinds, setKinds] = useState<string[]>([]),
    [severities, setSeverities] = useState<string[]>([]),
    [today, setToday] = useState(vnToday()),
    [open, setOpen] = useState(false),
    [photo, setPhoto] = useState<MediaRef | null>(null),
    [uploading, setUploading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const r = await fetch("/api/media", { method: "POST", body: form }),
      d = await r.json();
    setUploading(false);
    if (!r.ok) {
      setError(d.error || "Không tải được ảnh");
      return;
    }
    setPhoto(d.media[0]);
  }

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch("/api/incidents").then((r) => (r.ok ? r.json() : { incidents: [] })),
      fetch("/api/children").then((r) => (r.ok ? r.json() : { children: [] })),
    ])
      .then(([i, c]) => {
        if (!live) return;
        setRows(i.incidents || []);
        setKinds(i.kinds || []);
        setSeverities(i.severities || []);
        if (i.today) setToday(i.today);
        setChildren(c.children || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/incidents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childId: Number(f.get("childId")),
          date: String(f.get("date")),
          time: String(f.get("time")),
          kind: String(f.get("kind")),
          severity: String(f.get("severity")),
          description: String(f.get("description")),
          handling: String(f.get("handling") || ""),
          mediaKey: photo?.key || "",
        }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Chưa ghi nhận được");
      return;
    }
    setOpen(false);
    setPhoto(null);
    setTick((t) => t + 1);
    ping("Đã gửi tới phụ huynh, chờ xác nhận");
  }

  const waiting = rows.filter((x) => !x.acknowledgedBy).length;
  return (
    <>
      <div className="care-head">
        <div>
          <b>Sự cố · y tế</b>
          <small>
            {rows.length} bản ghi ·{" "}
            {waiting ? `${waiting} chờ phụ huynh xác nhận` : "đã xác nhận hết"}
          </small>
        </div>
        <button className="pill-action" onClick={() => setOpen(true)}>
          ＋ Ghi nhận
        </button>
      </div>
      <div className="panel">
        {rows.map((x) => (
          <article className={`incident sev-${x.severity === "Khẩn" ? "high" : x.severity === "Cần theo dõi" ? "mid" : "low"}`} key={x.id}>
            <div>
              <b>
                {x.childName} · {x.kind}
              </b>
              <small>
                {x.date} {x.time} · {x.className} · {x.severity}
                {x.recordedName ? ` · ${x.recordedName}` : ""}
              </small>
              <p>{x.description}</p>
              {x.handling && <p className="handling">Xử lý: {x.handling}</p>}
              {x.mediaKey && (
                <a href={mediaUrl(x.mediaKey)} target="_blank" rel="noreferrer">
                  <img
                    className="incident-photo"
                    src={mediaUrl(x.mediaKey)}
                    alt={`Ảnh sự cố của ${x.childName}`}
                    loading="lazy"
                  />
                </a>
              )}
            </div>
            <span className={x.acknowledgedBy ? "leave-status ok" : "leave-status wait"}>
              {x.acknowledgedBy ? "PH đã xác nhận" : "Chờ xác nhận"}
            </span>
          </article>
        ))}
        {!rows.length && (
          <div className="empty">Chưa có sự cố nào được ghi nhận.</div>
        )}
      </div>
      {open && (
        <div className="back">
          <form className="modal" onSubmit={submit}>
            <button type="button" className="x" onClick={() => setOpen(false)}>
              ×
            </button>
            <i className="big">
              <ChibiIcon icon="💗" />
            </i>
            <h2>Ghi nhận sự cố</h2>
            <p>Phụ huynh nhận được ngay và phải bấm xác nhận đã đọc.</p>
            <label>
              Bé
              <select name="childId" required>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.className}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <label>
                Ngày
                <input type="date" name="date" defaultValue={today} max={today} />
              </label>
              <label>
                Giờ
                <input type="time" name="time" defaultValue={vnNow()} />
              </label>
            </div>
            <div className="row">
              <label>
                Sự việc
                <select name="kind">
                  {kinds.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Mức độ
                <select name="severity">
                  {severities.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Diễn biến
              <textarea name="description" rows={3} required placeholder="Con sốt 38.2 độ lúc 10h…" />
            </label>
            <label>
              Nhà trường đã xử lý
              <textarea name="handling" rows={2} placeholder="Chườm mát, cho uống nước, theo dõi 30 phút…" />
            </label>
            <label className="upload-label">
              Ảnh kèm theo (không bắt buộc)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadPhoto}
                disabled={uploading}
              />
            </label>
            {uploading && <p className="daybar-note">Đang tải ảnh lên…</p>}
            {photo && (
              <div className="upload-preview">
                <div>
                  <img src={mediaUrl(photo.key)} alt="Ảnh sự cố" />
                  <button type="button" onClick={() => setPhoto(null)}>
                    ×
                  </button>
                </div>
              </div>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="save" disabled={busy || uploading}>
              {busy ? "Đang gửi…" : "Gửi cho phụ huynh"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** Cân đo định kỳ, tự tính BMI để cô thấy ngay bé nào cần lưu ý. */
function HealthBoard({ ping }: { ping: (s: string) => void }) {
  const [date, setDate] = useState(vnToday()),
    [today, setToday] = useState(vnToday()),
    [classId, setClassId] = useState(""),
    [classes, setClasses] = useState<ClassOption[]>([]),
    [scope, setScope] = useState(""),
    [rows, setRows] = useState<HealthChild[]>([]),
    [draft, setDraft] = useState<Record<number, { heightCm: string; weightKg: string; note: string }>>({}),
    [saving, setSaving] = useState(false),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    const query = new URLSearchParams();
    if (classId !== "") query.set("classId", classId);
    fetch(`/api/health?${query}`)
      .then((r) => (r.ok ? r.json() : { children: [] }))
      .then((d) => {
        if (!live) return;
        setRows(d.children || []);
        setClasses(d.classes || []);
        setScope(d.scope || "");
        if (d.today) setToday(d.today);
        setDraft(
          Object.fromEntries(
            (d.children || []).map((c: HealthChild) => {
              const onDate = c.history.find((h) => h.date === date);
              return [
                c.childId,
                {
                  heightCm: onDate?.heightCm ? String(onDate.heightCm) : "",
                  weightKg: onDate?.weightKg ? String(onDate.weightKg) : "",
                  note: onDate?.note || "",
                },
              ];
            }),
          ),
        );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, tick]);

  const edit = (id: number, field: string, value: string) =>
    setDraft((s) => ({
      ...s,
      [id]: { ...(s[id] || { heightCm: "", weightKg: "", note: "" }), [field]: value },
    }));

  async function save() {
    setSaving(true);
    const r = await fetch("/api/health", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date,
          items: rows.map((c) => ({
            childId: c.childId,
            heightCm: Number(draft[c.childId]?.heightCm) || 0,
            weightKg: Number(draft[c.childId]?.weightKg) || 0,
            note: draft[c.childId]?.note || "",
          })),
        }),
      }),
      d = await r.json();
    setSaving(false);
    if (!r.ok) {
      ping(d.error || "Chưa lưu được số đo");
      return;
    }
    ping(`Đã lưu cân đo ${d.saved} trẻ`);
    setTick((t) => t + 1);
  }

  return (
    <>
      <DayBar
        date={date}
        setDate={setDate}
        today={today}
        classes={classes}
        classId={classId}
        setClassId={setClassId}
        scope={scope}
      />
      <div className="panel tablewrap health-table">
        <table>
          <thead>
            <tr>
              <th>TRẺ</th>
              <th>CAO (CM)</th>
              <th>NẶNG (KG)</th>
              <th>BMI GẦN NHẤT</th>
              <th>GHI CHÚ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.childId}>
                <td>
                  <div className="person">
                    <i>
                      <ChibiIcon icon="🧒" />
                    </i>
                    <div>
                      <b>{c.name}</b>
                      <small>{c.className}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <input
                    inputMode="decimal"
                    value={draft[c.childId]?.heightCm || ""}
                    onChange={(e) => edit(c.childId, "heightCm", e.target.value)}
                    placeholder="—"
                  />
                </td>
                <td>
                  <input
                    inputMode="decimal"
                    value={draft[c.childId]?.weightKg || ""}
                    onChange={(e) => edit(c.childId, "weightKg", e.target.value)}
                    placeholder="—"
                  />
                </td>
                <td>
                  {c.latest?.bmi ? (
                    <span className="bmi">
                      {c.latest.bmi}
                      <small>{c.latest.date}</small>
                    </span>
                  ) : (
                    <small className="muted-cell">chưa có</small>
                  )}
                </td>
                <td>
                  <input
                    value={draft[c.childId]?.note || ""}
                    onChange={(e) => edit(c.childId, "note", e.target.value)}
                    placeholder="Ghi chú…"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 0 && (
          <button className="save finish" onClick={save} disabled={saving}>
            {saving ? "Đang lưu…" : `Lưu cân đo ngày ${date}`}
          </button>
        )}
      </div>
      {!rows.length && <div className="empty">Chưa có hồ sơ trẻ.</div>}
    </>
  );
}

/** Thực đơn tuần: nhà trường nhập, giáo viên và phụ huynh xem kèm cảnh báo dị ứng. */
function MenuBoard({
  ping,
  editable = false,
}: {
  ping: (s: string) => void;
  editable?: boolean;
}) {
  const [week, setWeek] = useState(weekStartOf(vnToday())),
    [days, setDays] = useState<MenuDay[]>([]),
    [warnings, setWarnings] = useState<MenuWarning[]>([]),
    [canEdit, setCanEdit] = useState(false),
    [nav, setNav] = useState({ prev: "", next: "" }),
    [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/menus?week=${week}`)
      .then((r) => (r.ok ? r.json() : { days: [] }))
      .then((d) => {
        if (!live) return;
        setDays(d.days || []);
        setWarnings(d.warnings || []);
        setCanEdit(Boolean(d.canEdit));
        setNav({ prev: d.prevWeek, next: d.nextWeek });
        if (d.weekStart && d.weekStart !== week) setWeek(d.weekStart);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [week]);

  const edit = (weekday: number, field: keyof MenuDay, value: string) =>
    setDays((s) =>
      s.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d)),
    );

  async function save() {
    setSaving(true);
    const r = await fetch("/api/menus", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekStart: week, days }),
      }),
      d = await r.json();
    setSaving(false);
    if (!r.ok) {
      ping(d.error || "Chưa lưu được thực đơn");
      return;
    }
    ping("Đã cập nhật thực đơn tuần");
  }

  const writable = editable && canEdit;
  const hitFor = (weekday: number, meal: string) =>
    warnings.filter((w) => w.weekday === weekday && w.meal === meal);

  return (
    <>
      <div className="daybar">
        <button className="ghost" onClick={() => setWeek(nav.prev)}>
          ← Tuần trước
        </button>
        <label>
          Tuần bắt đầu
          <input
            type="date"
            value={week}
            onChange={(e) => e.target.value && setWeek(e.target.value)}
          />
        </label>
        <button className="ghost" onClick={() => setWeek(nav.next)}>
          Tuần sau →
        </button>
      </div>
      <div className="menu-week">
        {days.map((d) => (
          <article key={d.weekday}>
            <header>
              <b>{d.label}</b>
              <small>{d.date.slice(8)}/{d.date.slice(5, 7)}</small>
            </header>
            {(
              [
                ["breakfast", "BỮA SÁNG", "🥣", "bữa sáng"],
                ["lunch", "BỮA TRƯA", "🍱", "bữa trưa"],
                ["snack", "BỮA XẾ", "🥛", "bữa xế"],
              ] as [keyof MenuDay, string, string, string][]
            ).map(([field, label, icon, mealKey]) => {
              const hits = hitFor(d.weekday, mealKey);
              return (
                <div className={hits.length ? "meal-warn" : ""} key={field}>
                  <i>
                    <ChibiIcon icon={icon} />
                  </i>
                  <small>{label}</small>
                  {writable ? (
                    <textarea
                      rows={2}
                      value={String(d[field] ?? "")}
                      onChange={(e) => edit(d.weekday, field, e.target.value)}
                      placeholder="Nhập món…"
                    />
                  ) : (
                    <p>{String(d[field] ?? "") || "Chưa cập nhật"}</p>
                  )}
                  {hits.length > 0 && (
                    <b className="warn-flag">
                      ⚠ {hits.map((h) => h.childName).join(", ")} dị ứng{" "}
                      {[...new Set(hits.flatMap((h) => h.allergens))].join(", ")}
                    </b>
                  )}
                </div>
              );
            })}
            {writable ? (
              <div className="menu-note">
                <small>GHI CHÚ</small>
                <textarea
                  rows={1}
                  value={d.note}
                  onChange={(e) => edit(d.weekday, "note", e.target.value)}
                  placeholder="Ví dụ: đổi món vì trời mưa…"
                />
              </div>
            ) : (
              d.note && (
                <div className="menu-note">
                  <small>GHI CHÚ</small>
                  <p>{d.note}</p>
                </div>
              )
            )}
          </article>
        ))}
      </div>
      {writable && (
        <button className="save finish" onClick={save} disabled={saving}>
          {saving ? "Đang lưu…" : "Lưu thực đơn tuần"}
        </button>
      )}
      {!writable && warnings.length > 0 && (
        <div className="panel">
          <Title
            title="Cảnh báo dị ứng tuần này"
            sub={`${warnings.length} món cần đổi hoặc chuẩn bị suất riêng`}
          />
          {warnings.map((w, i) => (
            <div className="leave-line" key={`${w.childId}-${w.weekday}-${w.meal}-${i}`}>
              <div>
                <b>
                  {w.childName} · {w.dayLabel} · {w.meal}
                </b>
                <small>
                  {w.dish} — dị ứng {w.allergens.join(", ")}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
      {!warnings.length && !writable && (
        <p className="daybar-note saved-note">
          Không có món nào trùng với danh sách dị ứng của các bé trong tuần này.
        </p>
      )}
    </>
  );
}

const CARE_TABS = [
  ["daily", "🍚 Sổ hằng ngày"],
  ["incident", "💗 Sự cố · y tế"],
  ["health", "📊 Cân đo"],
  ["assess", "⭐ Đánh giá"],
  ["menu", "🍲 Thực đơn"],
];

function CareArea({ ping }: { ping: (s: string) => void }) {
  const [tab, setTab] = useState("daily");
  return (
    <>
      <PageHead
        icon="♥"
        title="Sổ chăm sóc"
        sub="Ăn ngủ, sự cố y tế, cân đo và thực đơn của lớp"
      />
      <div className="care-tabs">
        {CARE_TABS.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "on" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "daily" && <Care ping={ping} />}
      {tab === "incident" && <Incidents ping={ping} />}
      {tab === "health" && <HealthBoard ping={ping} />}
      {tab === "assess" && <AssessmentBoard ping={ping} />}
      {tab === "menu" && <MenuBoard ping={ping} />}
    </>
  );
}


/** Album của con: chỉ những bài có gắn thẻ con mình hoặc bài chung của lớp. */
function ParentJournal() {
  const [items, setItems] = useState<PostRow[]>([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch("/api/posts")
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => {
        if (!live) return;
        setItems(d.posts || []);
        setLoading(false);
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);
  const photos = items.reduce((sum, x) => sum + x.media.length, 0);
  return (
    <>
      <PageHead
        icon="✎"
        title="Nhật ký của con"
        sub={`${items.length} bài · ${photos} ảnh do cô giáo chia sẻ`}
      />
      <div className="journal-list">
        {items.map((x) => (
          <article className="panel journal-post" key={x.id}>
            <header>
              <div>
                <small>
                  {x.category} · {x.date} · {x.authorName}
                </small>
                <h2>{x.title}</h2>
              </div>
            </header>
            {x.content && <p>{x.content}</p>}
            {x.media.length > 0 && (
              <div className="photo-grid">
                {x.media.map((m) => (
                  <a
                    key={m.key}
                    href={mediaUrl(m.key)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={mediaUrl(m.key)} alt={x.title} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
            {x.children.length > 0 && (
              <footer>
                <span>🏷 Có {x.children.map((c) => c.name).join(", ")}</span>
              </footer>
            )}
          </article>
        ))}
        {!loading && !items.length && (
          <div className="panel empty">
            Cô giáo chưa đăng bài nào. Ảnh và hoạt động của con sẽ hiện ở đây.
          </div>
        )}
      </div>
    </>
  );
}

/** Biểu đồ tăng trưởng đơn giản, vẽ bằng SVG nên không cần thư viện ngoài. */
function GrowthChart({
  points,
  field,
  unit,
  color,
}: {
  points: HealthPoint[];
  field: "heightCm" | "weightKg";
  unit: string;
  color: string;
}) {
  const data = points.filter((p) => p[field] !== null) as (HealthPoint & {
    [k: string]: number;
  })[];
  if (data.length < 2)
    return (
      <p className="chart-empty">
        Cần ít nhất hai lần đo để vẽ biểu đồ {unit === "cm" ? "chiều cao" : "cân nặng"}.
      </p>
    );
  const values = data.map((p) => Number(p[field]));
  const min = Math.min(...values),
    max = Math.max(...values),
    span = max - min || 1;
  const w = 280,
    h = 90,
    pad = 6;
  const coords = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Biểu đồ ${unit}`}>
        <polyline points={coords.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {coords.map((c, i) => {
          const [x, y] = c.split(",");
          return <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 2.5} fill={color} />;
        })}
      </svg>
      <div className="chart-legend">
        <span>
          {values[0]} {unit} · {data[0].date}
        </span>
        <b>
          {values[values.length - 1]} {unit}
        </b>
      </div>
    </div>
  );
}

function ParentHealth() {
  const [rows, setRows] = useState<HealthChild[]>([]),
    [picked, setPicked] = useState<number | null>(null),
    [assess, setAssess] = useState<AssessmentRow[]>([]),
    [domains, setDomains] = useState<AssessDomain[]>([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : { children: [] }))
      .then((d) => {
        if (!live) return;
        setRows(d.children || []);
        setPicked((d.children || [])[0]?.childId ?? null);
        setLoading(false);
      })
      .catch(() => live && setLoading(false));
    fetch("/api/assessments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setAssess(d.assessments || []);
        setDomains(d.domains || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const child = rows.find((x) => x.childId === picked) || rows[0] || null;
  return (
    <>
      <PageHead
        icon="💗"
        title="Sổ sức khỏe"
        sub="Chiều cao, cân nặng và BMI theo từng lần cân đo ở trường"
      />
      {rows.length > 1 && (
        <div className="child-switch">
          {rows.map((x) => (
            <button
              key={x.childId}
              className={x.childId === child?.childId ? "on" : ""}
              onClick={() => setPicked(x.childId)}
            >
              <ChibiIcon icon="🧒" />
              {x.name}
            </button>
          ))}
        </div>
      )}
      {child && (
        <>
          <div className="today-list">
            <div className="today-item">
              <i>
                <ChibiIcon icon="🧒" />
              </i>
              <div>
                <small>CHIỀU CAO</small>
                <b>{child.latest?.heightCm ? `${child.latest.heightCm} cm` : "Chưa đo"}</b>
              </div>
            </div>
            <div className="today-item">
              <i>
                <ChibiIcon icon="📊" />
              </i>
              <div>
                <small>CÂN NẶNG</small>
                <b>{child.latest?.weightKg ? `${child.latest.weightKg} kg` : "Chưa đo"}</b>
              </div>
            </div>
            <div className="today-item">
              <i>
                <ChibiIcon icon="💗" />
              </i>
              <div>
                <small>BMI</small>
                <b>{child.latest?.bmi ?? "Chưa có"}</b>
              </div>
            </div>
          </div>
          <div className="grid">
            <div className="panel">
              <Title title="Chiều cao" sub={`${child.history.length} lần đo`} />
              <GrowthChart points={child.history} field="heightCm" unit="cm" color="#2f7d6b" />
            </div>
            <div className="panel">
              <Title title="Cân nặng" sub={`${child.history.length} lần đo`} />
              <GrowthChart points={child.history} field="weightKg" unit="kg" color="#d9846f" />
            </div>
          </div>
          <div className="panel tablewrap">
            <table>
              <thead>
                <tr>
                  <th>NGÀY</th>
                  <th>CHIỀU CAO</th>
                  <th>CÂN NẶNG</th>
                  <th>BMI</th>
                  <th>GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {[...child.history].reverse().map((h) => (
                  <tr key={h.date}>
                    <td>{h.date}</td>
                    <td>{h.heightCm ? `${h.heightCm} cm` : "—"}</td>
                    <td>{h.weightKg ? `${h.weightKg} kg` : "—"}</td>
                    <td>{h.bmi ?? "—"}</td>
                    <td>{h.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!child.history.length && (
              <div className="empty">Trường chưa nhập lần cân đo nào.</div>
            )}
          </div>
          {assess.filter((a) => a.childId === child.childId).length > 0 && (
            <div className="panel">
              <Title
                title="Đánh giá của cô giáo"
                sub="Theo 5 lĩnh vực phát triển"
              />
              {assess
                .filter((a) => a.childId === child.childId)
                .map((a) => (
                  <div className="assess-card" key={a.period}>
                    <b>{a.period}</b>
                    <div className="assess-domains">
                      {domains.map((d) => {
                        const v = a[d.key as keyof AssessmentRow] as string;
                        return v ? (
                          <span
                            key={d.key}
                            className={`leave-status ${v === "Tốt" ? "ok" : v === "Đạt" ? "wait" : "no"}`}
                          >
                            {d.label}: {v}
                          </span>
                        ) : null;
                      })}
                    </div>
                    {a.comment && <p>{a.comment}</p>}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
      {!loading && !rows.length && (
        <div className="empty">Tài khoản chưa được liên kết với hồ sơ trẻ.</div>
      )}
    </>
  );
}

type NoticeRow = {
  id: number;
  title: string;
  content: string;
  audience: string;
  classId: number | null;
  requiresAck: boolean;
  authorName: string;
  read: boolean;
  readCount: number;
  readers: { name: string; at: string }[];
  createdAt: string;
};

function Notices({ ping }: { ping: (s: string) => void }) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<NoticeRow[]>([]),
    [classes, setClasses] = useState<ClassOption[]>([]),
    [readersFor, setReadersFor] = useState<number | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch("/api/announcements").then((r) =>
        r.ok ? r.json() : { announcements: [] },
      ),
      fetch("/api/children").then((r) => (r.ok ? r.json() : { classes: [] })),
    ])
      .then(([a, c]) => {
        if (!live) return;
        setItems(a.announcements || []);
        setClasses(c.classes || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const classId = Number(f.get("classId")) || null;
    const r = await fetch("/api/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: String(f.get("title")),
          content: String(f.get("content")),
          classId,
          audience: classId
            ? `Phụ huynh lớp ${classes.find((c) => c.id === classId)?.name || ""}`.trim()
            : "Toàn trường",
          requiresAck: f.get("requiresAck") === "on",
        }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Không thể gửi thông báo");
      return;
    }
    setOpen(false);
    setTick((t) => t + 1);
    ping("Đã gửi thông báo đúng nhóm phụ huynh");
  }

  return (
    <>
      <PageHead
        icon="📣"
        title="Thông báo"
        sub="Chọn đúng lớp nhận và theo dõi ai đã đọc"
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
                  {x.audience} · {x.createdAt} · {x.authorName}
                </small>
                <h2>{x.title}</h2>
                <p>{x.content}</p>
                <footer>
                  <button
                    className="linkbtn readers-toggle"
                    onClick={() =>
                      setReadersFor((cur) => (cur === x.id ? null : x.id))
                    }
                  >
                    👁 {x.readCount} người đã {x.requiresAck ? "xác nhận" : "đọc"}
                    {x.readCount > 0 &&
                      (readersFor === x.id ? " · thu gọn" : " · xem danh sách")}
                  </button>
                  {x.requiresAck && <span>✓ Cần xác nhận</span>}
                </footer>
                {readersFor === x.id && x.readers.length > 0 && (
                  <div className="readers-list">
                    {x.readers.map((r, i) => (
                      <small key={i}>
                        ✓ {r.name} · {r.at}
                      </small>
                    ))}
                  </div>
                )}
              </section>
            </article>
          ))}
          {!items.length && (
            <div className="panel empty">Chưa có thông báo nào.</div>
          )}
        </div>
        <div className="panel">
          <Title title="Nơi nhận" sub="Thông báo chỉ đến đúng lớp được chọn" />
          <div className="channel">
            <i className="green">✓</i>
            <div>
              <b>Toàn trường</b>
              <small>Mọi phụ huynh trong trường đều nhận</small>
            </div>
          </div>
          {classes.map((c) => (
            <div className="channel" key={c.id}>
              <i className="green">✓</i>
              <div>
                <b>Lớp {c.name}</b>
                <small>Chỉ phụ huynh lớp này nhận được</small>
              </div>
            </div>
          ))}
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
            <p>Chọn lớp nhận để phụ huynh lớp khác không bị làm phiền.</p>
            <label>
              Tiêu đề
              <input name="title" required />
            </label>
            <label>
              Nơi nhận
              <select name="classId">
                <option value="">Toàn trường</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Phụ huynh lớp {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nội dung
              <textarea name="content" required rows={5} />
            </label>
            <label className="check-label">
              <input type="checkbox" name="requiresAck" />
              Yêu cầu phụ huynh bấm xác nhận đã đọc
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="save" disabled={busy}>
              {busy ? "Đang gửi…" : "Gửi thông báo"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Teacher({ ping }: { ping: (s: string) => void }) {
  const [children, setChildren] = useState<Child[]>([]),
    [parents, setParents] = useState<ManagedUser[]>([]),
    [marks, setMarks] = useState<AttRow[]>([]),
    [marked, setMarked] = useState(0);
  useEffect(() => {
    fetch("/api/children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children || []))
      .catch(() => ping("Không tải được hồ sơ trẻ"));
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) =>
        setParents(
          (d.users || []).filter((x: ManagedUser) => x.role === "parent"),
        ),
      );
    fetch(`/api/attendance?date=${vnToday()}`)
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => {
        setMarks(d.rows || []);
        setMarked(d.recordedCount || 0);
      });
  }, []);
  const present = marks.filter(
    (x) => x.recorded && x.status === "Có mặt",
  ).length;
  const absent = marks.filter((x) => x.recorded && x.status !== "Có mặt").length;

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
            <small>CÓ MẶT HÔM NAY</small>
            <b>{present}</b>
            <p>{marked ? `Đã điểm danh ${marked} trẻ` : "Chưa điểm danh"}</p>
          </div>
        </article>
        <article>
          <i className="yellow">
            <ChibiIcon icon="😴" />
          </i>
          <div>
            <small>VẮNG HÔM NAY</small>
            <b>{absent}</b>
            <p>Theo sổ điểm danh hôm nay</p>
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
            <span className={x.status === "Đang học" ? "yes" : "no"}>
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
type TodayChild = {
  id: number;
  name: string;
  className: string;
  birthDate: string;
  allergy: string;
  avatarKey?: string | null;
  attendance: {
    status: string;
    note: string;
    checkInAt: string;
    checkOutAt: string;
  } | null;
  log: {
    breakfast: string;
    lunch: string;
    snack: string;
    sleep: string;
    sleepMinutes: number | null;
    mood: string;
    health: string;
    note: string;
  } | null;
  leave: {
    fromDate: string;
    toDate: string;
    reason: string;
    status: string;
  } | null;
};

function ParentToday({ ping }: { ping: (s: string) => void }) {
  const [date, setDate] = useState(vnToday()),
    [today, setToday] = useState(vnToday()),
    [children, setChildren] = useState<TodayChild[]>([]),
    [incidents, setIncidents] = useState<IncidentRow[]>([]),
    [picked, setPicked] = useState<number | null>(null),
    [loading, setLoading] = useState(true),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/incidents")
      .then((r) => (r.ok ? r.json() : { incidents: [] }))
      .then((d) => live && setIncidents(d.incidents || []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  async function acknowledge(id: number) {
    const r = await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) {
      ping("Chưa xác nhận được");
      return;
    }
    setTick((t) => t + 1);
    ping("Đã xác nhận với nhà trường");
  }

  useEffect(() => {
    let live = true;
    fetch(`/api/today?date=${date}`)
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!live) return;
        setLoading(false);
        if (!ok) {
          ping(d.error || "Không tải được thông tin hôm nay");
          return;
        }
        setToday(d.today);
        setChildren(d.children || []);
        setPicked((cur) =>
          cur && (d.children || []).some((x: TodayChild) => x.id === cur)
            ? cur
            : (d.children || [])[0]?.id || null,
        );
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const child = children.find((x) => x.id === picked) || children[0] || null;
  const log = child?.log || null;
  const items: [string, string, string][] = child
    ? [
        [
          "🙋",
          "Đến lớp",
          child.attendance
            ? child.attendance.status === "Có mặt"
              ? child.attendance.checkInAt
                ? `Có mặt · ${child.attendance.checkInAt}`
                : "Có mặt"
              : `${child.attendance.status}${child.attendance.note ? ` · ${child.attendance.note}` : ""}`
            : "Cô chưa điểm danh",
        ],
        ["🥣", "Bữa sáng", log?.breakfast || "Chưa cập nhật"],
        ["🍱", "Bữa trưa", log?.lunch || "Chưa cập nhật"],
        ["🥛", "Bữa xế", log?.snack || "Chưa cập nhật"],
        [
          "😴",
          "Giấc ngủ",
          log?.sleep
            ? log.sleepMinutes
              ? `${log.sleep} · ${log.sleepMinutes} phút`
              : log.sleep
            : "Chưa cập nhật",
        ],
        ["🥰", "Tâm trạng", log?.mood || "Chưa cập nhật"],
        ["💗", "Sức khỏe", log?.health || "Chưa cập nhật"],
      ]
    : [];
  const nothingYet = child && !child.attendance && !child.log;

  return (
    <>
      <PageHead
        icon="👨‍👩‍👧"
        title={child ? `Hôm nay của ${child.name}` : "Hôm nay của con"}
        sub="Cập nhật trực tiếp từ cô giáo phụ trách lớp"
      />
      <div className="daybar">
        <label>
          Ngày
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value || today)}
          />
        </label>
        {date !== today && (
          <button className="ghost" onClick={() => setDate(today)}>
            Về hôm nay
          </button>
        )}
      </div>
      {children.length > 1 && (
        <div className="child-switch">
          {children.map((x) => (
            <button
              key={x.id}
              className={x.id === child?.id ? "on" : ""}
              onClick={() => setPicked(x.id)}
            >
              <ChibiIcon icon="🧒" />
              {x.name}
            </button>
          ))}
        </div>
      )}
      {child && (
        <>
          <div className="profile">
            <i>
              <ChibiIcon icon="🧒" />
            </i>
            <div>
              <small>LỚP {child.className.toUpperCase()}</small>
              <h2>{child.name}</h2>
              <p>
                Ngày sinh {child.birthDate || "chưa cập nhật"}
                {child.allergy && child.allergy !== "Không"
                  ? ` · Dị ứng: ${child.allergy}`
                  : ""}
              </p>
            </div>
            <span>{child.attendance?.status || "Chưa điểm danh"}</span>
          </div>
          {child.leave && (
            <p className="daybar-note saved-note">
              Đơn xin nghỉ ngày{" "}
              {child.leave.fromDate === child.leave.toDate
                ? child.leave.fromDate
                : `${child.leave.fromDate} → ${child.leave.toDate}`}{" "}
              · {child.leave.reason} — {child.leave.status.toLowerCase()}.
            </p>
          )}
          {incidents
            .filter((x) => x.childId === child.id && !x.acknowledgedBy)
            .map((x) => (
              <div className="panel incident-alert" key={x.id}>
                <b>
                  ⚠ {x.kind} · {x.date} {x.time}
                </b>
                <p>{x.description}</p>
                {x.handling && <p className="handling">Nhà trường đã xử lý: {x.handling}</p>}
                {x.mediaKey && (
                  <a href={mediaUrl(x.mediaKey)} target="_blank" rel="noreferrer">
                    <img
                      className="incident-photo"
                      src={mediaUrl(x.mediaKey)}
                      alt="Ảnh sự cố"
                      loading="lazy"
                    />
                  </a>
                )}
                <button className="save" onClick={() => acknowledge(x.id)}>
                  Tôi đã đọc và nắm được thông tin
                </button>
              </div>
            ))}
          <div className="panel">
            <Title title="Một ngày ở lớp" sub={`Ngày ${date}`} />
            {nothingYet ? (
              <div className="empty">
                Cô chưa cập nhật ngày này. Thông tin sẽ hiện ngay khi cô lưu sổ.
              </div>
            ) : (
              <div className="today-list">
                {items.map(([icon, label, value]) => (
                  <div
                    className={`today-item${value === "Chưa cập nhật" || value === "Cô chưa điểm danh" ? " muted" : ""}`}
                    key={label}
                  >
                    <i>
                      <ChibiIcon icon={icon} />
                    </i>
                    <div>
                      <small>{label}</small>
                      <b>{value}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {log?.note && (
              <div className="teacher-note">
                <i>
                  <ChibiIcon icon="✎" />
                </i>
                <div>
                  <small>LỜI NHẮN CỦA CÔ</small>
                  <p>{log.note}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {!loading && !children.length && (
        <div className="empty">
          Tài khoản chưa được liên kết với hồ sơ trẻ. Nhờ giáo viên chủ nhiệm
          liên kết giúp trong mục Phụ huynh.
        </div>
      )}
    </>
  );
}

function ParentLeave({ ping }: { ping: (s: string) => void }) {
  const [children, setChildren] = useState<Child[]>([]),
    [requests, setRequests] = useState<LeaveRow[]>([]),
    [reasons, setReasons] = useState<string[]>([]),
    [today, setToday] = useState(vnToday()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  const load = () =>
    Promise.all([
      fetch("/api/children").then((r) => r.json()),
      fetch("/api/leave-requests").then((r) => r.json()),
    ]).then(([c, l]) => {
      setChildren(c.children || []);
      setRequests(l.requests || []);
      setReasons(l.reasons || []);
      if (l.today) setToday(l.today);
    });
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget),
      form = e.currentTarget;
    const r = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childId: Number(f.get("childId")),
          fromDate: String(f.get("fromDate")),
          toDate: String(f.get("toDate") || f.get("fromDate")),
          reason: String(f.get("reason")),
          note: String(f.get("note") || ""),
        }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Chưa gửi được đơn");
      return;
    }
    form.reset();
    await load();
    ping("Đã gửi đơn xin nghỉ tới cô giáo");
  }

  return (
    <>
      <PageHead
        icon="☁️"
        title="Xin nghỉ cho con"
        sub="Đơn hiện ngay trên sổ điểm danh của cô, không cần gọi điện"
      />
      {children.length > 0 ? (
        <form className="panel leave-form" onSubmit={submit}>
          <div className="row">
            <label>
              Bé
              <select name="childId" required>
                {children.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {x.className}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lý do
              <select name="reason">
                {reasons.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="row">
            <label>
              Từ ngày
              <input type="date" name="fromDate" defaultValue={today} required />
            </label>
            <label>
              Đến ngày
              <input type="date" name="toDate" defaultValue={today} />
            </label>
          </div>
          <label>
            Nhắn thêm với cô
            <textarea name="note" rows={3} placeholder="Ví dụ: con sốt nhẹ, gia đình cho nghỉ theo dõi." />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="save" disabled={busy}>
            {busy ? "Đang gửi…" : "Gửi đơn xin nghỉ"}
          </button>
        </form>
      ) : (
        <div className="empty">
          Tài khoản chưa được liên kết với hồ sơ trẻ nên chưa gửi đơn được.
        </div>
      )}
      <div className="panel">
        <Title title="Đơn đã gửi" sub={`${requests.length} đơn`} />
        {requests.map((x) => (
          <div className="leave-line" key={x.id}>
            <div>
              <b>
                {x.childName} ·{" "}
                {x.fromDate === x.toDate
                  ? x.fromDate
                  : `${x.fromDate} → ${x.toDate}`}
              </b>
              <small>
                {x.reason}
                {x.note ? ` · ${x.note}` : ""}
              </small>
            </div>
            <span
              className={`leave-status ${x.status === "Đã duyệt" ? "ok" : x.status === "Từ chối" ? "no" : "wait"}`}
            >
              {x.status}
            </span>
          </div>
        ))}
        {!requests.length && <div className="empty">Chưa gửi đơn nào.</div>}
      </div>
      {children.length > 0 && <PickupSection childList={children} ping={ping} />}
    </>
  );
}

function ParentNotices({ ping }: { ping: (s: string) => void }) {
  const [items, setItems] = useState<NoticeRow[]>([]),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/announcements")
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((d) => live && setItems(d.announcements || []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  async function markRead(id: number, ack: boolean) {
    const r = await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) {
      ping("Chưa ghi nhận được");
      return;
    }
    setTick((t) => t + 1);
    ping(ack ? "Đã xác nhận với nhà trường" : "Đã đánh dấu đã đọc");
  }

  const unread = items.filter((x) => !x.read).length;
  return (
    <>
      <PageHead
        icon="📣"
        title="Thông báo từ nhà trường"
        sub={
          unread
            ? `${unread} thông báo chưa đọc`
            : "Bạn đã đọc hết thông báo"
        }
      />
      <div className="panel">
        {items.map((x) => (
          <article className={`notice${x.read ? "" : " unread"}`} key={x.id}>
            <i>
              <ChibiIcon icon="📣" />
            </i>
            <section>
              <small>
                {x.audience} · {x.createdAt} · {x.authorName}
              </small>
              <h2>{x.title}</h2>
              <p>{x.content}</p>
              <footer>
                {x.read ? (
                  <span className="leave-status ok">
                    {x.requiresAck ? "Đã xác nhận" : "Đã đọc"}
                  </span>
                ) : (
                  <button
                    className="pill-action"
                    onClick={() => markRead(x.id, x.requiresAck)}
                  >
                    {x.requiresAck ? "Tôi đã đọc và đồng ý" : "Đánh dấu đã đọc"}
                  </button>
                )}
              </footer>
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

function Parent({
  active,
  ping,
}: {
  active: string;
  ping: (s: string) => void;
}) {
  if (active === "Xin nghỉ") return <ParentLeave ping={ping} />;
  if (active === "Thông báo") return <ParentNotices ping={ping} />;
  if (active === "Nhật ký") return <ParentJournal />;
  if (active === "Tin nhắn") return <Messages ping={ping} parentView />;
  if (active === "Sức khỏe") return <ParentHealth />;
  if (active === "Thực đơn") return <MenuBoard ping={ping} />;
  if (active === "Học phí") return <ParentFees ping={ping} />;
  return <ParentToday ping={ping} />;
}


/* ── Giai đoạn 3: học phí, đánh giá, người đón, báo cáo ── */
function money(n: number) {
  return `${(n || 0).toLocaleString("vi-VN")} ₫`;
}
type FeeSettingsRow = {
  tuitionMonthly?: number;
  mealPerDay?: number;
  otherFee?: number;
  otherLabel?: string;
  bankCode: string;
  bankAccount: string;
  bankHolder: string;
  note: string;
};
type InvoiceRow = {
  id: number;
  childId: number;
  childName: string;
  className: string;
  month: string;
  tuition: number;
  mealDays: number;
  mealPerDay: number;
  otherFee: number;
  otherLabel: string;
  total: number;
  status: string;
  paidAt: string;
};
function vietQr(s: FeeSettingsRow, inv: InvoiceRow) {
  if (!s.bankCode || !s.bankAccount) return "";
  const info = `HP ${inv.month} ${inv.childName}`.replace(/[^\p{L}\p{N} ]/gu, "");
  return `https://img.vietqr.io/image/${s.bankCode}-${s.bankAccount}-compact2.jpg?amount=${inv.total}&addInfo=${encodeURIComponent(info)}&accountName=${encodeURIComponent(s.bankHolder)}`;
}

/** Quản trị trường: biểu phí, phát hành phiếu theo tháng, xác nhận đã đóng. */
function FeeManager({ ping }: { ping: (s: string) => void }) {
  const [month, setMonth] = useState(vnToday().slice(0, 7)),
    [settings, setSettings] = useState<FeeSettingsRow | null>(null),
    [rows, setRows] = useState<InvoiceRow[]>([]),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(`/api/fees?month=${month}`)
      .then((r) => (r.ok ? r.json() : { invoices: [] }))
      .then((d) => {
        if (!live) return;
        setSettings(d.settings);
        setRows(d.invoices || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [month, tick]);

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/fees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "settings",
          tuitionMonthly: Number(f.get("tuitionMonthly")),
          mealPerDay: Number(f.get("mealPerDay")),
          otherFee: Number(f.get("otherFee")),
          otherLabel: String(f.get("otherLabel")),
          bankCode: String(f.get("bankCode")),
          bankAccount: String(f.get("bankAccount")),
          bankHolder: String(f.get("bankHolder")),
          note: String(f.get("note")),
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Chưa lưu được biểu phí");
      return;
    }
    setSettings(d.settings);
    ping("Đã lưu biểu phí của trường");
  }

  async function generate() {
    setBusy(true);
    const r = await fetch("/api/fees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate", month }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) {
      ping(d.error || "Chưa phát hành được");
      return;
    }
    setTick((t) => t + 1);
    ping(`Đã phát hành ${d.generated} phiếu thu tháng ${month}`);
  }

  async function mark(inv: InvoiceRow, paid: boolean) {
    const r = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: inv.id, status: paid ? "Đã đóng" : "Chưa đóng" }),
      }),
      d = await r.json();
    if (!r.ok) {
      ping(d.error || "Chưa cập nhật được");
      return;
    }
    setTick((t) => t + 1);
    ping(paid ? `Đã ghi nhận ${inv.childName} đóng phí` : "Đã mở lại phiếu");
  }

  const paid = rows.filter((x) => x.status === "Đã đóng");
  const collected = paid.reduce((s, x) => s + x.total, 0);
  const expected = rows.reduce((s, x) => s + x.total, 0);
  return (
    <>
      <PageHead
        icon="💰"
        title="Học phí"
        sub="Tiền ăn tính theo số ngày có mặt thật trong sổ điểm danh"
      />
      <form className="panel fee-settings" onSubmit={saveSettings}>
        <Title title="Biểu phí của trường" sub="Áp dụng khi phát hành phiếu thu" />
        <div className="row3">
          <label>
            Học phí tháng (₫)
            <input name="tuitionMonthly" inputMode="numeric" defaultValue={settings?.tuitionMonthly ?? ""} key={`t${settings?.tuitionMonthly}`} />
          </label>
          <label>
            Tiền ăn mỗi ngày (₫)
            <input name="mealPerDay" inputMode="numeric" defaultValue={settings?.mealPerDay ?? ""} key={`m${settings?.mealPerDay}`} />
          </label>
          <label>
            Phí khác (₫)
            <input name="otherFee" inputMode="numeric" defaultValue={settings?.otherFee ?? ""} key={`o${settings?.otherFee}`} />
          </label>
        </div>
        <div className="row3">
          <label>
            Tên phí khác
            <input name="otherLabel" defaultValue={settings?.otherLabel ?? "Phí khác"} key={`l${settings?.otherLabel}`} />
          </label>
          <label>
            Mã ngân hàng (VietQR)
            <input name="bankCode" placeholder="VCB, TCB, MB…" defaultValue={settings?.bankCode ?? ""} key={`b${settings?.bankCode}`} />
          </label>
          <label>
            Số tài khoản
            <input name="bankAccount" defaultValue={settings?.bankAccount ?? ""} key={`a${settings?.bankAccount}`} />
          </label>
        </div>
        <div className="row">
          <label>
            Chủ tài khoản
            <input name="bankHolder" defaultValue={settings?.bankHolder ?? ""} key={`h${settings?.bankHolder}`} />
          </label>
          <label>
            Ghi chú trên phiếu
            <input name="note" defaultValue={settings?.note ?? ""} key={`n${settings?.note}`} />
          </label>
        </div>
        <button className="save">Lưu biểu phí</button>
      </form>

      <div className="daybar">
        <label>
          Tháng
          <input type="month" value={month} max={vnToday().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <button className="ghost" onClick={generate} disabled={busy}>
          {busy ? "Đang phát hành…" : `Phát hành phiếu tháng ${month}`}
        </button>
        <p className="daybar-note saved-note">
          Đã thu {money(collected)} / {money(expected)} · {paid.length}/{rows.length} phiếu đã đóng. Phát hành lại sẽ tính lại ngày ăn nhưng giữ nguyên phiếu đã đóng.
        </p>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>TRẺ</th>
              <th>HỌC PHÍ</th>
              <th>NGÀY ĂN</th>
              <th>TIỀN ĂN</th>
              <th>KHÁC</th>
              <th>TỔNG</th>
              <th>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.childName}</b>
                  <small>{x.className}</small>
                </td>
                <td>{money(x.tuition)}</td>
                <td>{x.mealDays} ngày</td>
                <td>{money(x.mealDays * x.mealPerDay)}</td>
                <td>{money(x.otherFee)}</td>
                <td>
                  <b>{money(x.total)}</b>
                </td>
                <td>
                  {x.status === "Đã đóng" ? (
                    <button className="leave-status ok as-btn" onClick={() => mark(x, false)} title={x.paidAt}>
                      Đã đóng ✓
                    </button>
                  ) : (
                    <button className="pill-action" onClick={() => mark(x, true)}>
                      Ghi nhận đã đóng
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty">
            Chưa có phiếu thu tháng này. Lưu biểu phí rồi bấm “Phát hành”.
          </div>
        )}
      </div>
    </>
  );
}

/** Phụ huynh: phiếu thu của con kèm mã QR chuyển khoản đúng số tiền. */
function ParentFees({ ping }: { ping: (s: string) => void }) {
  const [rows, setRows] = useState<InvoiceRow[]>([]),
    [bank, setBank] = useState<FeeSettingsRow | null>(null),
    [qrFor, setQrFor] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/fees")
      .then((r) => (r.ok ? r.json() : { invoices: [] }))
      .then((d) => {
        if (!live) return;
        setRows(d.invoices || []);
        setBank(d.settings);
      })
      .catch(() => ping("Không tải được phiếu thu"));
    return () => {
      live = false;
    };
  }, []);
  const owing = rows.filter((x) => x.status !== "Đã đóng");
  return (
    <>
      <PageHead
        icon="💰"
        title="Học phí"
        sub={
          owing.length
            ? `${owing.length} phiếu chưa đóng · ${money(owing.reduce((s, x) => s + x.total, 0))}`
            : "Đã đóng đủ, cảm ơn gia đình"
        }
      />
      <div className="journal-list">
        {rows.map((x) => (
          <article className="panel invoice" key={x.id}>
            <header>
              <div>
                <small>
                  Tháng {x.month} · {x.childName} · {x.className}
                </small>
                <h2>{money(x.total)}</h2>
              </div>
              <span className={`leave-status ${x.status === "Đã đóng" ? "ok" : "wait"}`}>
                {x.status}
              </span>
            </header>
            <div className="invoice-lines">
              <span>
                Học phí <b>{money(x.tuition)}</b>
              </span>
              <span>
                Tiền ăn {x.mealDays} ngày × {money(x.mealPerDay)} <b>{money(x.mealDays * x.mealPerDay)}</b>
              </span>
              {x.otherFee > 0 && (
                <span>
                  {x.otherLabel || "Phí khác"} <b>{money(x.otherFee)}</b>
                </span>
              )}
            </div>
            {x.status !== "Đã đóng" && bank?.bankCode && bank?.bankAccount && (
              <div className="qr-zone">
                {qrFor === x.id ? (
                  <>
                    <img src={vietQr(bank, x)} alt={`QR chuyển khoản ${money(x.total)}`} />
                    <small>
                      {bank.bankCode} · {bank.bankAccount} · {bank.bankHolder}
                      <br />
                      Nội dung: HP {x.month} {x.childName}
                    </small>
                  </>
                ) : (
                  <button className="pill-action" onClick={() => setQrFor(x.id)}>
                    Hiện mã QR chuyển khoản
                  </button>
                )}
              </div>
            )}
            {x.status !== "Đã đóng" && bank && !bank.bankCode && bank.note && (
              <p className="daybar-note">{bank.note}</p>
            )}
          </article>
        ))}
        {!rows.length && (
          <div className="panel empty">Nhà trường chưa phát hành phiếu thu nào.</div>
        )}
      </div>
    </>
  );
}

type ReportTotals = {
  children: number;
  left: number;
  unassigned: number;
  marked: number;
  present: number;
  incidents: number;
  incidentsUnacknowledged: number;
  posts: number;
  announcements: number;
  announcementReads: number;
};
type ClassReport = {
  classId: number;
  name: string;
  ageGroup: string;
  childCount: number;
  markedDays: number;
  present: number;
  excused: number;
  unexcused: number;
  attendanceRate: number | null;
  incidents: number;
  posts: number;
};

type AuditRow = {
  id: number;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: number | null;
  detail: string;
  createdAt: string;
};

/** Báo cáo tháng cho ban giám hiệu. */
function ReportBoard() {
  const [month, setMonth] = useState(vnToday().slice(0, 7)),
    [totals, setTotals] = useState<ReportTotals | null>(null),
    [logs, setLogs] = useState<AuditRow[]>([]),
    [showLogs, setShowLogs] = useState(false),
    [perClass, setPerClass] = useState<ClassReport[]>([]);
  useEffect(() => {
    let live = true;
    fetch("/api/audit")
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((d) => live && setLogs(d.logs || []))
      .catch(() => {});
    fetch(`/api/reports?month=${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setTotals(d.totals);
        setPerClass(d.perClass || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [month]);
  const rate = totals?.marked
    ? Math.round((totals.present / totals.marked) * 100)
    : null;
  return (
    <>
      <PageHead
        icon="📊"
        title="Báo cáo tháng"
        sub="Chuyên cần, sự cố và mức độ tương tác của từng lớp"
      />
      <div className="daybar">
        <label>
          Tháng
          <input type="month" value={month} max={vnToday().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <button
          className="ghost"
          onClick={() => {
            const sheet = XLSX.utils.json_to_sheet(
              perClass.map((x) => ({
                "Lớp": x.name,
                "Độ tuổi": x.ageGroup,
                "Sĩ số": x.childCount,
                "Lượt có mặt": x.present,
                "Vắng có phép": x.excused,
                "Vắng không phép": x.unexcused,
                "Chuyên cần (%)": x.attendanceRate ?? "",
                "Sự cố": x.incidents,
                "Bài nhật ký": x.posts,
              })),
            );
            const book = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(book, sheet, month);
            XLSX.writeFile(book, `bao-cao-${month}.xlsx`);
          }}
        >
          ⇩ Xuất Excel
        </button>
      </div>
      {totals && (
        <section className="stats">
          <article>
            <i className="pink">
              <ChibiIcon icon="🧒" />
            </i>
            <div>
              <small>TRẺ ĐANG HỌC</small>
              <b>{totals.children}</b>
              <p>
                {totals.unassigned ? `${totals.unassigned} chưa xếp lớp` : "Đã xếp lớp đủ"}
                {totals.left ? ` · ${totals.left} đã nghỉ` : ""}
              </p>
            </div>
          </article>
          <article>
            <i className="green">
              <ChibiIcon icon="🙋" />
            </i>
            <div>
              <small>CHUYÊN CẦN</small>
              <b>{rate === null ? "—" : `${rate}%`}</b>
              <p>{totals.present}/{totals.marked} lượt có mặt</p>
            </div>
          </article>
          <article>
            <i className="yellow">
              <ChibiIcon icon="💗" />
            </i>
            <div>
              <small>SỰ CỐ Y TẾ</small>
              <b>{totals.incidents}</b>
              <p>
                {totals.incidentsUnacknowledged
                  ? `${totals.incidentsUnacknowledged} chưa được PH xác nhận`
                  : "PH đã xác nhận hết"}
              </p>
            </div>
          </article>
          <article>
            <i className="blue">
              <ChibiIcon icon="✎" />
            </i>
            <div>
              <small>KẾT NỐI PHỤ HUYNH</small>
              <b>{totals.posts}</b>
              <p>
                bài nhật ký · {totals.announcementReads} lượt đọc thông báo
              </p>
            </div>
          </article>
        </section>
      )}
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>LỚP</th>
              <th>SĨ SỐ</th>
              <th>CHUYÊN CẦN</th>
              <th>CÓ PHÉP</th>
              <th>KHÔNG PHÉP</th>
              <th>SỰ CỐ</th>
              <th>BÀI NHẬT KÝ</th>
            </tr>
          </thead>
          <tbody>
            {perClass.map((x) => (
              <tr key={x.classId}>
                <td>
                  <b>{x.name}</b>
                  <small>{x.ageGroup}</small>
                </td>
                <td>{x.childCount}</td>
                <td>
                  {x.attendanceRate === null ? (
                    <small className="muted-cell">chưa điểm danh</small>
                  ) : (
                    <b className={x.attendanceRate >= 90 ? "rate-ok" : "rate-low"}>
                      {x.attendanceRate}%
                    </b>
                  )}
                </td>
                <td>{x.excused}</td>
                <td>{x.unexcused}</td>
                <td>{x.incidents}</td>
                <td>{x.posts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!perClass.length && (
          <div className="empty">Trường chưa có lớp nào trong mục Thiết lập.</div>
        )}
      </div>
      <div className="panel">
        <div className="care-head">
          <div>
            <b>Nhật ký thao tác</b>
            <small>
              {logs.length} thao tác gần nhất — ai sửa gì, lúc nào
            </small>
          </div>
          <button className="pill-action" onClick={() => setShowLogs((x) => !x)}>
            {showLogs ? "Thu gọn" : "Xem nhật ký"}
          </button>
        </div>
        {showLogs && (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>THỜI ĐIỂM</th>
                  <th>NGƯỜI THAO TÁC</th>
                  <th>HÀNH ĐỘNG</th>
                  <th>ĐỐI TƯỢNG</th>
                  <th>CHI TIẾT</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((x) => (
                  <tr key={x.id}>
                    <td>{x.createdAt}</td>
                    <td>
                      <b>{x.actorName}</b>
                      <small>
                        {x.actorRole === "admin"
                          ? "Quản trị trường"
                          : x.actorRole === "teacher"
                            ? "Giáo viên"
                            : x.actorRole}
                      </small>
                    </td>
                    <td>{x.action}</td>
                    <td>
                      {x.entity}
                      {x.entityId ? ` #${x.entityId}` : ""}
                    </td>
                    <td>{x.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!logs.length && (
              <div className="empty">Chưa có thao tác nào được ghi lại.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

type AssessmentRow = {
  childId: number;
  period: string;
  physical: string;
  cognitive: string;
  language: string;
  social: string;
  aesthetic: string;
  comment: string;
  childName?: string;
};
type AssessDomain = { key: string; label: string };

/** Giáo viên nhập đánh giá 5 lĩnh vực theo kỳ, lưu cả lớp một lượt. */
function AssessmentBoard({ ping }: { ping: (s: string) => void }) {
  const [domains, setDomains] = useState<AssessDomain[]>([]),
    [levels, setLevels] = useState<string[]>([]),
    [childList, setChildList] = useState<{ childId: number; name: string; className: string }[]>([]),
    [saved, setSaved] = useState<AssessmentRow[]>([]),
    [period, setPeriod] = useState("Học kỳ 1 · 2026–2027"),
    [draft, setDraft] = useState<Record<number, Record<string, string>>>({}),
    [saving, setSaving] = useState(false),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/assessments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setDomains(d.domains || []);
        setLevels(d.levels || []);
        setChildList(d.children || []);
        setSaved(d.assessments || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  // Giá trị hiển thị = phần cô vừa sửa, không có thì lấy bản đã lưu của kỳ này.
  const valueOf = (childId: number, key: string) => {
    const edited = draft[childId]?.[key];
    if (edited !== undefined) return edited;
    const row = saved.find((x) => x.childId === childId && x.period === period);
    return (row?.[key as keyof AssessmentRow] as string) || "";
  };
  const edit = (childId: number, key: string, value: string) =>
    setDraft((s) => ({ ...s, [childId]: { ...s[childId], [key]: value } }));

  async function save() {
    setSaving(true);
    const r = await fetch("/api/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          period,
          items: childList.map((c) => ({
            childId: c.childId,
            physical: valueOf(c.childId, "physical"),
            cognitive: valueOf(c.childId, "cognitive"),
            language: valueOf(c.childId, "language"),
            social: valueOf(c.childId, "social"),
            aesthetic: valueOf(c.childId, "aesthetic"),
            comment: valueOf(c.childId, "comment"),
          })),
        }),
      }),
      d = await r.json();
    setSaving(false);
    if (!r.ok) {
      ping(d.error || "Chưa lưu được đánh giá");
      return;
    }
    setDraft({});
    setTick((t) => t + 1);
    ping(`Đã lưu đánh giá ${d.saved} trẻ · ${period}`);
  }

  return (
    <>
      <div className="daybar">
        <label>
          Kỳ đánh giá
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setDraft({});
            }}
          >
            {["Học kỳ 1 · 2026–2027", "Học kỳ 2 · 2026–2027", "Cả năm · 2026–2027"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <p className="daybar-note saved-note">
          Mỗi lĩnh vực chọn một mức. Bé chưa chọn mục nào sẽ được bỏ qua khi lưu.
        </p>
      </div>
      <div className="panel tablewrap assess-table">
        <table>
          <thead>
            <tr>
              <th>TRẺ</th>
              {domains.map((d) => (
                <th key={d.key}>{d.label.toUpperCase()}</th>
              ))}
              <th>NHẬN XÉT CHUNG</th>
            </tr>
          </thead>
          <tbody>
            {childList.map((c) => (
              <tr key={c.childId}>
                <td>
                  <b>{c.name}</b>
                  <small>{c.className}</small>
                </td>
                {domains.map((d) => (
                  <td key={d.key}>
                    <select
                      value={valueOf(c.childId, d.key)}
                      onChange={(e) => edit(c.childId, d.key, e.target.value)}
                    >
                      <option value="">—</option>
                      {levels.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td>
                  <input
                    value={valueOf(c.childId, "comment")}
                    onChange={(e) => edit(c.childId, "comment", e.target.value)}
                    placeholder="Nhận xét gửi phụ huynh…"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {childList.length > 0 && (
          <div className="assess-actions">
            <button className="save finish" onClick={save} disabled={saving}>
              {saving ? "Đang lưu…" : `Lưu đánh giá ${childList.length} trẻ`}
            </button>
            <button
              className="outline"
              onClick={() => {
                const sheet = XLSX.utils.json_to_sheet(
                  childList.map((c) => {
                    const row: Record<string, string> = {
                      "Họ tên": c.name,
                      "Lớp": c.className,
                    };
                    for (const d of domains)
                      row[d.label] = valueOf(c.childId, d.key);
                    row["Nhận xét"] = valueOf(c.childId, "comment");
                    return row;
                  }),
                );
                const book = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(book, sheet, "Đánh giá");
                XLSX.writeFile(
                  book,
                  `danh-gia-${period.replace(/[^\p{L}\p{N}]+/gu, "-")}.xlsx`,
                );
                ping("Đã xuất phiếu đánh giá");
              }}
            >
              ⇩ Xuất phiếu đánh giá Excel
            </button>
          </div>
        )}
      </div>
      {!childList.length && <div className="empty">Chưa có hồ sơ trẻ.</div>}
    </>
  );
}

type PickupPerson = {
  id: number;
  childId: number;
  childName: string;
  name: string;
  relation: string;
  phone: string;
};
type PickupNotice = {
  id: number;
  childId: number;
  childName: string;
  className: string;
  date: string;
  personName: string;
  relation: string;
  phone: string;
  expectedTime: string;
  note: string;
};

/** Phụ huynh: đăng ký người đón cố định và báo người đón cho từng ngày. */
function PickupSection({
  childList,
  ping,
}: {
  childList: Child[];
  ping: (s: string) => void;
}) {
  const [persons, setPersons] = useState<PickupPerson[]>([]),
    [notices, setNotices] = useState<PickupNotice[]>([]),
    [relations, setRelations] = useState<string[]>([]),
    [today, setToday] = useState(vnToday()),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/pickup")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setPersons(d.persons || []);
        setNotices(d.notices || []);
        setRelations(d.relations || []);
        if (d.today) setToday(d.today);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tick]);

  async function post(payload: Record<string, unknown>, okMsg: string) {
    setError("");
    const r = await fetch("/api/pickup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error || "Chưa gửi được");
      return false;
    }
    setTick((t) => t + 1);
    ping(okMsg);
    return true;
  }

  async function addPerson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      form = e.currentTarget;
    const ok = await post(
      {
        action: "person",
        childId: Number(f.get("childId")),
        name: String(f.get("name")),
        relation: String(f.get("relation")),
        phone: String(f.get("phone") || ""),
      },
      "Đã đăng ký người đón",
    );
    if (ok) form.reset();
  }

  async function addNotice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      form = e.currentTarget;
    const [pid, childIdRaw] = String(f.get("person")).split(":");
    const person = persons.find((x) => x.id === Number(pid));
    if (!person) {
      setError("Hãy đăng ký người đón trước");
      return;
    }
    const ok = await post(
      {
        action: "notice",
        childId: Number(childIdRaw),
        name: person.name,
        relation: person.relation,
        phone: person.phone,
        date: String(f.get("date")),
        expectedTime: String(f.get("expectedTime") || ""),
        note: String(f.get("note") || ""),
      },
      "Đã báo cho cô giáo",
    );
    if (ok) form.reset();
  }

  async function removePerson(id: number) {
    const r = await fetch(`/api/pickup?id=${id}&kind=person`, { method: "DELETE" });
    if (r.ok) {
      setTick((t) => t + 1);
      ping("Đã xóa người đón");
    }
  }

  return (
    <div className="panel">
      <Title
        title="Người đón bé"
        sub="Đăng ký trước để cô nhận đúng người · báo riêng khi đổi người đón"
      />
      {persons.map((x) => (
        <div className="leave-line" key={x.id}>
          <div>
            <b>
              {x.name}
              {x.relation ? ` · ${x.relation}` : ""}
            </b>
            <small>
              Đón {x.childName}
              {x.phone ? ` · ${x.phone}` : ""}
            </small>
          </div>
          <button className="reject" onClick={() => removePerson(x.id)}>
            Xóa
          </button>
        </div>
      ))}
      <form className="pickup-form" onSubmit={addPerson}>
        <div className="row3">
          <label>
            Bé
            <select name="childId">
              {childList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tên người đón
            <input name="name" required />
          </label>
          <label>
            Quan hệ
            <select name="relation">
              {relations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="row">
          <label>
            Số điện thoại
            <input name="phone" inputMode="tel" />
          </label>
          <button className="save slim">＋ Đăng ký người đón</button>
        </div>
      </form>

      {persons.length > 0 && (
        <form className="pickup-form notice-form" onSubmit={addNotice}>
          <b className="form-heading">Báo người đón hôm nay / ngày tới</b>
          <div className="row3">
            <label>
              Ai đón
              <select name="person">
                {persons.map((x) => (
                  <option key={x.id} value={`${x.id}:${x.childId}`}>
                    {x.name} đón {x.childName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ngày
              <input type="date" name="date" defaultValue={today} min={today} />
            </label>
            <label>
              Giờ dự kiến
              <input type="time" name="expectedTime" />
            </label>
          </div>
          <div className="row">
            <label>
              Nhắn thêm
              <input name="note" placeholder="Ví dụ: ông đeo kính, đi xe máy xanh" />
            </label>
            <button className="save slim">Báo cho cô</button>
          </div>
        </form>
      )}
      {error && <p className="form-error">{error}</p>}
      {notices.length > 0 && (
        <div className="notice-history">
          <b className="form-heading">Đã báo gần đây</b>
          {notices.slice(0, 5).map((x) => (
            <small key={x.id}>
              {x.date}
              {x.expectedTime ? ` ${x.expectedTime}` : ""} · {x.personName} đón{" "}
              {x.childName}
              {x.date >= today && (
                <button
                  type="button"
                  className="linkbtn"
                  onClick={async () => {
                    const r = await fetch(`/api/pickup?id=${x.id}&kind=notice`, {
                      method: "DELETE",
                    });
                    if (r.ok) {
                      setTick((t) => t + 1);
                      ping("Đã hủy lời báo người đón");
                    }
                  }}
                >
                  Hủy
                </button>
              )}
            </small>
          ))}
        </div>
      )}
    </div>
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
