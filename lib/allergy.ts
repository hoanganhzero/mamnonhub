/** Tách ô dị ứng của trẻ thành từng món cần tránh. */
export function allergyTokens(value: string) {
  return (value || "")
    .split(/[,;/\n]+/)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 1 && x !== "không" && x !== "khong");
}

/** Những món trong thực đơn trùng với danh sách dị ứng của trẻ. */
export function allergyHits(allergy: string, dish: string) {
  const text = (dish || "").toLowerCase();
  if (!text) return [];
  return allergyTokens(allergy).filter((token) => text.includes(token));
}
