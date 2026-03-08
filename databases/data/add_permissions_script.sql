-- =========================================================================
-- MOCK DATA: BỔ SUNG QUYỀN HẠN MỚI CHO TẤT CẢ CÁC MODULE 
-- =========================================================================

INSERT INTO permissions (permissions_id, code, module, description) VALUES
-- MASTER DATA
('PERM_MD_VIEW', 'MASTER_DATA_VIEW', 'SYSTEM', 'Xem danh mục nền'),
('PERM_MD_CREATE', 'MASTER_DATA_CREATE', 'SYSTEM', 'Thêm danh mục nền mới'),
('PERM_MD_UPDATE', 'MASTER_DATA_UPDATE', 'SYSTEM', 'Cập nhật danh mục nền'),
('PERM_MD_DELETE', 'MASTER_DATA_DELETE', 'SYSTEM', 'Xóa danh mục nền'),
('PERM_MD_IMPORT', 'MASTER_DATA_IMPORT', 'SYSTEM', 'Import Excel danh mục nền'),
('PERM_MD_EXPORT', 'MASTER_DATA_EXPORT', 'SYSTEM', 'Export Excel danh mục nền'),

-- MEDICAL SERVICES
('PERM_SRV_VIEW', 'SERVICE_VIEW', 'SERVICE_MANAGEMENT', 'Xem danh mục dịch vụ chuẩn'),
('PERM_SRV_CREATE', 'SERVICE_CREATE', 'SERVICE_MANAGEMENT', 'Tạo dịch vụ chuẩn mới'),
('PERM_SRV_UPDATE', 'SERVICE_UPDATE', 'SERVICE_MANAGEMENT', 'Cập nhật dịch vụ chuẩn'),
('PERM_SRV_DELETE', 'SERVICE_DELETE', 'SERVICE_MANAGEMENT', 'Xóa dịch vụ chuẩn'),
('PERM_SRV_IMPORT', 'SERVICE_IMPORT', 'SERVICE_MANAGEMENT', 'Import Excel dịch vụ chuẩn'),
('PERM_SRV_EXPORT', 'SERVICE_EXPORT', 'SERVICE_MANAGEMENT', 'Export Excel dịch vụ chuẩn'),
('PERM_FACSRV_VIEW', 'FACILITY_SERVICE_VIEW', 'SERVICE_MANAGEMENT', 'Xem danh mục dịch vụ của cơ sở'),
('PERM_FACSRV_CREATE', 'FACILITY_SERVICE_CREATE', 'SERVICE_MANAGEMENT', 'Thêm dịch vụ chuẩn vào cơ sở'),
('PERM_FACSRV_UPDATE', 'FACILITY_SERVICE_UPDATE', 'SERVICE_MANAGEMENT', 'Cập nhật dịch vụ cơ sở'),
('PERM_FACSRV_DELETE', 'FACILITY_SERVICE_DELETE', 'SERVICE_MANAGEMENT', 'Ngừng kinh doanh dịch vụ tại cơ sở'),
('PERM_FACSRV_IMPORT', 'FACILITY_SERVICE_IMPORT', 'SERVICE_MANAGEMENT', 'Import Excel dịch vụ cơ sở'),
('PERM_FACSRV_EXPORT', 'FACILITY_SERVICE_EXPORT', 'SERVICE_MANAGEMENT', 'Export Excel dịch vụ cơ sở'),

-- USER MANAGEMENT
('PERM_USER_VIEW', 'USER_VIEW', 'USER_MANAGEMENT', 'Xem danh sách người dùng'),
('PERM_USER_CREATE', 'USER_CREATE', 'USER_MANAGEMENT', 'Tạo người dùng mới'),
('PERM_USER_UPDATE', 'USER_UPDATE', 'USER_MANAGEMENT', 'Cập nhật người dùng'),
('PERM_USER_DELETE', 'USER_DELETE', 'USER_MANAGEMENT', 'Xóa người dùng'),
('PERM_USER_IMPORT', 'USER_IMPORT', 'USER_MANAGEMENT', 'Import người dùng'),
('PERM_USER_EXPORT', 'USER_EXPORT', 'USER_MANAGEMENT', 'Export người dùng'),

-- FACILITY MANAGEMENT
('PERM_FAC_VIEW', 'FACILITY_VIEW', 'FACILITY_MANAGEMENT', 'Xem danh sách Cơ sở y tế'),
('PERM_FAC_CREATE', 'FACILITY_CREATE', 'FACILITY_MANAGEMENT', 'Tạo Cơ sở y tế mới'),
('PERM_FAC_UPDATE', 'FACILITY_UPDATE', 'FACILITY_MANAGEMENT', 'Cập nhật thông tin Cơ sở y tế'),
('PERM_FAC_DELETE', 'FACILITY_DELETE', 'FACILITY_MANAGEMENT', 'Xóa Cơ sở y tế'),

-- RBAC & SYSTEM MODULES
('PERM_ROLE_VIEW', 'ROLE_VIEW', 'SYSTEM', 'Xem danh sách vai trò'),
('PERM_ROLE_CREATE', 'ROLE_CREATE', 'SYSTEM', 'Tạo vai trò mới'),
('PERM_ROLE_UPDATE', 'ROLE_UPDATE', 'SYSTEM', 'Cập nhật vai trò'),
('PERM_ROLE_DELETE', 'ROLE_DELETE', 'SYSTEM', 'Xóa vai trò'),
('PERM_PERMISSION_VIEW', 'PERMISSION_VIEW', 'SYSTEM', 'Xem danh sách quyền'),
('PERM_PERMISSION_CREATE', 'PERMISSION_CREATE', 'SYSTEM', 'Tạo quyền mới'),
('PERM_PERMISSION_UPDATE', 'PERMISSION_UPDATE', 'SYSTEM', 'Cập nhật quyền'),
('PERM_PERMISSION_DELETE', 'PERMISSION_DELETE', 'SYSTEM', 'Xóa quyền'),
('PERM_API_PERM_VIEW', 'API_PERMISSION_VIEW', 'SYSTEM', 'Xem cấu hình API Guard'),
('PERM_API_PERM_CREATE', 'API_PERMISSION_CREATE', 'SYSTEM', 'Tạo cấu hình API Guard'),
('PERM_API_PERM_UPDATE', 'API_PERMISSION_UPDATE', 'SYSTEM', 'Cập nhật API Guard'),
('PERM_API_PERM_DELETE', 'API_PERMISSION_DELETE', 'SYSTEM', 'Xóa cấu hình API Guard'),
('PERM_MENU_VIEW', 'MENU_VIEW', 'SYSTEM', 'Xem danh sách UI Menu'),
('PERM_MENU_CREATE', 'MENU_CREATE', 'SYSTEM', 'Tạo UI Menu mới'),
('PERM_MENU_UPDATE', 'MENU_UPDATE', 'SYSTEM', 'Cập nhật UI Menu'),
('PERM_MENU_DELETE', 'MENU_DELETE', 'SYSTEM', 'Xóa UI Menu'),
('PERM_MODULE_VIEW', 'MODULE_VIEW', 'SYSTEM', 'Xem danh sách Modules'),

-- AUDIT LOGS
('PERM_AUDIT_LOG_VIEW', 'AUDIT_LOG_VIEW', 'SYSTEM', 'Xem nhật ký hệ thống'),
('PERM_AUDIT_LOG_EXPORT', 'AUDIT_LOG_EXPORT', 'SYSTEM', 'Xuất Excel nhật ký hệ thống'),
('PERM_SYSTEM_CONFIG_VIEW', 'SYSTEM_CONFIG_VIEW', 'SYSTEM', 'Xem cấu hình hệ thống'),
('PERM_SYSTEM_CONFIG_UPDATE', 'SYSTEM_CONFIG_UPDATE', 'SYSTEM', 'Cập nhật cấu hình hệ thống'),

-- NOTIFICATION SYSTEM
('PERM_NOTI_TEMPLATE_VIEW', 'NOTIFICATION_TEMPLATE_VIEW', 'SYSTEM', 'Xem mẫu thông báo'),
('PERM_NOTI_TEMPLATE_CREATE', 'NOTIFICATION_TEMPLATE_CREATE', 'SYSTEM', 'Tạo mẫu thông báo'),
('PERM_NOTI_TEMPLATE_UPDATE', 'NOTIFICATION_TEMPLATE_UPDATE', 'SYSTEM', 'Cập nhật mẫu thông báo'),
('PERM_NOTI_TEMPLATE_DELETE', 'NOTIFICATION_TEMPLATE_DELETE', 'SYSTEM', 'Xóa mẫu thông báo'),
('PERM_NOTI_CAT_VIEW', 'NOTIFICATION_CATEGORY_VIEW', 'SYSTEM', 'Xem danh mục thông báo'),
('PERM_NOTI_CAT_CREATE', 'NOTIFICATION_CATEGORY_CREATE', 'SYSTEM', 'Tạo danh mục thông báo'),
('PERM_NOTI_CAT_UPDATE', 'NOTIFICATION_CATEGORY_UPDATE', 'SYSTEM', 'Cập nhật danh mục thông báo'),
('PERM_NOTI_CAT_DELETE', 'NOTIFICATION_CATEGORY_DELETE', 'SYSTEM', 'Xóa danh mục thông báo'),
('PERM_NOTI_ROLE_CONFIG_VIEW', 'NOTIFICATION_ROLE_CONFIG_VIEW', 'SYSTEM', 'Xem cấu hình thông báo theo role'),
('PERM_NOTI_ROLE_CONFIG_UPDATE', 'NOTIFICATION_ROLE_CONFIG_UPDATE', 'SYSTEM', 'Cập nhật cấu hình thông báo theo role')

ON CONFLICT (code) DO NOTHING;

-- BƯỚC 1.5: ĐẢM BẢO CÁC ROLE MỚI TỒN TẠI (ROLE_PHARMACIST, ROLE_STAFF)
INSERT INTO roles (roles_id, code, name, description, is_system) VALUES
('ROLE_PHARMACIST', 'PHARMACIST', 'Dược sĩ', 'Nhân viên phụ trách nhà thuốc', FALSE),
('ROLE_STAFF', 'STAFF', 'Nhân viên cơ sở', 'Nhân viên quản lý tại cơ sở y tế', FALSE)
ON CONFLICT (roles_id) DO NOTHING;

-- BƯỚC 2: PHÂN BỔ QUYỀN CHO ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_ADMIN', permissions_id FROM permissions
WHERE code NOT IN (
    SELECT p.code FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.permissions_id 
    WHERE rp.role_id = 'ROLE_ADMIN'
)
ON CONFLICT DO NOTHING;

-- BƯỚC 3: PHÂN BỔ QUYỀN CHO DOCTOR
-- Bác sĩ có thể: Xem dịch vụ, Xem chuyên khoa, Xem thuốc, Xem nhóm thuốc, Xem cơ sở, Xem cấu hình cá nhân (nếu có)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_DOCTOR', permissions_id FROM permissions
WHERE code IN (
    'SERVICE_VIEW', 'FACILITY_SERVICE_VIEW', 
    'DRUG_VIEW', 'DRUG_CATEGORY_VIEW', 
    'SPECIALTY_VIEW', 'FACILITY_VIEW', 'MODULE_VIEW'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 'ROLE_DOCTOR' AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;

-- BƯỚC 4: PHÂN BỔ QUYỀN CHO NURSE
-- Y tá có thể: Xem dịch vụ, Cập nhật trạng thái nhỏ (nếu có sau này), Khám/nhập dữ liệu (sẽ mở rộng sau), v.v.
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_NURSE', permissions_id FROM permissions
WHERE code IN (
    'SERVICE_VIEW', 'FACILITY_SERVICE_VIEW', 
    'DRUG_VIEW', 'DRUG_CATEGORY_VIEW', 
    'SPECIALTY_VIEW', 'FACILITY_VIEW', 'MODULE_VIEW'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 'ROLE_NURSE' AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;

-- BƯỚC 5: PHÂN BỔ QUYỀN CHO PHARMACIST (Dược sĩ)
-- Dược sĩ có thể: Quản lý thuốc tại cơ sở
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_PHARMACIST', permissions_id FROM permissions
WHERE code IN (
    'DRUG_VIEW', 'DRUG_CATEGORY_VIEW', 'DRUG_UPDATE', 'DRUG_IMPORT', 'DRUG_EXPORT',
    'SPECIALTY_VIEW', 'FACILITY_VIEW', 'MODULE_VIEW'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 'ROLE_PHARMACIST' AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;

-- BƯỚC 6: PHÂN BỔ QUYỀN CHO STAFF (Nhân viên Quản lý cơ sở)
-- Staff (Quản lý cấp cơ sở) có thể: Xem/Sửa/Thêm/Xóa dịch vụ tại cơ sở của họ, xuất nhập thuốc, vv
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_STAFF', permissions_id FROM permissions
WHERE code IN (
    'SERVICE_VIEW', 'SERVICE_UPDATE', 'SERVICE_EXPORT', 'SERVICE_IMPORT', 'SERVICE_DELETE',
    'FACILITY_SERVICE_VIEW', 'FACILITY_SERVICE_CREATE', 'FACILITY_SERVICE_UPDATE', 'FACILITY_SERVICE_DELETE', 'FACILITY_SERVICE_IMPORT', 'FACILITY_SERVICE_EXPORT',
    'DRUG_VIEW', 'DRUG_CATEGORY_VIEW', 'DRUG_UPDATE', 'DRUG_DELETE',
    'SPECIALTY_VIEW', 'FACILITY_VIEW', 'MODULE_VIEW'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 'ROLE_STAFF' AND rp.permission_id = permissions.permissions_id
)
ON CONFLICT DO NOTHING;
