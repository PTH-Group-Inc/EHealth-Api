-- Thêm cột deleted_at cho soft delete
ALTER TABLE departments ADD COLUMN deleted_at TIMESTAMP;

-- Đăng ký API endpoints vào api_permissions
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_DEPT_VIEW_ALL', 'DEPARTMENT_MANAGEMENT', 'GET', '/api/departments', 'Lấy danh sách các khoa/phòng ban'),
('API_DEPT_VIEW_DROPDOWN', 'DEPARTMENT_MANAGEMENT', 'GET', '/api/departments/dropdown', 'Lấy danh sách dropdown khoa/phòng ban'),
('API_DEPT_VIEW_DETAIL', 'DEPARTMENT_MANAGEMENT', 'GET', '/api/departments/:id', 'Xem chi tiết một khoa/phòng ban'),
('API_DEPT_CREATE', 'DEPARTMENT_MANAGEMENT', 'POST', '/api/departments', 'Tạo mới khoa/phòng ban'),
('API_DEPT_UPDATE', 'DEPARTMENT_MANAGEMENT', 'PUT', '/api/departments/:id', 'Cập nhật thông tin khoa/phòng ban'),
('API_DEPT_UPDATE_STATUS', 'DEPARTMENT_MANAGEMENT', 'PATCH', '/api/departments/:id/status', 'Cập nhật trạng thái khoa/phòng ban'),
('API_DEPT_DELETE', 'DEPARTMENT_MANAGEMENT', 'DELETE', '/api/departments/:id', 'Xóa mềm khoa/phòng ban')
ON CONFLICT (method, endpoint) DO NOTHING;

-- Đăng ký các Quyền hạn chung (Permissions - Cho Access Token)
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_DEPT_VIEW', 'DEPARTMENT_VIEW', 'DEPARTMENT_MANAGEMENT', 'Quyền xem danh sách và chi tiết Khoa/Phòng ban'),
('PERM_DEPT_CREATE', 'DEPARTMENT_CREATE', 'DEPARTMENT_MANAGEMENT', 'Quyền thêm mới Khoa/Phòng ban'),
('PERM_DEPT_UPDATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_MANAGEMENT', 'Quyền cập nhật thông tin và trạng thái Khoa/Phòng ban'),
('PERM_DEPT_DELETE', 'DEPARTMENT_DELETE', 'DEPARTMENT_MANAGEMENT', 'Quyền xóa Khoa/Phòng ban')
ON CONFLICT (code) DO NOTHING;

-- Map Role to API Permissions
-- ROLE ADMIN và STAFF có quyền full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF') AND a.module = 'DEPARTMENT_MANAGEMENT'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ được gọi API GET
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST') 
  AND a.module = 'DEPARTMENT_MANAGEMENT' 
  AND a.method = 'GET'
ON CONFLICT DO NOTHING;

-- Phân quyền Permissions (JWT) cho các Role
-- ROLE ADMIN và STAFF có full quyền JWT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id 
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'STAFF') AND p.module = 'DEPARTMENT_MANAGEMENT'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ có chữ VIEW trong JWT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST') AND p.code = 'DEPARTMENT_VIEW'
ON CONFLICT DO NOTHING;
