-- databases/structure/migrations/mod_staff_schedules.sql

-- 1. Alter Table staff_schedules
-- Xóa cột cũ (shift_type)
ALTER TABLE staff_schedules DROP COLUMN IF EXISTS shift_type;

-- Thêm cột mới (shift_id)
ALTER TABLE staff_schedules ADD COLUMN IF NOT EXISTS shift_id VARCHAR(50);
-- Nếu bảng đang trống, ta set NOT NULL và thêm FK
ALTER TABLE staff_schedules ALTER COLUMN shift_id SET NOT NULL;
ALTER TABLE staff_schedules ADD CONSTRAINT fk_staff_schedules_shift FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id) ON DELETE RESTRICT;

-- Thêm index để truy vấn Lịch làm việc siêu nhanh (Theo Ngày và NV, Theo Ngày và Ca)
CREATE INDEX IF NOT EXISTS idx_staff_schedules_user_date ON staff_schedules(user_id, working_date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date_shift ON staff_schedules(working_date, shift_id);

-- 2. Insert Core Permissions (Quyền Giao Diện / Lõi)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('SCHEDULE_VW_' || substr(md5(random()::text), 1, 8), 'SCHEDULE_VIEW', 'Xem lịch làm việc cá nhân và danh sách lịch', 'SHIFT_MANAGEMENT'),
('SCHEDULE_CR_' || substr(md5(random()::text), 1, 8), 'SCHEDULE_CREATE', 'Phân công lịch làm việc cho nhân viên', 'SHIFT_MANAGEMENT'),
('SCHEDULE_UP_' || substr(md5(random()::text), 1, 8), 'SCHEDULE_UPDATE', 'Cập nhật ca, phòng, ngày của lịch', 'SHIFT_MANAGEMENT'),
('SCHEDULE_DEL_' || substr(md5(random()::text), 1, 8), 'SCHEDULE_DELETE', 'Hủy/xóa lịch phân công chưa diễn ra', 'SHIFT_MANAGEMENT')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions to admin (View, Create, Update, Delete)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND p.module = 'SHIFT_MANAGEMENT'
AND p.code LIKE 'SCHEDULE_%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Core Permissions to medical staff (View Only)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER') 
AND p.code = 'SCHEDULE_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions (Quyền gọi API Backend)
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_SCHEDULE_VIEW_ALL', 'GET', '/api/staff-schedules', 'Lấy danh sách phân bổ lịch', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_VIEW_DETAIL', 'GET', '/api/staff-schedules/:id', 'Xem chi tiết 1 phân công', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_BY_STAFF', 'GET', '/api/staff-schedules/staff/:staffId', 'Xem danh sách lịch theo bác sĩ/nhân viên', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_BY_DATE', 'GET', '/api/staff-schedules/date/:date', 'Xem danh sách ai đang trực phòng nào trong ngày', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_CALENDAR', 'GET', '/api/staff-schedules/calendar', 'Xem lịch Calendar dạng lưới', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_CREATE', 'POST', '/api/staff-schedules', 'Phân công lịch làm việc', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_UPDATE', 'PUT', '/api/staff-schedules/:id', 'Sửa đổi lịch làm việc hoặc tạm ngưng', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_DELETE', 'DELETE', '/api/staff-schedules/:id', 'Xóa lịch xếp nhầm (chưa diễn ra)', 'SHIFT_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions to admin roles
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND a.module = 'SHIFT_MANAGEMENT'
AND a.api_id LIKE 'API_SCHEDULE_%'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map API Permissions to medical staff (View APIs)
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER') 
AND a.api_id IN (
    'API_SCHEDULE_VIEW_ALL', 
    'API_SCHEDULE_VIEW_DETAIL', 
    'API_SCHEDULE_BY_STAFF', 
    'API_SCHEDULE_BY_DATE', 
    'API_SCHEDULE_CALENDAR'
)
ON CONFLICT (role_id, api_id) DO NOTHING;
