"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function FamilyConnectionShortcut() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (pathname.startsWith("/ket-noi-gia-dinh")) {
      setShow(false);
      return;
    }
    let live = true;
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const role = d?.user?.role;
        if (live) setShow(["parent", "teacher", "admin"].includes(role));
      })
      .catch(() => live && setShow(false));
    return () => { live = false; };
  }, [pathname]);
  if (!show) return null;
  return (
    <a
      href="/ket-noi-gia-dinh"
      aria-label="Mở Kết nối gia đình"
      style={{
        position: "fixed",
        right: 16,
        bottom: "calc(84px + env(safe-area-inset-bottom))",
        zIndex: 120,
        minHeight: 48,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        borderRadius: 999,
        background: "#087e66",
        color: "#fff",
        textDecoration: "none",
        fontWeight: 800,
        boxShadow: "0 10px 28px rgba(8,126,102,.28)",
      }}
    >
      <span aria-hidden="true">♡</span>
      Kết nối gia đình
    </a>
  );
}
