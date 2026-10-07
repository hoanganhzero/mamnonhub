"use client";

import { useEffect, useMemo, useState } from "react";

type ClassRow = { id: number; name: string; ageGroup?: string };
type ChildRow = {
  childId: number;
  name: string;
  className: string;
  boarding: boolean;
};
type Mark = { childId: number; date: string; status: string };

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const EATS = new Set(["Có mặt", "Vắng buổi chiều"]);

export default function MealRegisterPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/meal-register")
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Không tải được danh sách lớp");
        setClasses(d.classes || []);
        if ((d.classes || []).length === 1) setClassId(String(d.classes[0].id));
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!classId) {
      setChildren([]);
      setMarks([]);
      return;
    }
    setLoading(true);
    const q = new URLSearchParams({ classId, month });
    fetch(`/api/meal-register?${q}`)
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Không tải được sổ chấm cơm");
        setChildren(d.children || []);
        setMarks(d.marks || []);
        if (d.classes?.length) setClasses(d.classes);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, [classId, month]);

  const markedMeals = useMemo(() => {
    const boardingIds = new Set(children.filter((x) => x.boarding).map((x) => x.childId));
    return marks.filter((x) => boardingIds.has(x.childId) && EATS.has(x.status)).length;
  }, [children, marks]);

  async function toggleBoarding(child: ChildRow) {
    const next = !child.boarding;
    setChildren((rows) => rows.map((x) => (x.childId === child.childId ? { ...x, boarding: next } : x)));
    const r = await fetch("/api/meal-register", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ childId: child.childId, boarding: next }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setChildren((rows) => rows.map((x) => (x.childId === child.childId ? { ...x, boarding: !next } : x)));
      setMessage(d.error || "Không lưu được trạng thái bán trú");
    }
  }

  async function exportXlsx() {
    if (!classId || !children.length) {
      setMessage("Chọn lớp có danh sách trẻ trước khi xuất sổ.");
      return;
    }
    setExporting(true);
    setMessage("");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Mầm Non Yêu Thương";
      workbook.created = new Date();

      const [year, monthNumber] = month.split("-").map(Number);
      const daysInMonth = new Date(year, monthNumber, 0).getDate();
      const className = classes.find((x) => String(x.id) === classId)?.name || children[0]?.className || "";
      const sheet = workbook.addWorksheet(`T${monthNumber}-${year}`, {
        pageSetup: {
          paperSize: 9,
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          horizontalCentered: true,
          margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 },
        },
        views: [{ state: "frozen", xSplit: 2, ySplit: 4 }],
      });

      const lastDayCol = 2 + 31;
      const totalCol = lastDayCol + 1;
      const lastColLetter = sheet.getColumn(totalCol).letter;
      sheet.mergeCells(`A1:${lastColLetter}1`);
      const title = sheet.getCell("A1");
      title.value = `CHẤM CƠM THÁNG ${monthNumber}/${year}                                      LỚP ${className}`;
      title.font = { name: "Times New Roman", size: 16, bold: true };
      title.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 26;
      sheet.getRow(2).height = 8;

      const thin = { style: "thin" as const, color: { argb: "FF000000" } };
      const border = { top: thin, left: thin, bottom: thin, right: thin };
      const headerFont = { name: "Times New Roman", size: 10, bold: true };
      const normalFont = { name: "Times New Roman", size: 10 };
      const center = { horizontal: "center" as const, vertical: "middle" as const, wrapText: true };

      sheet.getCell("A3").value = "STT";
      sheet.getCell("B3").value = "Họ Tên Trẻ";
      for (let day = 1; day <= 31; day++) {
        const col = sheet.getColumn(day + 2);
        sheet.getCell(3, day + 2).value = day <= daysInMonth ? day : "";
        sheet.getCell(4, day + 2).value =
          day <= daysInMonth
            ? ["CN", "H", "B", "T", "N", "S", "B"][new Date(year, monthNumber - 1, day).getDay()]
            : "";
        col.width = 3.7;
      }
      sheet.getCell(3, totalCol).value = "TC";
      sheet.mergeCells("A3:A4");
      sheet.mergeCells("B3:B4");
      sheet.mergeCells(`${lastColLetter}3:${lastColLetter}4`);
      sheet.getColumn(1).width = 5.5;
      sheet.getColumn(2).width = 27;
      sheet.getColumn(totalCol).width = 6;
      sheet.getRow(3).height = 22;
      sheet.getRow(4).height = 20;

      for (let col = 1; col <= totalCol; col++) {
        for (const row of [3, 4]) {
          const cell = sheet.getCell(row, col);
          cell.font = headerFont;
          cell.alignment = center;
          cell.border = border;
        }
      }

      const markMap = new Map<string, string>();
      for (const mark of marks) markMap.set(`${mark.childId}:${mark.date}`, mark.status);

      const firstChildRow = 5;
      children.forEach((child, index) => {
        const row = firstChildRow + index;
        sheet.getRow(row).height = 22;
        sheet.getCell(row, 1).value = index + 1;
        sheet.getCell(row, 2).value = child.name;
        sheet.getCell(row, 2).alignment = { horizontal: "left", vertical: "middle" };
        let count = 0;
        for (let day = 1; day <= 31; day++) {
          const cell = sheet.getCell(row, day + 2);
          if (day <= daysInMonth && child.boarding) {
            const iso = `${month}-${String(day).padStart(2, "0")}`;
            const status = markMap.get(`${child.childId}:${iso}`);
            if (status && EATS.has(status)) {
              cell.value = "X";
              cell.font = { name: "Times New Roman", size: 15, bold: true };
              count += 1;
            }
          }
          cell.alignment = center;
          cell.border = border;
        }
        sheet.getCell(row, totalCol).value = count;
        for (const col of [1, 2, totalCol]) {
          const cell = sheet.getCell(row, col);
          cell.font = normalFont;
          cell.border = border;
          if (col !== 2) cell.alignment = center;
        }
      });

      const lastChildRow = firstChildRow + children.length - 1;
      const totalRow = lastChildRow + 1;
      sheet.mergeCells(`A${totalRow}:B${totalRow}`);
      const totalLabel = sheet.getCell(`A${totalRow}`);
      totalLabel.value = "Tổng cộng";
      totalLabel.font = { name: "Times New Roman", size: 10, bold: true };
      totalLabel.alignment = center;
      totalLabel.border = border;
      sheet.getCell(`B${totalRow}`).border = border;
      for (let day = 1; day <= 31; day++) {
        const col = day + 2;
        const cell = sheet.getCell(totalRow, col);
        cell.value = day <= daysInMonth ? { formula: `COUNTIF(${sheet.getColumn(col).letter}${firstChildRow}:${sheet.getColumn(col).letter}${lastChildRow},\"X\")` } : "";
        cell.font = { name: "Times New Roman", size: 10, bold: true };
        cell.alignment = center;
        cell.border = border;
      }
      const grand = sheet.getCell(totalRow, totalCol);
      grand.value = { formula: `SUM(${lastColLetter}${firstChildRow}:${lastColLetter}${lastChildRow})` };
      grand.font = { name: "Times New Roman", size: 10, bold: true };
      grand.alignment = center;
      grand.border = border;
      sheet.getRow(totalRow).height = 22;

      const noteRow = totalRow + 2;
      sheet.mergeCells(`A${noteRow}:${lastColLetter}${noteRow}`);
      const note = sheet.getCell(`A${noteRow}`);
      note.value = "Quy ước: X = trẻ bán trú có ăn tại trường; vắng buổi sáng/vắng cả ngày hoặc không bán trú để trống.";
      note.font = { name: "Times New Roman", size: 9, italic: true };
      note.alignment = { horizontal: "left", vertical: "middle", wrapText: true };

      sheet.pageSetup.printArea = `A1:${lastColLetter}${noteRow}`;
      sheet.pageSetup.printTitlesRow = "1:4";
      sheet.headerFooter.oddFooter = "&CTrang &P / &N";
      workbook.calcProperties.fullCalcOnLoad = true;

      const bytes = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `so-cham-com-${sanitizeFileName(className)}-${month}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage("Đã xuất sổ chấm cơm đúng bố cục theo lớp.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không xuất được sổ chấm cơm");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6faf8", padding: "24px", color: "#173b34", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <a href="/" style={{ color: "#087e66", textDecoration: "none", fontWeight: 700 }}>← Quay lại hệ thống</a>
        <div style={{ marginTop: 16, background: "white", borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
          <h1 style={{ margin: 0, fontSize: 30 }}>🍚 Sổ chấm cơm</h1>
          <p style={{ color: "#58716b", lineHeight: 1.6 }}>Tự động chấm ngày ăn theo điểm danh của từng lớp và xuất Excel đúng dạng bảng tháng.</p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6, minWidth: 240, fontWeight: 700 }}>
              Lớp
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ minHeight: 46, padding: 10, borderRadius: 10, border: "1px solid #ccd9d5" }}>
                <option value="">Chọn lớp</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, minWidth: 190, fontWeight: 700 }}>
              Tháng
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ minHeight: 46, padding: 10, borderRadius: 10, border: "1px solid #ccd9d5" }} />
            </label>
            <button onClick={exportXlsx} disabled={exporting || !classId || !children.length} style={{ minHeight: 46, padding: "10px 18px", border: 0, borderRadius: 12, background: "#087e66", color: "white", fontWeight: 800, cursor: "pointer" }}>
              {exporting ? "Đang tạo tệp…" : "⇩ Tải sổ chấm cơm .xlsx"}
            </button>
          </div>

          <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: "#eef8f4", lineHeight: 1.7 }}>
            <b>Quy tắc tự động:</b> Có mặt hoặc vắng buổi chiều → <b>X</b>; vắng buổi sáng, vắng cả ngày, vắng có/không phép → để trống; trẻ không bán trú → luôn để trống. Ngày chưa lưu điểm danh cũng để trống.
          </div>
          {message && <p style={{ marginTop: 14, fontWeight: 700, color: "#8a5310" }}>{message}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
          {[['Tổng trẻ', children.length], ['Trẻ bán trú', children.filter(x => x.boarding).length], ['Lượt ăn đã chấm', markedMeals]].map(([label, value]) => (
            <div key={String(label)} style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,.05)" }}>
              <small style={{ color: "#6a7f7a" }}>{label}</small><div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, background: "white", borderRadius: 18, padding: 18, overflowX: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.05)" }}>
          <h2 style={{ marginTop: 0 }}>Danh sách bán trú của lớp</h2>
          {loading ? <p>Đang tải…</p> : !classId ? <p>Chọn lớp để xem danh sách.</p> : !children.length ? <p>Lớp chưa có trẻ.</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead><tr><th style={th}>STT</th><th style={{...th,textAlign:'left'}}>Họ tên trẻ</th><th style={th}>Bán trú</th><th style={th}>Số ngày ăn tháng</th></tr></thead>
              <tbody>{children.map((child, index) => {
                const days = marks.filter((m) => m.childId === child.childId && child.boarding && EATS.has(m.status)).length;
                return <tr key={child.childId}><td style={tdCenter}>{index + 1}</td><td style={td}>{child.name}</td><td style={tdCenter}><label style={{display:'inline-flex',gap:8,alignItems:'center',fontWeight:700}}><input type="checkbox" checked={child.boarding} onChange={() => toggleBoarding(child)} />{child.boarding ? 'Có' : 'Không'}</label></td><td style={tdCenter}>{days}</td></tr>;
              })}</tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

const th: React.CSSProperties = { borderBottom: "2px solid #d9e5e1", padding: "12px 10px", textAlign: "center", whiteSpace: "nowrap" };
const td: React.CSSProperties = { borderBottom: "1px solid #e7efec", padding: "11px 10px" };
const tdCenter: React.CSSProperties = { ...td, textAlign: "center" };
