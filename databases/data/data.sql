
-- 1. KHỞI TẠO DANH VAI TRÒ (ROLES)
INSERT INTO roles (roles_id, code, name, description, is_system) VALUES
('ROLE_ADMIN', 'ADMIN', 'Quản trị viên Hệ thống', 'Quản trị toàn quyền hệ thống', TRUE),
('ROLE_DOCTOR', 'DOCTOR', 'Bác sĩ chuyên khoa', 'Bác sĩ thực hiện khám và điều trị', TRUE),
('ROLE_NURSE', 'NURSE', 'Điều dưỡng', 'Hỗ trợ bác sĩ và chăm sóc sức khỏe', TRUE),
('ROLE_PATIENT', 'PATIENT', 'Bệnh nhân', 'Bệnh nhân khám trực tiếp tại phòng khám', TRUE),
('ROLE_CUSTOMER', 'CUSTOMER', 'Khách hàng', 'Người dùng hệ thống đặt lịch khám (có thể chưa làm hồ sơ)', TRUE);

-- 2. KHỞI TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
-- Mật khẩu mặc định là: Admin@123
INSERT INTO users (users_id, email, password_hash, status) VALUES 
('USR_ADMIN_01', 'admin@ehealth.com', '$2b$10$R0GcZwTCHCXpOJrjivZG0ec78wUYii4vRfVsMCz7415iQjZUb/DP.', 'ACTIVE');

-- 3. KHỞI TẠO HỒ SƠ ADMIN
INSERT INTO user_profiles (user_profiles_id, user_id, full_name) VALUES 
('UPRF_ADMIN_01', 'USR_ADMIN_01', 'System Administrator');

-- 4. PHÂN QUYỀN ADMIN (Gán QUYỀN ADMIN)
('USR_ADMIN_01', 'ROLE_ADMIN');

-- =========================================================================
-- MOCK DATA: QUẢN LÝ CƠ SỞ Y TẾ (FACILITY MANAGEMENT)
-- =========================================================================

-- 1. Thêm Cơ sở y tế (Facilities)
INSERT INTO facilities (facilities_id, code, name, tax_code, email, phone, headquarters_address) VALUES
('FAC_01', 'EHEALTH_VN', 'Hệ thống Y tế E-Health Việt Nam', '0101234567', 'contact@ehealth.vn', '19001515', '123 Nguyễn Văn Linh, Quận 7, TP.HCM');

-- 2. Thêm Chi nhánh (Branches)
INSERT INTO branches (branches_id, facility_id, code, name, address, phone, established_date) VALUES
('BR_HCM_01', 'FAC_01', 'HCM_Q7', 'Phòng khám Đa khoa E-Health Quận 7', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', '02873001111', '2020-01-01'),
('BR_HN_01', 'FAC_01', 'HN_CG', 'Phòng khám Đa khoa E-Health Cầu Giấy', '456 Cầu Giấy, Hà Nội', '02473002222', '2021-06-15');

-- 3. Thêm Phòng ban / Khoa (Departments)
INSERT INTO departments (departments_id, branch_id, code, name, description) VALUES
('DEPT_HCM_NOI', 'BR_HCM_01', 'KHOA_NOI_HCM', 'Khoa Nội Tổng Hợp', 'Khám các bệnh lý nội khoa'),
('DEPT_HCM_NHI', 'BR_HCM_01', 'KHOA_NHI_HCM', 'Khoa Nhi', 'Khám bệnh lý trẻ em'),
('DEPT_HCM_XN', 'BR_HCM_01', 'KHOA_XN_HCM', 'Khoa Xét Nghiệm', 'Thực hiện xét nghiệm huyết học, sinh hóa'),
('DEPT_HN_NOI', 'BR_HN_01', 'KHOA_NOI_HN', 'Khoa Nội Tổng Hợp', 'Khám các bệnh lý nội khoa');

-- 4. Thêm Phòng khám / Phòng chức năng (Medical Rooms)
INSERT INTO medical_rooms (medical_rooms_id, department_id, code, name, room_type, capacity) VALUES
('RM_HCM_N101', 'DEPT_HCM_NOI', 'P101', 'Phòng Khám Nội 1', 'CONSULTATION', 1),
('RM_HCM_N102', 'DEPT_HCM_NOI', 'P102', 'Phòng Khám Nội 2', 'CONSULTATION', 1),
('RM_HCM_NHI1', 'DEPT_HCM_NHI', 'P201', 'Phòng Khám Nhi 1', 'CONSULTATION', 1),
('RM_HCM_XN1', 'DEPT_HCM_XN', 'LAB_01', 'Phòng Lấy Máu Xét Nghiệm', 'LAB', 3),
('RM_HN_N101', 'DEPT_HN_NOI', 'P101_HN', 'Phòng Khám Nội HN', 'CONSULTATION', 1);

-- 5. Thêm Dịch vụ Chuẩn Quốc Gia (Master Services)
INSERT INTO services (services_id, code, name, service_group, description) VALUES
('SRV_MASTER_KHAMNOI', 'KHAM_NOI', 'Khám Nội Tổng Quát', 'KHAM', 'Khám bệnh lý nội khoa'),
('SRV_MASTER_KHAMNHI', 'KHAM_NHI', 'Khám Nhi Khoa', 'KHAM', 'Khám bệnh lý nhi khoa'),
('SRV_MASTER_SA_BUNG', 'SA_BUNG', 'Siêu âm ổ bụng', 'CDHA', 'Siêu âm ổ bụng tổng quát'),
('SRV_MASTER_XN_MAU', 'XN_MAU_CB', 'Xét nghiệm Máu Cơ Bản', 'XN', 'Công thức máu, đường huyết, mỡ máu')
ON CONFLICT (code) DO NOTHING;

-- 5.1 Thêm Dịch vụ Cơ sở (Facility Services)
INSERT INTO facility_services (facility_services_id, facility_id, service_id, department_id, base_price, insurance_price, estimated_duration_minutes) VALUES
('FSRV_KHAMNOI', 'FAC_01', 'SRV_MASTER_KHAMNOI', 'DEPT_HCM_NOI', 200000, 50000, 15),
('FSRV_KHAMNHI', 'FAC_01', 'SRV_MASTER_KHAMNHI', 'DEPT_HCM_NHI', 250000, 50000, 15),
('FSRV_SA_BUNG', 'FAC_01', 'SRV_MASTER_SA_BUNG', NULL, 300000, 100000, 20),
('FSRV_XN_MAU', 'FAC_01', 'SRV_MASTER_XN_MAU', 'DEPT_HCM_XN', 150000, 30000, 10)
ON CONFLICT (facility_id, service_id) DO NOTHING;

-- 6. Thêm Thiết bị y tế (Medical Equipment)
INSERT INTO medical_equipment (equipment_id, medical_room_id, code, name, manufacturer, status) VALUES
('EQ_SA_01', 'RM_HCM_N101', 'SA_PHILIPS_01', 'Máy Siêu Âm Philips Affiniti 70', 'Philips', 'ACTIVE'),
('EQ_XN_01', 'RM_HCM_XN1', 'XN_ROCHE_01', 'Hệ thống xét nghiệm miễn dịch Roche', 'Roche', 'ACTIVE');

-- 7. Thêm Giường bệnh (Hospital Beds) cho Khoa Nội
INSERT INTO hospital_beds (beds_id, medical_room_id, code, bed_type, status) VALUES
('BED_HCM_01', 'RM_HCM_N101', 'G01', 'STANDARD', 'AVAILABLE'),
('BED_HCM_02', 'RM_HCM_N101', 'G02', 'STANDARD', 'AVAILABLE'),
('BED_HCM_03', 'RM_HCM_N102', 'G03', 'STANDARD', 'OCCUPIED');

-- 8. KHỞI TẠO QUYỀN HẠN (PERMISSIONS)
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_USER_VIEW', 'USER_VIEW', 'USER_MANAGEMENT', 'Xem danh sách và chi tiết người dùng'),
('PERM_USER_CREATE', 'USER_CREATE', 'USER_MANAGEMENT', 'Tạo tài khoản người dùng mới'),
('PERM_USER_UPDATE', 'USER_UPDATE', 'USER_MANAGEMENT', 'Cập nhật thông tin người dùng'),
('PERM_USER_DELETE', 'USER_DELETE', 'USER_MANAGEMENT', 'Xóa người dùng'),

('PERM_ROLE_VIEW', 'ROLE_VIEW', 'ROLE_MANAGEMENT', 'Xem danh sách và hệ thống vai trò'),
('PERM_ROLE_CREATE', 'ROLE_CREATE', 'ROLE_MANAGEMENT', 'Tạo vai trò mới'),
('PERM_ROLE_UPDATE', 'ROLE_UPDATE', 'ROLE_MANAGEMENT', 'Cập nhật vai trò'),
('PERM_ROLE_DELETE', 'ROLE_DELETE', 'ROLE_MANAGEMENT', 'Xóa vai trò'),

('PERM_PERM_VIEW', 'PERMISSION_VIEW', 'PERMISSION_MANAGEMENT', 'Xem danh sách hệ thống quyền hạn'),
('PERM_PERM_CREATE', 'PERMISSION_CREATE', 'PERMISSION_MANAGEMENT', 'Thiết lập quyền hạn mới'),
('PERM_PERM_UPDATE', 'PERMISSION_UPDATE', 'PERMISSION_MANAGEMENT', 'Cập nhật mô tả quyền'),
('PERM_PERM_DELETE', 'PERMISSION_DELETE', 'PERMISSION_MANAGEMENT', 'Xóa quyền hệ thống'),

('PERM_FAC_VIEW', 'FACILITY_VIEW', 'FACILITY_MANAGEMENT', 'Xem danh sách cơ sở, chi nhánh'),
('PERM_FAC_UPDATE', 'FACILITY_UPDATE', 'FACILITY_MANAGEMENT', 'Cập nhật sơ đồ cơ sở y tế'),

('PERM_PATIENT_VIEW', 'PATIENT_VIEW', 'PATIENT_MANAGEMENT', 'Xem hồ sơ bệnh án bệnh nhân'),
('PERM_PATIENT_CREATE', 'PATIENT_CREATE', 'PATIENT_MANAGEMENT', 'Thêm mới hoặc tiếp nhận bệnh nhân'),
('PERM_PATIENT_UPDATE', 'PATIENT_UPDATE', 'PATIENT_MANAGEMENT', 'Cập nhật hồ sơ bệnh án'),

('PERM_APP_VIEW', 'APPOINTMENT_VIEW', 'APPOINTMENT_MANAGEMENT', 'Xem danh sách lịch hẹn'),
('PERM_APP_CREATE', 'APPOINTMENT_CREATE', 'APPOINTMENT_MANAGEMENT', 'Đặt lịch khám / tiếp nhận'),
('PERM_APP_UPDATE', 'APPOINTMENT_UPDATE', 'APPOINTMENT_MANAGEMENT', 'Cập nhật trạng thái lịch hẹn');

-- 9. Danh mục Menu (menus)
INSERT INTO menus (menus_id, code, name, icon, url, sort_order)
VALUES
    ('MENU_DASHBOARD', 'DASHBOARD', 'Bảng điều khiển', 'dashboard-icon', '/dashboard', 1),
    ('MENU_USER_MANAGEMENT', 'USER_MANAGEMENT', 'Quản trị Người dùng', 'users-icon', '/users', 2),
    ('MENU_PATIENT_MANAGEMENT', 'PATIENT_MANAGEMENT', 'Quản lý Bệnh nhân', 'patients-icon', '/patients', 3),
    ('MENU_APPOINTMENT', 'APPOINTMENT', 'Quản lý Lịch hẹn', 'calendar-icon', '/appointments', 4),
    ('MENU_PRESCRIPTION', 'PRESCRIPTION', 'Quản lý Đơn thuốc', 'pill-icon', '/prescriptions', 5),
    ('MENU_INVENTORY', 'INVENTORY', 'Quản lý Kho thuốc', 'box-icon', '/inventory', 6),
    ('MENU_REPORT', 'REPORT', 'Báo cáo Thống kê', 'chart-icon', '/reports', 7),
    ('MENU_SYSTEM_SETTINGS', 'SYSTEM_SETTINGS', 'Cấu hình Hệ thống', 'settings-icon', '/settings', 8)
ON CONFLICT (code) DO NOTHING;

-- 10. Gán toàn bộ Menu cho Role SYSTEM_ADMIN
INSERT INTO role_menus (role_id, menu_id)
SELECT 'ROLE_ADMIN', menus_id FROM menus
ON CONFLICT DO NOTHING;

-- 11. Custom API Permissions Danh mục API mẫu
INSERT INTO api_permissions (api_id, method, endpoint, description, module)
VALUES
    ('API_USER_GET', 'GET', '/api/users', 'Xem danh sách người dùng', 'USER_MANAGEMENT'),
    ('API_USER_POST', 'POST', '/api/users', 'Tạo tài khoản', 'USER_MANAGEMENT'),
    ('API_PATIENT_GET', 'GET', '/api/patients', 'Xem danh sách bệnh nhân', 'PATIENT_MANAGEMENT'),
    ('API_APP_POST', 'POST', '/api/appointments', 'Tạo lịch hẹn', 'APPOINTMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 12. Gán quyền API cho Role ADMIN
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_ADMIN', api_id FROM api_permissions
ON CONFLICT DO NOTHING;

-- 13. Migration: Thêm cột module vào system_settings (nếu DB đã tồn tại)
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS module VARCHAR(100) DEFAULT 'GENERAL';

-- 14. Seed: 8 Business Rules mặc định
INSERT INTO system_settings (system_settings_id, setting_key, setting_value, module, description)
VALUES
    ('SS_BR_001', 'CANCEL_APPOINTMENT_BEFORE_HOURS',     '{"value": 24}',   'APPOINTMENT', 'Bệnh nhân phải hủy lịch trước ít nhất N giờ'),
    ('SS_BR_002', 'MAX_BOOKING_PER_DAY_PER_PATIENT',     '{"value": 3}',    'APPOINTMENT', 'Số lịch đặt tối đa mỗi ngày của 1 bệnh nhân'),
    ('SS_BR_003', 'MAX_ADVANCE_BOOKING_DAYS',            '{"value": 30}',   'APPOINTMENT', 'Đặt lịch khám trước tối đa N ngày'),
    ('SS_BR_004', 'MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY', '{"value": 20}',   'APPOINTMENT', 'Tổng số lịch hẹn tối đa của 1 bác sĩ trong 1 ngày'),
    ('SS_BR_005', 'ALLOW_PATIENT_SELF_CANCEL',           '{"value": true}', 'APPOINTMENT', 'Cho phép bệnh nhân tự hủy lịch qua ứng dụng'),
    ('SS_BR_006', 'MAX_LOGIN_ATTEMPTS',                  '{"value": 7}',    'SECURITY',    'Số lần đăng nhập sai tối đa trước khi khóa tài khoản'),
    ('SS_BR_007', 'LOCK_ACCOUNT_DURATION_MINUTES',       '{"value": 30}',   'SECURITY',    'Thời gian khóa tài khoản sau khi đăng nhập sai quá số lần cho phép (phút)'),
    ('SS_BR_008', 'REQUIRE_EMAIL_VERIFICATION',          '{"value": true}', 'SECURITY',    'Bắt buộc xác thực email sau khi đăng ký tài khoản')
ON CONFLICT (setting_key) DO NOTHING;

-- 15. Seed: 5 Security Settings mới (1.4.4)
INSERT INTO system_settings (system_settings_id, setting_key, setting_value, module, description)
VALUES
    ('SS_SEC_001', 'PASSWORD_MIN_LENGTH',         '{"value": 8}',   'SECURITY', 'Độ dài mật khẩu tối thiểu (ký tự)'),
    ('SS_SEC_002', 'SESSION_DURATION_DAYS',       '{"value": 14}',  'SECURITY', 'Thời hạn phiên đăng nhập (ngày)'),
    ('SS_SEC_003', 'REQUIRE_2FA_ROLES',           '{"value": []}',  'SECURITY', 'Danh sách role bắt buộc xác thực 2 bước'),
    ('SS_SEC_004', 'ACCESS_TOKEN_EXPIRY_MINUTES', '{"value": 15}',  'SECURITY', 'Thời hạn Access Token (phút)'),
    ('SS_SEC_005', 'REFRESH_TOKEN_EXPIRY_DAYS',   '{"value": 14}',  'SECURITY', 'Thời hạn Refresh Token (ngày)')
ON CONFLICT (setting_key) DO NOTHING;

-- 16. Seed: Cấu hình đa ngôn ngữ (1.4.5)
INSERT INTO system_settings (system_settings_id, setting_key, setting_value, module, description)
VALUES
    ('SS_I18N_001', 'DEFAULT_LANGUAGE',    '{"value": "vi"}',         'I18N', 'Ngôn ngữ mặc định của hệ thống'),
    ('SS_I18N_002', 'SUPPORTED_LANGUAGES', '{"value": ["vi", "en"]}', 'I18N', 'Danh sách mã ngôn ngữ đang được kích hoạt')
ON CONFLICT (setting_key) DO NOTHING;

-- 17. Seed: Cấu hình hiển thị giao diện chung (1.4.6)
INSERT INTO system_settings (system_settings_id, setting_key, setting_value, module, description)
VALUES
    ('SS_UI_001', 'UI_THEME',         '{"value": "light"}',            'UI', 'Chủ đề giao diện: light, dark, system'),
    ('SS_UI_002', 'UI_PRIMARY_COLOR', '{"value": "#1677FF"}',          'UI', 'Màu sắc chủ đạo (hex #RRGGBB)'),
    ('SS_UI_003', 'UI_FONT_FAMILY',   '{"value": "Inter"}',            'UI', 'Font chữ chính của giao diện'),
    ('SS_UI_004', 'UI_DATE_FORMAT',   '{"value": "DD/MM/YYYY"}',       'UI', 'Định dạng ngày tháng hiển thị'),
    ('SS_UI_005', 'UI_TIMEZONE',      '{"value": "Asia/Ho_Chi_Minh"}', 'UI', 'Múi giờ hệ thống'),
    ('SS_UI_006', 'UI_TIME_FORMAT',   '{"value": "24h"}',              'UI', 'Định dạng giờ: 12h hoặc 24h')
ON CONFLICT (setting_key) DO NOTHING;

-- Migration: thêm cột is_deleted cho soft delete (chạy 1 lần nếu chưa có cột)
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Migration: tạo bảng phân quyền cấu hình (1.4.8)
CREATE TABLE IF NOT EXISTS system_config_permissions (
    id          VARCHAR(50) PRIMARY KEY,
    role_code   VARCHAR(50)  NOT NULL,
    module      VARCHAR(100) NOT NULL,
    updated_by  VARCHAR(50) REFERENCES users(users_id),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_code, module)
);

-- Seed: ADMIN có quyền chỉnh sửa tất cả modules
INSERT INTO system_config_permissions (id, role_code, module) VALUES
    ('SCP_001', 'ADMIN', 'GENERAL'),
    ('SCP_002', 'ADMIN', 'APPOINTMENT'),
    ('SCP_003', 'ADMIN', 'SECURITY'),
    ('SCP_004', 'ADMIN', 'I18N'),
    ('SCP_005', 'ADMIN', 'UI'),
-- =========================================================================
-- MOCK DATA: MASTER DATA (DANH MỤC NỀN)
-- =========================================================================

-- 1. Insert Categories (Nhóm danh mục)
INSERT INTO master_data_categories (master_data_categories_id, code, name, description) VALUES
('MDC_260308_GENDER_a1b2', 'GENDER', 'Giới tính', 'Danh mục giới tính bệnh nhân'),
('MDC_260308_BLOOD_T_c3d4', 'BLOOD_TYPE', 'Nhóm máu', 'Danh mục nhóm máu hệ ABO'),
('MDC_260308_ETHNICI_e5f6', 'ETHNICITY', 'Dân tộc', 'Danh mục dân tộc Việt Nam'),
('MDC_260308_MARTIAL_g7h8', 'MARITAL_STATUS', 'Tình trạng hôn nhân', 'Tình trạng hôn nhân của bệnh nhân')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Items (Chi tiết danh mục)
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order) VALUES
-- Render GENDER items
('MDI_260308_GENDE_MALE_1111', 'GENDER', 'MALE', 'Nam', 1),
('MDI_260308_GENDE_FEMAL_2222', 'GENDER', 'FEMALE', 'Nữ', 2),
('MDI_260308_GENDE_OTHER_3333', 'GENDER', 'OTHER', 'Khác', 3),

-- Render BLOOD_TYPE items
('MDI_260308_BLOOD_A_PLU_4444', 'BLOOD_TYPE', 'A_PLUS', 'A+', 1),
('MDI_260308_BLOOD_A_MIN_5555', 'BLOOD_TYPE', 'A_MINUS', 'A-', 2),
('MDI_260308_BLOOD_B_PLU_6666', 'BLOOD_TYPE', 'B_PLUS', 'B+', 3),
('MDI_260308_BLOOD_B_MIN_7777', 'BLOOD_TYPE', 'B_MINUS', 'B-', 4),
('MDI_260308_BLOOD_O_PLU_8888', 'BLOOD_TYPE', 'O_PLUS', 'O+', 5),
('MDI_260308_BLOOD_O_MIN_9999', 'BLOOD_TYPE', 'O_MINUS', 'O-', 6),
('MDI_260308_BLOOD_AB_PL_0000', 'BLOOD_TYPE', 'AB_PLUS', 'AB+', 7),
('MDI_260308_BLOOD_AB_MI_aaaa', 'BLOOD_TYPE', 'AB_MINUS', 'AB-', 8),

-- Render ETHNICITY items
('MDI_260308_ETHNI_KINH_bbbb', 'ETHNICITY', 'KINH', 'Kinh', 1),
('MDI_260308_ETHNI_TAY_cccc', 'ETHNICITY', 'TAY', 'Tày', 2),
('MDI_260308_ETHNI_THAI_dddd', 'ETHNICITY', 'THAI', 'Thái', 3),
('MDI_260308_ETHNI_MUONG_eeee', 'ETHNICITY', 'MUONG', 'Mường', 4),
('MDI_260308_ETHNI_KHMER_ffff', 'ETHNICITY', 'KHMER', 'Khmer', 5),

-- Render MARITAL_STATUS items
('MDI_260308_MARTI_SINGL_1a2b', 'MARITAL_STATUS', 'SINGLE', 'Độc thân', 1),
('MDI_260308_MARTI_MARRI_3c4d', 'MARITAL_STATUS', 'MARRIED', 'Đ ã kết hôn', 2),
('MDI_260308_MARTI_DIVOR_5e6f', 'MARITAL_STATUS', 'DIVORCED', 'Ly hôn', 3),
('MDI_260308_MARTI_WIDOW_7g8h', 'MARITAL_STATUS', 'WIDOWED', 'Góa', 4)
ON CONFLICT (category_code, code) DO NOTHING;

-- PHARMACY (QUẢN LÝ THUỐC)

-- Migration drug_categories soft delete
ALTER TABLE drug_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 1. Insert Drug Categories
INSERT INTO drug_categories (drug_categories_id, code, name, description) VALUES
('DRC_260308_KS_00000000', 'KS', 'Kháng sinh', 'Thuốc kháng sinh diệt khuẩn'),
('DRC_260308_GD_11111111', 'GD', 'Giảm đau, hạ sốt', 'Thuốc giảm đau, hạ sốt, chống viêm không steroid'),
('DRC_260308_VIT_2222222', 'VIT', 'Vitamin & Khoáng chất', 'Thực phẩm chức năng, Vitamin')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Drugs
INSERT INTO drugs (drugs_id, drug_code, national_drug_code, brand_name, active_ingredients, category_id, route_of_administration, dispensing_unit, is_prescription_only, is_active) VALUES
-- Kháng sinh (ETC)
('DRG_260308_aaaabbbbcccc', 'DRG_AUG_1g', 'VN-12345-19', 'Augmentin 1g', 'Amoxicillin 875mg, Acid Clavulanic 125mg', 'DRC_260308_KS_00000000', 'ORAL', 'Viên', true, true),
('DRG_260308_ddddeeeeffff', 'DRG_ZIN_500', 'VN-54321-20', 'Zinnat 500mg', 'Cefuroxim axetil 500mg', 'DRC_260308_KS_00000000', 'ORAL', 'Viên', true, true),

-- Giảm đau (OTC)
('DRG_260308_111122223333', 'DRG_PANA_X', 'VN-98765-21', 'Panadol Extra', 'Paracetamol 500mg, Caffeine 65mg', 'DRC_260308_GD_11111111', 'ORAL', 'Viên', false, true),
('DRG_260308_444455556666', 'DRG_EFE_500', 'VN-11111-20', 'Efferalgan 500mg', 'Paracetamol 500mg', 'DRC_260308_GD_11111111', 'ORAL', 'Viên sủi', false, true),

-- Vitamin (OTC)
('DRG_260308_ababcdcdcdcd', 'DRG_CB_C1000', 'VN-22222-22', 'Berocca', 'Vitamin B, Vitamin C, Canxi, Magie', 'DRC_260308_VIT_2222222', 'ORAL', 'Viên sủi', false, true)
ON CONFLICT (drug_code) DO NOTHING;

-- =========================================================================
-- MOCK DATA: BỔ SUNG QUYỀN HẠN MỚI (PHARMACY & SPECIALTY & CONFIG)
-- =========================================================================

INSERT INTO permissions (permissions_id, code, module, description) VALUES
-- Pharmacy: Danh mục thuốc
('PERM_DRUGCAT_VIEW', 'DRUG_CATEGORY_VIEW', 'PHARMACY_MANAGEMENT', 'Xem danh sách nhóm thuốc'),
('PERM_DRUGCAT_CREATE', 'DRUG_CATEGORY_CREATE', 'PHARMACY_MANAGEMENT', 'Tạo mới nhóm thuốc'),
('PERM_DRUGCAT_UPDATE', 'DRUG_CATEGORY_UPDATE', 'PHARMACY_MANAGEMENT', 'Cập nhật nhóm thuốc'),
('PERM_DRUGCAT_DELETE', 'DRUG_CATEGORY_DELETE', 'PHARMACY_MANAGEMENT', 'Xóa nhóm thuốc'),
('PERM_DRUGCAT_IMPORT', 'DRUG_CATEGORY_IMPORT', 'PHARMACY_MANAGEMENT', 'Import Excel nhóm thuốc'),
('PERM_DRUGCAT_EXPORT', 'DRUG_CATEGORY_EXPORT', 'PHARMACY_MANAGEMENT', 'Export Excel nhóm thuốc'),

-- Pharmacy: Thuốc
('PERM_DRUG_VIEW', 'DRUG_VIEW', 'PHARMACY_MANAGEMENT', 'Xem thông tin thuốc active'),
('PERM_DRUG_VIEW_ALL', 'DRUG_VIEW_ALL', 'PHARMACY_MANAGEMENT', 'Xem toàn bộ thông tin thuốc (Admin)'),
('PERM_DRUG_CREATE', 'DRUG_CREATE', 'PHARMACY_MANAGEMENT', 'Thêm mới thuốc'),
('PERM_DRUG_UPDATE', 'DRUG_UPDATE', 'PHARMACY_MANAGEMENT', 'Cập nhật thiết lập thuốc'),
('PERM_DRUG_DELETE', 'DRUG_DELETE', 'PHARMACY_MANAGEMENT', 'Xóa thuốc (Ngừng kinh doanh)'),
('PERM_DRUG_IMPORT', 'DRUG_IMPORT', 'PHARMACY_MANAGEMENT', 'Import Excel thuốc'),
('PERM_DRUG_EXPORT', 'DRUG_EXPORT', 'PHARMACY_MANAGEMENT', 'Export Excel thuốc'),

-- Specialty: Chuyên khoa
('PERM_SPC_VIEW', 'SPECIALTY_VIEW', 'SPECIALTY_MANAGEMENT', 'Xem thông tin chuyên khoa active'),
('PERM_SPC_VIEW_ALL', 'SPECIALTY_VIEW_ALL', 'SPECIALTY_MANAGEMENT', 'Xem toàn bộ danh sách chuyên khoa'),
('PERM_SPC_CREATE', 'SPECIALTY_CREATE', 'SPECIALTY_MANAGEMENT', 'Tạo tài liệu chuyên khoa mới'),
('PERM_SPC_UPDATE', 'SPECIALTY_UPDATE', 'SPECIALTY_MANAGEMENT', 'Sửa đổi mô tả chuyên khoa'),
('PERM_SPC_DELETE', 'SPECIALTY_DELETE', 'SPECIALTY_MANAGEMENT', 'Xóa chuyên khoa')
ON CONFLICT (code) DO NOTHING;

-- Gán toàn bộ Quyền mới nói trên vào ROLE_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_ADMIN', permissions_id FROM permissions
WHERE code LIKE 'DRUG_%' OR code LIKE 'SPECIALTY_%'
ON CONFLICT DO NOTHING;


-- Dọn dẹp dữ liệu rác (nếu cần)
-- DELETE FROM role_api_permissions;
-- DELETE FROM api_permissions;

INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
-- USER MANAGEMENT
('API_GET_USERS', 'GET', '/api/users', 'Lấy danh sách người dùng', 'USER_MANAGEMENT'),
('API_GET_USER_ID', 'GET', '/api/users/:userId', 'Chi tiết người dùng', 'USER_MANAGEMENT'),
('API_GET_PROFILE', 'GET', '/api/profile', 'Xem profile cá nhân', 'USER_MANAGEMENT'),

-- SPECIALTY & PHARMACY &. FACILITY (NHÓM BÁC SĨ, Y TÁ, STAFF THƯỜNG DÙNG)
('API_GET_SPC', 'GET', '/api/specialties', 'Xem chuyên khoa', 'SPECIALTY_MANAGEMENT'),
('API_GET_MEDSRV', 'GET', '/api/medical-services', 'Dịch vụ y tế', 'SERVICE_MANAGEMENT'),
('API_GET_PHARM', 'GET', '/api/pharmacy', 'Quản lý Dược', 'PHARMACY_MANAGEMENT'),
('API_GET_FAC', 'GET', '/api/facilities', 'Xem cơ sở y tế', 'FACILITY_MANAGEMENT'),
('API_GET_MASTER', 'GET', '/api/master-data', 'Xem danh mục nền', 'MASTER_DATA'),

-- POST, PUT, DELETE MẪU CHO MODULE
('API_POST_SPC', 'POST', '/api/specialties', 'Tạo Chuyên khoa', 'SPECIALTY_MANAGEMENT'),
('API_PUT_SPC', 'PUT', '/api/specialties/:id', 'Sửa Chuyên khoa', 'SPECIALTY_MANAGEMENT'),
('API_POST_PHARM', 'POST', '/api/pharmacy', 'Tạo Lô thuốc', 'PHARMACY_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- BƯỚC QUAN TRỌNG NHẤT: Bổ sung Role API Permissions (Gán Endpoint cho Role)
-- 1. ROLE DOCTOR (Được Xem và Khám)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_DOCTOR', api_id FROM api_permissions 
WHERE module IN ('SPECIALTY_MANAGEMENT', 'FACILITY_MANAGEMENT', 'USER_MANAGEMENT', 'MASTER_DATA');

-- 2. ROLE NURSE 
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_NURSE', api_id FROM api_permissions 
WHERE module IN ('SPECIALTY_MANAGEMENT', 'FACILITY_MANAGEMENT', 'USER_MANAGEMENT', 'MASTER_DATA');

-- 3. ROLE PHARMACIST (Dược sĩ được thêm cả nhóm quản lý kho thuốc)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_PHARMACIST', api_id FROM api_permissions 
WHERE module IN ('PHARMACY_MANAGEMENT', 'FACILITY_MANAGEMENT', 'MASTER_DATA');

-- 4. ROLE STAFF (Quyền quản trị cấp cơ sở)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_STAFF', api_id FROM api_permissions 
WHERE module IN ('SERVICE_MANAGEMENT', 'PHARMACY_MANAGEMENT', 'SPECIALTY_MANAGEMENT', 'FACILITY_MANAGEMENT', 'USER_MANAGEMENT', 'MASTER_DATA');

-- 5. ADMIN CHẤP HẾT
INSERT INTO role_api_permissions (role_id, api_id)
SELECT 'ROLE_ADMIN', api_id FROM api_permissions ON CONFLICT DO NOTHING;
