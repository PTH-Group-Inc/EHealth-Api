-- 1. Bổ sung cột deleted_at vào bảng facilities
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- 2. Đăng ký các API Endpoint cho Quản lý Cơ sở y tế
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_FACILITY_GET_ALL', 'GET', '/api/facilities', 'Danh sách Cơ sở Y tế (Admin)', 'FACILITY_MANAGEMENT'),
('API_FACILITY_GET_ONE', 'GET', '/api/facilities/:id', 'Chi tiết Cơ sở Y tế', 'FACILITY_MANAGEMENT'),
('API_FACILITY_POST', 'POST', '/api/facilities', 'Thêm mới Cơ sở Y tế', 'FACILITY_MANAGEMENT'),
('API_FACILITY_PUT', 'PUT', '/api/facilities/:id', 'Cập nhật Cơ sở Y tế', 'FACILITY_MANAGEMENT'),
('API_FACILITY_PATCH_STATUS', 'PATCH', '/api/facilities/:id/status', 'Cập nhật trạng thái Cơ sở', 'FACILITY_MANAGEMENT'),
('API_FACILITY_DELETE', 'DELETE', '/api/facilities/:id', 'Xóa Cơ sở Y tế (Soft Delete)', 'FACILITY_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3. Phân quyền cho ADMIN và STAFF (Dựa trên thiết kế cũ)
-- Dọn dẹp trước để tránh trùng lặp nếu chạy lại script
-- ROLE STAFF (Quản lý cấp cơ sở được phép Xem, Quản trị)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_STAFF', api_id FROM api_permissions WHERE module = 'FACILITY_MANAGEMENT' AND endpoint LIKE '/api/facilities%'
ON CONFLICT DO NOTHING;

-- ROLE ADMIN
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_ADMIN', api_id FROM api_permissions WHERE module = 'FACILITY_MANAGEMENT' AND endpoint LIKE '/api/facilities%'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST (Chỉ được GET)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_DOCTOR', api_id FROM api_permissions WHERE module = 'FACILITY_MANAGEMENT' AND method = 'GET'
ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_NURSE', api_id FROM api_permissions WHERE module = 'FACILITY_MANAGEMENT' AND method = 'GET'
ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_PHARMACIST', api_id FROM api_permissions WHERE module = 'FACILITY_MANAGEMENT' AND method = 'GET'
ON CONFLICT DO NOTHING;

-- 4. Đăng ký các Quyền hạn chung (Permissions - Cho Access Token)
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_FACILITY_VIEW', 'FACILITY_VIEW', 'FACILITY_MANAGEMENT', 'Quyền xem danh sách và chi tiết Cơ sở Y tế'),
('PERM_FACILITY_CREATE', 'FACILITY_CREATE', 'FACILITY_MANAGEMENT', 'Quyền thêm mới Cơ sở Y tế'),
('PERM_FACILITY_UPDATE', 'FACILITY_UPDATE', 'FACILITY_MANAGEMENT', 'Quyền cập nhật thông tin và trạng thái Cơ sở Y tế'),
('PERM_FACILITY_DELETE', 'FACILITY_DELETE', 'FACILITY_MANAGEMENT', 'Quyền xóa Cơ sở Y tế')
ON CONFLICT (code) DO NOTHING;

-- 5. Phân quyền Permissions cho các Role
-- ROLE ADMIN có full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_ADMIN', permissions_id FROM permissions WHERE module = 'FACILITY_MANAGEMENT'
ON CONFLICT DO NOTHING;

-- ROLE STAFF có full quyền (Tùy thuộc nghiệp vụ hiện tại đang cho)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_STAFF', permissions_id FROM permissions WHERE module = 'FACILITY_MANAGEMENT'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ có chữ VIEW
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_DOCTOR', permissions_id FROM permissions WHERE code = 'FACILITY_VIEW'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_NURSE', permissions_id FROM permissions WHERE code = 'FACILITY_VIEW'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_PHARMACIST', permissions_id FROM permissions WHERE code = 'FACILITY_VIEW'
ON CONFLICT DO NOTHING;