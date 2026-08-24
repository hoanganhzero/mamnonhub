/**
 * Bộ giao diện màu cho từng trường. Mỗi bộ ghi đè các biến CSS chính:
 * accent (nút, huy hiệu), secondary (điểm nhấn phụ), cùng nền và chữ của
 * trạng thái đang chọn trên thanh điều hướng.
 */
export const THEMES: Record<
  string,
  {
    label: string;
    accent: string;
    secondary: string;
    navBg: string;
    navText: string;
  }
> = {
  mint: {
    label: "Bạc hà & San hô",
    accent: "#f58278",
    secondary: "#65b5a4",
    navBg: "#eaf5f1",
    navText: "#41917f",
  },
  "hoa-dao": {
    label: "Hoa đào",
    accent: "#e8748f",
    secondary: "#c58ac0",
    navBg: "#fbeef3",
    navText: "#c2557a",
  },
  "bien-xanh": {
    label: "Biển xanh",
    accent: "#4d9dd8",
    secondary: "#5fb8c9",
    navBg: "#e9f3fb",
    navText: "#33739f",
  },
  "oai-huong": {
    label: "Oải hương",
    accent: "#9d7fd1",
    secondary: "#b491d9",
    navBg: "#f2edfa",
    navText: "#71589e",
  },
  "nang-vang": {
    label: "Nắng vàng",
    accent: "#e8a13c",
    secondary: "#c9b458",
    navBg: "#fbf3e2",
    navText: "#a3711f",
  },
  "la-non": {
    label: "Lá non",
    accent: "#6cae4f",
    secondary: "#8fc27a",
    navBg: "#eef6ea",
    navText: "#4a7c37",
  },
};

export const DEFAULT_THEME = "mint";

/** Biểu tượng lớp mà giáo viên chọn được, kèm tên gọi thân thương. */
export const MASCOT_SET: { emoji: string; label: string }[] = [
  { emoji: "🌻", label: "Hướng dương" },
  { emoji: "🌸", label: "Hoa đào" },
  { emoji: "🦋", label: "Bươm bướm" },
  { emoji: "🐥", label: "Gà con" },
  { emoji: "🐰", label: "Thỏ trắng" },
  { emoji: "🐻", label: "Gấu nâu" },
  { emoji: "🦁", label: "Sư tử" },
  { emoji: "🐬", label: "Cá heo" },
  { emoji: "🍀", label: "Cỏ may mắn" },
  { emoji: "🌈", label: "Cầu vồng" },
  { emoji: "⭐", label: "Ngôi sao" },
  { emoji: "🍎", label: "Táo đỏ" },
];
export const MASCOTS = MASCOT_SET.map((x) => x.emoji);

/** Biến CSS ghi đè cho một theme, gắn vào style của khung chính. */
export function themeVars(theme: string | null | undefined) {
  const t = THEMES[theme || DEFAULT_THEME] ?? THEMES[DEFAULT_THEME];
  return {
    "--coral": t.accent,
    "--mint": t.secondary,
    "--nav-on-bg": t.navBg,
    "--nav-on-text": t.navText,
  } as React.CSSProperties;
}
