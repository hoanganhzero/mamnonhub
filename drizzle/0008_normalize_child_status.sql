-- Điểm danh đã chuyển sang bảng `attendance` theo từng ngày, nên `children.status`
-- chỉ còn mang nghĩa tình trạng theo học. Chuẩn hóa các giá trị điểm danh cũ.
UPDATE `children` SET `status` = 'Đang học'
WHERE `status` IN ('Đã đến', 'Xin nghỉ', 'Chưa điểm danh', '');
