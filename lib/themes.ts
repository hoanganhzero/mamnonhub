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
    pageBg: string;
    surface: string;
    line: string;
    soft: string;
    heroFrom: string;
    heroTo: string;
  }
> = {
  mint: {
    label: "Bạc hà & San hô",
    accent: "#f58278",
    secondary: "#65b5a4",
    navBg: "#eaf5f1",
    navText: "#41917f",
    pageBg: "#f5f8f5", surface: "#fffefa", line: "#dfeae5", soft: "#edf7f3", heroFrom: "#fff1e8", heroTo: "#e7f5ef",
  },
  "hoa-dao": {
    label: "Hoa đào",
    accent: "#e8748f",
    secondary: "#c58ac0",
    navBg: "#fbeef3",
    navText: "#c2557a",
    pageBg: "#fff7fa", surface: "#fffdfd", line: "#f0dfe6", soft: "#fbeef3", heroFrom: "#fff0f4", heroTo: "#f5eafa",
  },
  "bien-xanh": {
    label: "Biển xanh",
    accent: "#4d9dd8",
    secondary: "#5fb8c9",
    navBg: "#e9f3fb",
    navText: "#33739f",
    pageBg: "#f4f9fd", surface: "#ffffff", line: "#dbe9f3", soft: "#eaf4fb", heroFrom: "#eaf5fd", heroTo: "#e5f6f7",
  },
  "oai-huong": {
    label: "Oải hương",
    accent: "#9d7fd1",
    secondary: "#b491d9",
    navBg: "#f2edfa",
    navText: "#71589e",
    pageBg: "#f8f5fc", surface: "#fffefe", line: "#e7def2", soft: "#f2edfa", heroFrom: "#f6effc", heroTo: "#eee8fa",
  },
  "nang-vang": {
    label: "Nắng vàng",
    accent: "#e8a13c",
    secondary: "#c9b458",
    navBg: "#fbf3e2",
    navText: "#a3711f",
    pageBg: "#fdf9f0", surface: "#fffefa", line: "#eee3cb", soft: "#fbf3e2", heroFrom: "#fff3d7", heroTo: "#f8f4e5",
  },
  "la-non": {
    label: "Lá non",
    accent: "#6cae4f",
    secondary: "#8fc27a",
    navBg: "#eef6ea",
    navText: "#4a7c37",
    pageBg: "#f5faf2", surface: "#fffefa", line: "#dce9d6", soft: "#eef6ea", heroFrom: "#eff8e8", heroTo: "#e5f4e8",
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
    "--page-bg": t.pageBg,
    "--surface": t.surface,
    "--line": t.line,
    "--soft": t.soft,
    "--hero-from": t.heroFrom,
    "--hero-to": t.heroTo,
  } as React.CSSProperties;
}
