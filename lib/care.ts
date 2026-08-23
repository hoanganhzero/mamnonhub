/** Các lựa chọn dùng chung cho sổ chăm sóc hằng ngày. */
export const MEALS = ["Ăn hết", "Nửa suất", "Ăn ít", "Không ăn"];
export const SLEEPS = ["Ngủ ngon", "Ngủ ít", "Khó ngủ", "Không ngủ"];
export const MOODS = ["Vui vẻ", "Bình thường", "Mệt", "Quấy khóc"];
export const HEALTH = ["Bình thường", "Sốt", "Ho", "Nôn", "Cần theo dõi"];
export const ATTENDANCE_STATUSES = ["Có mặt", "Vắng có phép", "Vắng không phép"];
export const LEAVE_REASONS = [
  "Ốm",
  "Khám bệnh",
  "Việc gia đình",
  "Về quê",
  "Lý do khác",
];
export const POST_CATEGORIES = [
  "Hoạt động học",
  "Vui chơi",
  "Bữa ăn",
  "Dã ngoại",
  "Sự kiện",
];
export const INCIDENT_KINDS = [
  "Sốt",
  "Ngã",
  "Va chạm",
  "Nôn",
  "Dị ứng",
  "Uống thuốc theo đơn",
  "Khác",
];
export const INCIDENT_SEVERITY = ["Nhẹ", "Cần theo dõi", "Khẩn"];
/** Giờ làm việc của trường: ngoài khung này giao diện báo cô sẽ trả lời sau. */
export const OFFICE_HOURS = { from: "07:00", to: "17:30" };
export const ASSESSMENT_DOMAINS = [
  ["physical", "Thể chất"],
  ["cognitive", "Nhận thức"],
  ["language", "Ngôn ngữ"],
  ["social", "Tình cảm – xã hội"],
  ["aesthetic", "Thẩm mỹ"],
] as const;
export const ASSESSMENT_LEVELS = ["Tốt", "Đạt", "Cần cố gắng"];
export const PICKUP_RELATIONS = [
  "Bố",
  "Mẹ",
  "Ông",
  "Bà",
  "Cô/Chú/Bác",
  "Anh/Chị",
  "Người quen",
];
