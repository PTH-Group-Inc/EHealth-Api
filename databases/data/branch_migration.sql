-- Thêm cột deleted_at cho soft delete
ALTER TABLE branches ADD COLUMN deleted_at TIMESTAMP;

-- Đăng ký API endpoints vào api_permissions
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_BRANCH_VIEW_ALL', 'BRANCH_MANAGEMENT', 'GET', '/api/branches', 'Lấy danh sách các chi nhánh'),
('API_BRANCH_VIEW_DROPDOWN', 'BRANCH_MANAGEMENT', 'GET', '/api/branches/dropdown', 'Lấy danh sách dropdown chi nhánh'),
('API_BRANCH_VIEW_DETAIL', 'BRANCH_MANAGEMENT', 'GET', '/api/branches/:id', 'Xem chi tiết một chi nhánh'),
('API_BRANCH_CREATE', 'BRANCH_MANAGEMENT', 'POST', '/api/branches', 'Tạo mới chi nhánh'),
('API_BRANCH_UPDATE', 'BRANCH_MANAGEMENT', 'PUT', '/api/branches/:id', 'Cập nhật thông tin chi nhánh'),
('API_BRANCH_UPDATE_STATUS', 'BRANCH_MANAGEMENT', 'PATCH', '/api/branches/:id/status', 'Cập nhật trạng thái chi nhánh'),
('API_BRANCH_DELETE', 'BRANCH_MANAGEMENT', 'DELETE', '/api/branches/:id', 'Xóa mềm chi nhánh')
ON CONFLICT (method, endpoint) DO NOTHING;

-- Đăng ký các Quyền hạn chung (Permissions - Cho Access Token)
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BRANCH_VIEW', 'BRANCH_VIEW', 'BRANCH_MANAGEMENT', 'Quyền xem danh sách và chi tiết Chi nhánh'),
('PERM_BRANCH_CREATE', 'BRANCH_CREATE', 'BRANCH_MANAGEMENT', 'Quyền thêm mới Chi nhánh'),
('PERM_BRANCH_UPDATE', 'BRANCH_UPDATE', 'BRANCH_MANAGEMENT', 'Quyền cập nhật thông tin và trạng thái Chi nhánh'),
('PERM_BRANCH_DELETE', 'BRANCH_DELETE', 'BRANCH_MANAGEMENT', 'Quyền xóa Chi nhánh')
ON CONFLICT (code) DO NOTHING;

-- Map Role to API Permissions
-- ROLE ADMIN và STAFF có quyền full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF') AND a.module = 'BRANCH_MANAGEMENT'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ được gọi API GET
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST') 
  AND a.module = 'BRANCH_MANAGEMENT' 
  AND a.method = 'GET'
ON CONFLICT DO NOTHING;

-- Phân quyền Permissions (JWT) cho các Role
-- ROLE ADMIN và STAFF có full quyền JWT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id 
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'STAFF') AND p.module = 'BRANCH_MANAGEMENT'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ có chữ VIEW trong JWT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST') AND p.code = 'BRANCH_VIEW'
ON CONFLICT DO NOTHING;
