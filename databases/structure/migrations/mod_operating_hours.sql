-- =============================================
-- Module 2.8.1: Giờ hoạt động cơ sở (Operating Hours)
-- Bảng facility_operation_hours ĐÃ tồn tại trong DB.
-- Script này chỉ bổ sung các cột audit và quyền.
-- =============================================

-- 1. Bổ sung cột audit (nếu chưa có)
ALTER TABLE facility_operation_hours ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE facility_operation_hours ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE facility_operation_hours ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 2. Insert Core Permissions (Bảng permissions)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_OPH_VW_' || substr(md5(random()::text), 1, 8), 'OP_HOURS_VIEW', 'Xem giờ hoạt động cơ sở', 'OPERATING_HOURS'),
('PERM_OPH_CR_' || substr(md5(random()::text), 1, 8), 'OP_HOURS_CREATE', 'Tạo cấu hình giờ hoạt động', 'OPERATING_HOURS'),
('PERM_OPH_UP_' || substr(md5(random()::text), 1, 8), 'OP_HOURS_UPDATE', 'Cập nhật giờ hoạt động', 'OPERATING_HOURS'),
('PERM_OPH_DEL_' || substr(md5(random()::text), 1, 8), 'OP_HOURS_DELETE', 'Xóa cấu hình giờ hoạt động', 'OPERATING_HOURS')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions cho Admin (Full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'OPERATING_HOURS'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Core Permissions cho nhân viên y tế (View only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND p.code IN ('OP_HOURS_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_OPH_VIEW_ALL', 'GET', '/api/operating-hours', 'Lấy danh sách giờ hoạt động', 'OPERATING_HOURS'),
('API_OPH_VIEW_DETAIL', 'GET', '/api/operating-hours/:id', 'Xem chi tiết giờ hoạt động', 'OPERATING_HOURS'),
('API_OPH_CREATE', 'POST', '/api/operating-hours', 'Tạo cấu hình giờ hoạt động', 'OPERATING_HOURS'),
('API_OPH_UPDATE', 'PUT', '/api/operating-hours/:id', 'Cập nhật giờ hoạt động', 'OPERATING_HOURS'),
('API_OPH_DELETE', 'DELETE', '/api/operating-hours/:id', 'Xóa cấu hình giờ hoạt động', 'OPERATING_HOURS')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions cho Admin (Full quyền)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND a.module = 'OPERATING_HOURS'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map API Permissions cho nhân viên y tế (View only)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND a.api_id IN ('API_OPH_VIEW_ALL', 'API_OPH_VIEW_DETAIL')
ON CONFLICT (role_id, api_id) DO NOTHING;
