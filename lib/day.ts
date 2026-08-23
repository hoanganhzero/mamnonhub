const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function vnToday() {
  return new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Giờ hiện tại theo giờ Việt Nam, dạng HH:MM. */
export function vnNow() {
  return new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(11, 16);
}

export function isDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

export function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Ngày hợp lệ lấy từ tham số truy vấn, mặc định là hôm nay. */
export function dateParam(request: Request, key = "date") {
  const value = new URL(request.url).searchParams.get(key);
  return isDate(value) ? value : vnToday();
}
