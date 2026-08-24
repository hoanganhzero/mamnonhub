/**
 * D1 giới hạn khoảng 100 tham số ràng buộc mỗi câu lệnh. Mọi câu ghi nhiều
 * dòng phải chia lô theo số cột để không bao giờ chạm trần — kể cả lớp 40 trẻ
 * hay tệp Excel 500 hồ sơ.
 */
const MAX_PARAMS = 80;

export function rowChunks<T>(rows: T[], paramsPerRow: number): T[][] {
  const size = Math.max(1, Math.floor(MAX_PARAMS / paramsPerRow));
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}
