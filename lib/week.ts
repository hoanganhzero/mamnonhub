import { isDate, vnToday } from "./day";

export const WEEKDAYS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];
/** Thực đơn nhà trường chạy từ thứ Hai đến thứ Sáu. */
export const MENU_DAYS = [1, 2, 3, 4, 5];

/** Thứ trong tuần: 1 là thứ Hai … 7 là Chủ Nhật. */
export function weekdayOf(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Ngày thứ Hai của tuần chứa `date`. */
export function weekStartOf(date: string) {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - (weekdayOf(date) - 1));
  return base.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Tuần hợp lệ lấy từ tham số truy vấn, mặc định là tuần này. */
export function weekParam(request: Request) {
  const value = new URL(request.url).searchParams.get("week");
  return weekStartOf(isDate(value) ? value : vnToday());
}
