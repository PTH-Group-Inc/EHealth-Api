-- Bổ sung các quyền hạn mới cho Module 2.5: Quản lý Nhân sự y tế

INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_STAFF_VIEW', 'STAFF_VIEW', 'STAFF_MANAGEMENT', 'Xem danh sách và chi tiết nhân sự y tế'),
('PERM_STAFF_CREATE', 'STAFF_CREATE', 'STAFF_MANAGEMENT', 'Tạo mới hồ sơ nhân sự y tế'),
('PERM_STAFF_UPDATE', 'STAFF_UPDATE', 'STAFF_MANAGEMENT', 'Cập nhật thông tin, phòng ban, trạng thái của nhân sự y tế'),
('PERM_STAFF_DELETE', 'STAFF_DELETE', 'STAFF_MANAGEMENT', 'Xóa (vô hiệu hóa) hồ sơ nhân sự y tế')
ON CONFLICT (code) DO NOTHING;

-- Phân bổ quyền cho ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_ADMIN', permissions_id FROM permissions
WHERE code IN ('STAFF_VIEW', 'STAFF_CREATE', 'STAFF_UPDATE', 'STAFF_DELETE')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 'ROLE_ADMIN' AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;

-- Phân bổ quyền cho SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_SUPER_ADMIN', permissions_id FROM permissions
WHERE code IN ('STAFF_VIEW', 'STAFF_CREATE', 'STAFF_UPDATE', 'STAFF_DELETE')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 'ROLE_SUPER_ADMIN' AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;

-- Phân bổ quyền xem danh sách cho các nhân viên khác (Tuỳ chọn)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permissions_id FROM roles CROSS JOIN permissions
WHERE roles.code IN ('STAFF') 
AND permissions.code IN ('STAFF_VIEW')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = roles.roles_id AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;

-- ==========================================
-- Bổ sung API Permissions cho Module 2.5: Medical Staff
-- ==========================================

INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_STAFF_GET_LIST', 'GET', '/api/staff', 'Lấy danh sách nhân sự y tế', 'STAFF_MANAGEMENT'),
('API_STAFF_GET_DETAIL', 'GET', '/api/staff/:staffId', 'Chi tiết thông tin nhân sự y tế', 'STAFF_MANAGEMENT'),
('API_STAFF_CREATE', 'POST', '/api/staff', 'Tạo hồ sơ nhân sự y tế mới', 'STAFF_MANAGEMENT'),
('API_STAFF_UPDATE', 'PUT', '/api/staff/:staffId', 'Cập nhật thông tin cơ bản nhân sự', 'STAFF_MANAGEMENT'),
('API_STAFF_UPDATE_SIGN', 'PATCH', '/api/staff/:staffId/signature', 'Cập nhật file ảnh chữ ký số', 'STAFF_MANAGEMENT'),
('API_STAFF_UPDATE_DOC_INFO', 'PUT', '/api/staff/:staffId/doctor-info', 'Khai báo / Cập nhật chuyên môn Bác sĩ', 'STAFF_MANAGEMENT'),
('API_STAFF_GET_LICENSES', 'GET', '/api/staff/:staffId/licenses', 'Lấy danh sách bằng cấp/chứng chỉ', 'STAFF_MANAGEMENT'),
('API_STAFF_CREATE_LICENSE', 'POST', '/api/staff/:staffId/licenses', 'Thêm bằng cấp/chứng chỉ hành nghề', 'STAFF_MANAGEMENT'),
('API_STAFF_UPDATE_LICENSE', 'PUT', '/api/staff/:staffId/licenses/:licenseId', 'Cập nhật Bằng cấp/Chứng chỉ', 'STAFF_MANAGEMENT'),
('API_STAFF_DELETE_LICENSE', 'DELETE', '/api/staff/:staffId/licenses/:licenseId', 'Xóa Bằng cấp/Chứng chỉ', 'STAFF_MANAGEMENT'),
('API_STAFF_UPDATE_STATUS', 'PUT', '/api/staff/:staffId/status', 'Cập nhật trạng thái nhân sự', 'STAFF_MANAGEMENT'),
('API_STAFF_ASSIGN_ROLE', 'POST', '/api/staff/:staffId/roles', 'Gán vai trò cho nhân sự', 'STAFF_MANAGEMENT'),
('API_STAFF_REMOVE_ROLE', 'DELETE', '/api/staff/:staffId/roles/:roleId', 'Thu hồi vai trò của nhân sự', 'STAFF_MANAGEMENT'),
('API_STAFF_ASSIGN_BRANCH', 'POST', '/api/staff/:staffId/branches', 'Gán nhân sự vào chi nhánh', 'STAFF_MANAGEMENT'),
('API_STAFF_REMOVE_BRANCH', 'DELETE', '/api/staff/:staffId/branches/:branchId', 'Xóa phân công nhân sự khỏi chi nhánh', 'STAFF_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- Phân quyền API cho ADMIN
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_ADMIN', api_id FROM api_permissions
WHERE module = 'STAFF_MANAGEMENT'
AND NOT EXISTS (
    SELECT 1 FROM role_api_permissions rap 
    WHERE rap.role_id = 'ROLE_ADMIN' AND rap.api_id = api_permissions.api_id
)
ON CONFLICT DO NOTHING;

-- Phân quyền API cho SUPER_ADMIN
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_SUPER_ADMIN', api_id FROM api_permissions
WHERE module = 'STAFF_MANAGEMENT'
AND NOT EXISTS (
    SELECT 1 FROM role_api_permissions rap 
    WHERE rap.role_id = 'ROLE_SUPER_ADMIN' AND rap.api_id = api_permissions.api_id
)
ON CONFLICT DO NOTHING;

-- Phân quyền API cho các nhân viên khác (Chỉ các endpoint xem)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT roles.roles_id, api_permissions.api_id 
FROM roles CROSS JOIN api_permissions
WHERE roles.code IN ('STAFF', 'DOCTOR', 'NURSE', 'PHARMACIST') 
AND api_permissions.api_id IN ('API_STAFF_GET_LIST', 'API_STAFF_GET_DETAIL', 'API_STAFF_GET_LICENSES')
AND NOT EXISTS (
    SELECT 1 FROM role_api_permissions rap 
    WHERE rap.role_id = roles.roles_id AND rap.api_id = api_permissions.api_id
)
ON CONFLICT DO NOTHING;
