"use client";

import { useEffect, useMemo, useState } from "react";

type Teacher = { id: number; fullName: string; status: string };
type ClassRow = {
  id: number;
  campusId: number;
  name: string;
  ageGroup: string;
  academicYear: string;
  status: string;
  teacherIds?: number[];
  teacherNames?: string[];
};

export default function MultiHomeroom() {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classId, setClassId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch("/api/school-structure");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Không tải được danh sách lớp");
    setClasses(d.classes || []);
    setTeachers((d.teachers || []).filter((x: Teacher) => x.status === "active"));
    const currentId = classId || d.classes?.[0]?.id || null;
    setClassId(currentId);
    const current = (d.classes || []).find((x: ClassRow) => x.id === currentId);
    setSelected(current?.teacherIds || []);
  }

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAllowed(d?.user?.role === "admin"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) load().catch((e) => setMessage(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = useMemo(
    () => classes.find((x) => x.id === classId) || null,
    [classes, classId],
  );

  if (!allowed) return null;

  async function save() {
    if (!current) return;
    setSaving(true);
    setMessage("");
    try {
      const r = await fetch("/api/school-structure", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "class",
          id: current.id,
          campusId: current.campusId,
          name: current.name,
          ageGroup: current.ageGroup,
          academicYear: current.academicYear,
          status: current.status || "active",
          teacherIds: selected,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Không lưu được phân công");
      setMessage("Đã lưu phân công GVCN cho lớp.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", right: 18, bottom: 84, zIndex: 80,
          border: 0, borderRadius: 16, padding: "12px 16px",
          background: "#0f766e", color: "white", fontWeight: 800,
          boxShadow: "0 8px 24px rgba(15,118,110,.25)", cursor: "pointer",
        }}
      >
        👩🏻‍🏫 Phân công GVCN
      </button>
      {open && (
        <div style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.45)",display:"grid",placeItems:"center",padding:16}}>
          <div style={{width:"min(680px,100%)",maxHeight:"86vh",overflow:"auto",background:"white",borderRadius:22,padding:20,boxShadow:"0 24px 60px rgba(15,23,42,.28)"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:16}}>
              <div>
                <h2 style={{margin:0,fontSize:22}}>Phân công nhiều GVCN</h2>
                <p style={{margin:"6px 0 0",color:"#64748b"}}>Một lớp có thể chọn nhiều giáo viên chủ nhiệm cùng phụ trách.</p>
              </div>
              <button onClick={() => setOpen(false)} style={{border:0,background:"#f1f5f9",borderRadius:12,padding:"10px 13px",fontWeight:800}}>Đóng</button>
            </div>

            <label style={{display:"grid",gap:7,fontWeight:800,marginBottom:16}}>
              Lớp
              <select
                value={classId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setClassId(id);
                  setSelected(classes.find((x) => x.id === id)?.teacherIds || []);
                }}
                style={{minHeight:46,border:"1px solid #cbd5e1",borderRadius:12,padding:"0 12px",fontSize:16}}
              >
                {classes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>

            <div style={{display:"grid",gap:10}}>
              {teachers.map((t) => {
                const checked = selected.includes(t.id);
                return (
                  <label key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:13,border:"1px solid #e2e8f0",borderRadius:14,cursor:"pointer",background:checked?"#f0fdfa":"white"}}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelected((s) => checked ? s.filter((id) => id !== t.id) : [...s, t.id])}
                      style={{width:20,height:20}}
                    />
                    <span style={{fontWeight:750}}>{t.fullName}</span>
                  </label>
                );
              })}
            </div>

            {current?.teacherNames?.length ? (
              <p style={{marginTop:14,color:"#475569"}}>Đang phân công: <b>{current.teacherNames.join(", ")}</b></p>
            ) : null}
            {message ? <p style={{marginTop:14,fontWeight:700,color:message.startsWith("Đã")?"#047857":"#b91c1c"}}>{message}</p> : null}

            <button
              onClick={save}
              disabled={saving || !current}
              style={{width:"100%",marginTop:18,minHeight:48,border:0,borderRadius:14,background:"#0f766e",color:"white",fontSize:16,fontWeight:850,cursor:"pointer"}}
            >
              {saving ? "Đang lưu…" : `Lưu ${selected.length} GVCN cho lớp`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
