-- 1. Xóa Constraint UNIQUE cũ 
-- Lưu ý: Tên của constraint sẽ tùy thuộc vào hệ thống bạn tạo ra, tôi dùng lệnh bỏ qua lỗi nếu không tìm thấy tên chính xác.
-- Thường sẽ là `medical_rooms_department_id_code_key`
ALTER TABLE medical_rooms DROP CONSTRAINT IF EXISTS medical_rooms_department_id_code_key;

-- 2. Thay đổi cấu trúc bảng `medical_rooms`
ALTER TABLE medical_rooms ADD COLUMN branch_id VARCHAR(50);

-- Update branch_id dựa vào department_id hiện tại (dành cho dữ liệu cũ nếu có)
UPDATE medical_rooms mr
SET branch_id = d.branch_id
FROM departments d
WHERE mr.department_id = d.departments_id;

-- Đặt lại Constraints mới
ALTER TABLE medical_rooms ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE medical_rooms ALTER COLUMN department_id DROP NOT NULL;

-- Thêm Khóa Ngoại cho branch_id
ALTER TABLE medical_rooms 
ADD CONSTRAINT fk_medical_rooms_branch 
FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE;

-- Tạo Constraint UNIQUE mới trên branch_id và code
ALTER TABLE medical_rooms ADD CONSTRAINT medical_rooms_branch_id_code_key UNIQUE(branch_id, code);

-- 3. Thêm cột soft delete
ALTER TABLE medical_rooms ADD COLUMN deleted_at TIMESTAMP NULL;


-- 4. Đăng ký API endpoints vào api_permissions
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_ROOM_VIEW_ALL', 'MEDICAL_ROOMS', 'GET', '/api/medical-rooms', 'Lấy danh sách các phòng/buồng khám'),
('API_ROOM_VIEW_DROPDOWN', 'MEDICAL_ROOMS', 'GET', '/api/medical-rooms/dropdown', 'Lấy danh sách dropdown phòng'),
('API_ROOM_VIEW_DETAIL', 'MEDICAL_ROOMS', 'GET', '/api/medical-rooms/:id', 'Xem chi tiết một buồng khám'),
('API_ROOM_CREATE', 'MEDICAL_ROOMS', 'POST', '/api/medical-rooms', 'Tạo mới phòng/buồng khám'),
('API_ROOM_UPDATE', 'MEDICAL_ROOMS', 'PUT', '/api/medical-rooms/:id', 'Cập nhật thông tin phòng'),
('API_ROOM_UPDATE_STATUS', 'MEDICAL_ROOMS', 'PATCH', '/api/medical-rooms/:id/status', 'Cập nhật trạng thái phòng'),
('API_ROOM_DELETE', 'MEDICAL_ROOMS', 'DELETE', '/api/medical-rooms/:id', 'Xóa mềm buồng khám')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Đăng ký các Quyền hạn chung (Permissions - Cho Access Token)
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_ROOM_VIEW', 'ROOM_VIEW', 'MEDICAL_ROOMS', 'Quyền xem danh sách và chi tiết Phòng khám/Chức năng'),
('PERM_ROOM_CREATE', 'ROOM_CREATE', 'MEDICAL_ROOMS', 'Quyền thêm mới Phòng khám/Chức năng'),
('PERM_ROOM_UPDATE', 'ROOM_UPDATE', 'MEDICAL_ROOMS', 'Quyền cập nhật thông tin và trạng thái Phòng khám/Chức năng'),
('PERM_ROOM_DELETE', 'ROOM_DELETE', 'MEDICAL_ROOMS', 'Quyền xóa Phòng khám/Chức năng')
ON CONFLICT (code) DO NOTHING;

-- Map Role to API Permissions
-- ROLE ADMIN và STAFF có quyền full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF') AND a.module = 'MEDICAL_ROOMS'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ được gọi API GET
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST') 
  AND a.module = 'MEDICAL_ROOMS' 
  AND a.method = 'GET'
ON CONFLICT DO NOTHING;

-- Phân quyền Permissions (JWT) cho các Role
-- ROLE ADMIN và STAFF có full quyền JWT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id 
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'STAFF') AND p.module = 'MEDICAL_ROOMS'
ON CONFLICT DO NOTHING;

-- ROLE DOCTOR, NURSE, PHARMACIST chỉ có chữ VIEW trong JWT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST') AND p.code = 'ROOM_VIEW'
ON CONFLICT DO NOTHING;
