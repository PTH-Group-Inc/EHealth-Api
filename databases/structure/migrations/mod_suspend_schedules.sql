-- databases/structure/migrations/mod_suspend_schedules.sql

-- 1. Alter Table staff_schedules
-- Thêm cột status để quản lý trạng thái Tạm Ngưng Lịch (Mặc định là ACTIVE)
ALTER TABLE staff_schedules ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- 2. Insert Core Permissions cho Tạm ngưng và Mở lại Lịch
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_SUSPEND_' || substr(md5(random()::text), 1, 8), 'SCHEDULE_SUSPEND', 'Cho phép đình chỉ lịch phân công hiện có', 'SHIFT_MANAGEMENT'),
('PERM_RESUME_' || substr(md5(random()::text), 1, 8), 'SCHEDULE_RESUME', 'Phục hồi lại lịch phân công đã bị tạm ngưng', 'SHIFT_MANAGEMENT')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions to admin roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND p.module = 'SHIFT_MANAGEMENT'
AND p.code IN ('SCHEDULE_SUSPEND', 'SCHEDULE_RESUME')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions cho Tạm ngưng và Mở lại Lịch
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_SCHEDULE_SUSPEND', 'PATCH', '/api/staff-schedules/:id/suspend', 'Tạm ngưng lịch làm việc nhân viên (Ví dụ nghỉ đột xuất)', 'SHIFT_MANAGEMENT'),
('API_SCHEDULE_RESUME', 'PATCH', '/api/staff-schedules/:id/resume', 'Mở lại lịch làm việc nhân viên đã bị ngưng', 'SHIFT_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions to admin roles
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND a.module = 'SHIFT_MANAGEMENT'
AND a.api_id IN ('API_SCHEDULE_SUSPEND', 'API_SCHEDULE_RESUME')
ON CONFLICT (role_id, api_id) DO NOTHING;
