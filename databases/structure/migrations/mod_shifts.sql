-- =========================================================================
-- MODULE 2.6.1: QUẢN LÝ CA LÀM VIỆC (SHIFT MANAGEMENT)
-- =========================================================================

-- 1. Tạo Bảng Quản lý Ca làm việc (`shifts`)
CREATE TABLE shifts (
    shifts_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã ca (VD: MORNING_SHIFT, AFTERNOON_SHIFT)
    name VARCHAR(100) NOT NULL,       -- Tên hiển thị (VD: Ca Sáng)
    start_time TIME NOT NULL,         -- Giờ bắt đầu (VD: 08:00:00)
    end_time TIME NOT NULL,           -- Giờ kết thúc (VD: 12:00:00)
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP              -- Soft Delete
);

-- 2. Thêm Index cho bảng shifts phục vụ API
CREATE INDEX idx_shifts_code ON shifts(code);
CREATE INDEX idx_shifts_status ON shifts(status);


-- 3. Cập nhật bảng Lịch làm việc nhân sự (staff_schedules) hiện tại (Phase 6 DB.sql line 1166)
-- Khuyên dùng: Thay thế string `shift_type` thủ công bằng Khóa ngoại `shift_id`
-- Lưu ý: Lệnh ALTER dưới đây chỉ để tham khảo, nếu CSDL đang Clean thì chạy trực tiếp. 
-- Nếu CSDL đang có dữ liệu chạy, cần migrate dữ liệu trước khi xóa cột.
/*
ALTER TABLE staff_schedules
ADD COLUMN shift_id VARCHAR(50);

ALTER TABLE staff_schedules
ADD CONSTRAINT fk_staff_schedules_shift
FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id) ON DELETE SET NULL;

-- Sau khi map dữ liệu xong, drop cột cũ
-- ALTER TABLE staff_schedules DROP COLUMN shift_type;
*/


-- 4. Bổ sung API Permissions vào Hệ thống Phân Quyền
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_SHIFT_CREATE', 'POST', '/api/shifts', 'Tạo ca làm việc', 'SHIFT_MANAGEMENT'),
('API_SHIFT_VIEW_ALL', 'GET', '/api/shifts', 'Lấy danh sách ca làm việc', 'SHIFT_MANAGEMENT'),
('API_SHIFT_VIEW_DETAIL', 'GET', '/api/shifts/:id', 'Lấy chi tiết ca làm việc', 'SHIFT_MANAGEMENT'),
('API_SHIFT_UPDATE', 'PUT', '/api/shifts/:id', 'Cập nhật ca làm việc', 'SHIFT_MANAGEMENT'),
('API_SHIFT_DELETE', 'DELETE', '/api/shifts/:id', 'Xóa / disable ca làm việc', 'SHIFT_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- Map các API này với quyền MANAGER hoặc ADMIN, SUPER_ADMIN
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND a.module = 'SHIFT_MANAGEMENT'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- 5. Bổ sung Permissions (Quyền tính năng hệ thống)
INSERT INTO permissions (permissions_id, code, name, description, module) VALUES
('PERM_SHIFT_CREATE', 'SHIFT_CREATE', 'Tạo ca làm việc', 'Cho phép tạo mới cấu hình ca làm việc', 'SHIFT_MANAGEMENT'),
('PERM_SHIFT_VIEW', 'SHIFT_VIEW', 'Xem ca làm việc', 'Cho phép xem chi tiết và danh sách ca làm việc', 'SHIFT_MANAGEMENT'),
('PERM_SHIFT_UPDATE', 'SHIFT_UPDATE', 'Cập nhật ca làm', 'Cho phép sửa thông tin ca làm việc', 'SHIFT_MANAGEMENT'),
('PERM_SHIFT_DELETE', 'SHIFT_DELETE', 'Xóa ca làm việc', 'Cho phép vô hiệu hóa ca làm việc', 'SHIFT_MANAGEMENT')
ON CONFLICT (code) DO NOTHING;

-- Map Permissions tính năng quản lý (Create/Update/Delete) với Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'SHIFT_MANAGEMENT'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Quyền xem (View) cho các Role y tế cơ cấu
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER') 
AND a.api_id IN ('API_SHIFT_VIEW_ALL', 'API_SHIFT_VIEW_DETAIL')
ON CONFLICT (role_id, api_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER') 
AND p.code = 'SHIFT_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

