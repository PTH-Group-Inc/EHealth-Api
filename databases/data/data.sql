
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

-- 5. Thêm Dịch vụ Cơ sở (Facility Services)
INSERT INTO facility_services (facility_services_id, facility_id, department_id, code, name, base_price, insurance_price, estimated_duration_minutes) VALUES
('SRV_KHAMNOI', 'FAC_01', 'DEPT_HCM_NOI', 'KHAM_NOI', 'Khám Nội Tổng Quát', 200000, 50000, 15),
('SRV_KHAMNHI', 'FAC_01', 'DEPT_HCM_NHI', 'KHAM_NHI', 'Khám Nhi Khoa', 250000, 50000, 15),
('SRV_SA_BUNG', 'FAC_01', NULL, 'SA_BUNG', 'Siêu âm ổ bụng', 300000, 100000, 20),
('SRV_XN_MAU', 'FAC_01', 'DEPT_HCM_XN', 'XN_MAU_CB', 'Xét nghiệm Máu Cơ Bản', 150000, 30000, 10);

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
    ('SCP_006', 'ADMIN', 'WORKING_HOURS')
ON CONFLICT (role_code, module) DO NOTHING;



