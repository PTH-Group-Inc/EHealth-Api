-- databases/structure/migrations/mod_licenses.sql

-- 1. ALTER bảng user_licenses: Thêm các cột audit (Soft Delete)
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Index tìm kiếm nhanh theo user và theo ngày hết hạn
CREATE INDEX IF NOT EXISTS idx_user_licenses_user ON user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_expiry ON user_licenses(expiry_date);

-- 2. Insert Core Permissions (Bảng permissions)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_LIC_VW_' || substr(md5(random()::text), 1, 8), 'LICENSE_VIEW', 'Xem danh sách giấy phép / chứng chỉ', 'LICENSE_MANAGEMENT'),
('PERM_LIC_CR_' || substr(md5(random()::text), 1, 8), 'LICENSE_CREATE', 'Tạo giấy phép / chứng chỉ mới', 'LICENSE_MANAGEMENT'),
('PERM_LIC_UP_' || substr(md5(random()::text), 1, 8), 'LICENSE_UPDATE', 'Cập nhật giấy phép / chứng chỉ', 'LICENSE_MANAGEMENT'),
('PERM_LIC_DEL_' || substr(md5(random()::text), 1, 8), 'LICENSE_DELETE', 'Xóa / disable giấy phép', 'LICENSE_MANAGEMENT')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions cho Admin (Full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'LICENSE_MANAGEMENT'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Core Permissions cho nhân viên y tế (View only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND p.code IN ('LICENSE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_LIC_VIEW_ALL', 'GET', '/api/licenses', 'Lấy danh sách giấy phép', 'LICENSE_MANAGEMENT'),
('API_LIC_VIEW_DETAIL', 'GET', '/api/licenses/:id', 'Xem chi tiết giấy phép', 'LICENSE_MANAGEMENT'),
('API_LIC_CREATE', 'POST', '/api/licenses', 'Tạo giấy phép mới', 'LICENSE_MANAGEMENT'),
('API_LIC_UPDATE', 'PUT', '/api/licenses/:id', 'Cập nhật giấy phép', 'LICENSE_MANAGEMENT'),
('API_LIC_DELETE', 'DELETE', '/api/licenses/:id', 'Xóa / disable giấy phép', 'LICENSE_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions cho Admin
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND a.module = 'LICENSE_MANAGEMENT'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map API Permissions cho nhân viên y tế (View only)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND a.api_id IN ('API_LIC_VIEW_ALL', 'API_LIC_VIEW_DETAIL')
ON CONFLICT (role_id, api_id) DO NOTHING;
