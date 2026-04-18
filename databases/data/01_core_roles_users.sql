-- =====================================================================
-- SEED DATA: MODULE 1 - ROLES, USERS, PROFILES, MENUS
-- =====================================================================
-- Thứ tự chạy: SAU db_clean.sql, TRƯỚC các file khác
-- Password mặc định cho tất cả: Admin@123 (bcrypt hash)
-- =====================================================================

BEGIN;

-- *********************************************************************
-- 1. VAI TRÒ (ROLES) - 6 vai trò hệ thống
-- *********************************************************************
INSERT INTO roles (roles_id, code, name, description, is_system, status) VALUES
('ROLE_ADMIN',      'ADMIN',      'Quản trị viên',    'Quản trị toàn bộ hệ thống, cấu hình phân quyền', TRUE, 'ACTIVE'),
('ROLE_DOCTOR',     'DOCTOR',     'Bác sĩ',           'Khám bệnh, kê đơn, chẩn đoán, quản lý bệnh án', TRUE, 'ACTIVE'),
('ROLE_NURSE',      'NURSE',      'Y tá / Điều dưỡng','Hỗ trợ bác sĩ, chăm sóc bệnh nhân, đo sinh hiệu', TRUE, 'ACTIVE'),
('ROLE_PHARMACIST', 'PHARMACIST', 'Dược sĩ',          'Quản lý thuốc, cấp phát, kiểm soát kho dược phẩm', TRUE, 'ACTIVE'),
('ROLE_STAFF',      'STAFF',      'Nhân viên',         'Lễ tân, hành chính, tiếp nhận bệnh nhân', TRUE, 'ACTIVE'),
('ROLE_PATIENT',    'PATIENT',    'Bệnh nhân',         'Đặt lịch khám, xem kết quả, thanh toán trực tuyến', TRUE, 'ACTIVE');

-- *********************************************************************
-- 2. TÀI KHOẢN NHÂN VIÊN (USERS) - 29 nhân viên
-- Password: Admin@123 => bcrypt hash
-- *********************************************************************
INSERT INTO users (users_id, email, phone_number, password_hash, status) VALUES
-- ── 1 Admin ──
('USR_ADMIN_01', 'admin@ehealth.vn', '0901000001', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
-- ── 10 Bác sĩ ──
('USR_DOC_01', 'bs.nguyenvana@ehealth.vn',    '0901100001', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_02', 'bs.tranthib@ehealth.vn',      '0901100002', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_03', 'bs.levanc@ehealth.vn',        '0901100003', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_04', 'bs.phamthid@ehealth.vn',      '0901100004', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_05', 'bs.hoangvane@ehealth.vn',     '0901100005', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_06', 'bs.vuthif@ehealth.vn',        '0901100006', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_07', 'bs.dangvang@ehealth.vn',      '0901100007', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_08', 'bs.buithih@ehealth.vn',       '0901100008', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_09', 'bs.ngothii@ehealth.vn',       '0901100009', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_DOC_10', 'bs.dovank@ehealth.vn',        '0901100010', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
-- ── 10 Y tá / Điều dưỡng ──
('USR_NUR_01', 'yt.nguyenthil@ehealth.vn',    '0901200001', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_02', 'yt.tranvanm@ehealth.vn',      '0901200002', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_03', 'yt.lethin@ehealth.vn',        '0901200003', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_04', 'yt.phamvano@ehealth.vn',      '0901200004', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_05', 'yt.hoangthip@ehealth.vn',     '0901200005', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_06', 'yt.vuvanq@ehealth.vn',        '0901200006', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_07', 'yt.dangthir@ehealth.vn',      '0901200007', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_08', 'yt.buivans@ehealth.vn',       '0901200008', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_09', 'yt.ngothit@ehealth.vn',       '0901200009', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_NUR_10', 'yt.dovanu@ehealth.vn',        '0901200010', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
-- ── 3 Dược sĩ ──
('USR_PHA_01', 'ds.nguyenvanv@ehealth.vn',    '0901300001', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_PHA_02', 'ds.tranthiw@ehealth.vn',      '0901300002', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_PHA_03', 'ds.levanx@ehealth.vn',        '0901300003', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
-- ── 5 Nhân viên (Lễ tân, Hành chính) ──
('USR_STF_01', 'nv.phamthiy@ehealth.vn',      '0901400001', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_STF_02', 'nv.hoangvanz@ehealth.vn',     '0901400002', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_STF_03', 'nv.vuthiaa@ehealth.vn',       '0901400003', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_STF_04', 'nv.dangvanbb@ehealth.vn',     '0901400004', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE'),
('USR_STF_05', 'nv.buithicc@ehealth.vn',      '0901400005', '$2b$10$y.aR5SesAQoafDXvBPesl.DLra4SI28YsjsKI.CCx7j0jgnIsRM2K', 'ACTIVE');

-- *********************************************************************
-- 3. HỒ SƠ NHÂN VIÊN (USER_PROFILES) - 29 profiles
-- *********************************************************************
INSERT INTO user_profiles (user_profiles_id, user_id, full_name, dob, gender, identity_card_number, address) VALUES
-- Admin
('PROF_ADMIN_01', 'USR_ADMIN_01', 'Trần Minh Quản',       '1985-03-15', 'MALE',   '079185001234', '10 Lý Tự Trọng, Q.1, TP.HCM'),
-- Bác sĩ
('PROF_DOC_01',   'USR_DOC_01',   'BS. Nguyễn Văn An',     '1978-05-20', 'MALE',   '079178005678', '25 Pasteur, Q.3, TP.HCM'),
('PROF_DOC_02',   'USR_DOC_02',   'BS. Trần Thị Bình',     '1982-08-12', 'FEMALE', '079182008901', '42 Nguyễn Huệ, Q.1, TP.HCM'),
('PROF_DOC_03',   'USR_DOC_03',   'BS. Lê Văn Cường',      '1975-11-03', 'MALE',   '079175002345', '18 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM'),
('PROF_DOC_04',   'USR_DOC_04',   'BS. Phạm Thị Diệu',    '1980-02-28', 'FEMALE', '079180006789', '55 Cách Mạng Tháng 8, Q.3, TP.HCM'),
('PROF_DOC_05',   'USR_DOC_05',   'BS. Hoàng Văn Em',      '1983-07-14', 'MALE',   '079183003456', '72 Hai Bà Trưng, Q.1, TP.HCM'),
('PROF_DOC_06',   'USR_DOC_06',   'BS. Vũ Thị Phương',     '1979-12-05', 'FEMALE', '079179007890', '30 Lê Lợi, Q.1, TP.HCM'),
('PROF_DOC_07',   'USR_DOC_07',   'BS. Đặng Văn Giang',    '1976-09-18', 'MALE',   '079176004567', '88 Trần Hưng Đạo, Q.5, TP.HCM'),
('PROF_DOC_08',   'USR_DOC_08',   'BS. Bùi Thị Hạnh',      '1984-04-22', 'FEMALE', '079184008012', '15 Nguyễn Trãi, Q.5, TP.HCM'),
('PROF_DOC_09',   'USR_DOC_09',   'BS. Ngô Thị Hương',     '1981-06-07', 'FEMALE', '079181005678', '63 Võ Văn Tần, Q.3, TP.HCM'),
('PROF_DOC_10',   'USR_DOC_10',   'BS. Đỗ Văn Khoa',       '1977-01-30', 'MALE',   '079177009012', '120 Nam Kỳ Khởi Nghĩa, Q.1, TP.HCM'),
-- Y tá
('PROF_NUR_01',   'USR_NUR_01',   'ĐD. Nguyễn Thị Lan',    '1990-03-10', 'FEMALE', '079190001234', '45 Bùi Viện, Q.1, TP.HCM'),
('PROF_NUR_02',   'USR_NUR_02',   'ĐD. Trần Văn Minh',     '1992-07-25', 'MALE',   '079192002345', '78 Phạm Ngũ Lão, Q.1, TP.HCM'),
('PROF_NUR_03',   'USR_NUR_03',   'ĐD. Lê Thị Ngọc',       '1991-11-08', 'FEMALE', '079191003456', '22 Cao Thắng, Q.3, TP.HCM'),
('PROF_NUR_04',   'USR_NUR_04',   'ĐD. Phạm Văn Oanh',     '1993-02-14', 'MALE',   '079193004567', '56 Lý Chính Thắng, Q.3, TP.HCM'),
('PROF_NUR_05',   'USR_NUR_05',   'ĐD. Hoàng Thị Phụng',   '1989-05-30', 'FEMALE', '079189005678', '33 Nguyễn Thông, Q.3, TP.HCM'),
('PROF_NUR_06',   'USR_NUR_06',   'ĐD. Vũ Văn Quốc',       '1994-08-17', 'MALE',   '079194006789', '67 Trường Sa, Q.Phú Nhuận, TP.HCM'),
('PROF_NUR_07',   'USR_NUR_07',   'ĐD. Đặng Thị Rạng',     '1990-12-02', 'FEMALE', '079190007890', '91 Hoàng Sa, Q.Tân Bình, TP.HCM'),
('PROF_NUR_08',   'USR_NUR_08',   'ĐD. Bùi Văn Sơn',       '1995-04-11', 'MALE',   '079195008901', '14 Nguyễn Văn Trỗi, Q.Phú Nhuận, TP.HCM'),
('PROF_NUR_09',   'USR_NUR_09',   'ĐD. Ngô Thị Thảo',      '1991-09-23', 'FEMALE', '079191009012', '48 Phan Xích Long, Q.Phú Nhuận, TP.HCM'),
('PROF_NUR_10',   'USR_NUR_10',   'ĐD. Đỗ Văn Uy',         '1988-01-06', 'MALE',   '079188001122', '75 Nguyễn Kiệm, Q.Gò Vấp, TP.HCM'),
-- Dược sĩ
('PROF_PHA_01',   'USR_PHA_01',   'DS. Nguyễn Văn Vinh',   '1986-06-19', 'MALE',   '079186002233', '38 Lê Văn Sỹ, Q.Tân Bình, TP.HCM'),
('PROF_PHA_02',   'USR_PHA_02',   'DS. Trần Thị Xuân',     '1988-10-14', 'FEMALE', '079188003344', '52 Trần Quốc Thảo, Q.3, TP.HCM'),
('PROF_PHA_03',   'USR_PHA_03',   'DS. Lê Văn Yên',        '1990-03-28', 'MALE',   '079190004455', '19 Nguyễn Đình Chiểu, Q.3, TP.HCM'),
-- Nhân viên
('PROF_STF_01',   'USR_STF_01',   'Phạm Thị Yến',          '1995-01-12', 'FEMALE', '079195005566', '85 Ba Tháng Hai, Q.10, TP.HCM'),
('PROF_STF_02',   'USR_STF_02',   'Hoàng Văn Zũng',        '1993-04-08', 'MALE',   '079193006677', '27 Sư Vạn Hạnh, Q.10, TP.HCM'),
('PROF_STF_03',   'USR_STF_03',   'Vũ Thị An An',          '1996-07-21', 'FEMALE', '079196007788', '61 Tô Hiến Thành, Q.10, TP.HCM'),
('PROF_STF_04',   'USR_STF_04',   'Đặng Văn Bảo Bình',     '1994-11-05', 'MALE',   '079194008899', '43 Thành Thái, Q.10, TP.HCM'),
('PROF_STF_05',   'USR_STF_05',   'Bùi Thị Cẩm Chi',       '1997-02-18', 'FEMALE', '079197009900', '36 Lý Thường Kiệt, Q.Tân Bình, TP.HCM');

-- *********************************************************************
-- 4. GÁN VAI TRÒ CHO NHÂN VIÊN (USER_ROLES)
-- *********************************************************************
INSERT INTO user_roles (user_id, role_id) VALUES
('USR_ADMIN_01', 'ROLE_ADMIN'),
('USR_DOC_01',   'ROLE_DOCTOR'), ('USR_DOC_02', 'ROLE_DOCTOR'), ('USR_DOC_03', 'ROLE_DOCTOR'),
('USR_DOC_04',   'ROLE_DOCTOR'), ('USR_DOC_05', 'ROLE_DOCTOR'), ('USR_DOC_06', 'ROLE_DOCTOR'),
('USR_DOC_07',   'ROLE_DOCTOR'), ('USR_DOC_08', 'ROLE_DOCTOR'), ('USR_DOC_09', 'ROLE_DOCTOR'),
('USR_DOC_10',   'ROLE_DOCTOR'),
('USR_NUR_01',   'ROLE_NURSE'),  ('USR_NUR_02', 'ROLE_NURSE'),  ('USR_NUR_03', 'ROLE_NURSE'),
('USR_NUR_04',   'ROLE_NURSE'),  ('USR_NUR_05', 'ROLE_NURSE'),  ('USR_NUR_06', 'ROLE_NURSE'),
('USR_NUR_07',   'ROLE_NURSE'),  ('USR_NUR_08', 'ROLE_NURSE'),  ('USR_NUR_09', 'ROLE_NURSE'),
('USR_NUR_10',   'ROLE_NURSE'),
('USR_PHA_01',   'ROLE_PHARMACIST'), ('USR_PHA_02', 'ROLE_PHARMACIST'), ('USR_PHA_03', 'ROLE_PHARMACIST'),
('USR_STF_01',   'ROLE_STAFF'),  ('USR_STF_02', 'ROLE_STAFF'),  ('USR_STF_03', 'ROLE_STAFF'),
('USR_STF_04',   'ROLE_STAFF'),  ('USR_STF_05', 'ROLE_STAFF');

-- *********************************************************************
-- 5. MENU SIDEBAR (MENUS) - 15 menu items
-- *********************************************************************
INSERT INTO menus (menus_id, code, name, url, icon, parent_id, sort_order, status) VALUES
-- Menu cấp 1
('MENU_DASHBOARD',    'DASHBOARD',          'Tổng quan',                '/dashboard',        'dashboard',      NULL,              1, 'ACTIVE'),
('MENU_PATIENT_MGT',  'PATIENT_MANAGEMENT', 'Quản lý Bệnh nhân',       '/patients',         'people',         NULL,              2, 'ACTIVE'),
('MENU_APPOINTMENT',  'APPOINTMENT',        'Lịch khám',                '/appointments',     'calendar_today', NULL,              3, 'ACTIVE'),
('MENU_EMR',          'EMR',                'Bệnh án điện tử',          '/emr',              'medical_services',NULL,             4, 'ACTIVE'),
('MENU_PHARMACY',     'PHARMACY',           'Quản lý Dược',             '/pharmacy',         'medication',     NULL,              5, 'ACTIVE'),
('MENU_FACILITY',     'FACILITY',           'Cơ sở y tế',              '/facilities',       'apartment',      NULL,              6, 'ACTIVE'),
('MENU_STAFF_HR',     'STAFF_HR',           'Nhân sự y tế',            '/staff',            'badge',          NULL,              7, 'ACTIVE'),
('MENU_SERVICE',      'SERVICE',            'Dịch vụ y tế',            '/services',         'medical_information', NULL,          8, 'ACTIVE'),
('MENU_BILLING',      'BILLING',            'Thanh toán',               '/billing',          'payments',       NULL,              9, 'ACTIVE'),
('MENU_REPORT',       'REPORT',             'Báo cáo',                  '/reports',          'bar_chart',      NULL,             10, 'ACTIVE'),
('MENU_SYSTEM',       'SYSTEM',             'Hệ thống',                 '/system',           'settings',       NULL,             11, 'ACTIVE'),
-- Menu cấp 2 thuộc Hệ thống
('MENU_USER_MGT',     'USER_MANAGEMENT',    'Quản lý người dùng',       '/system/users',     'group',          'MENU_SYSTEM',    1, 'ACTIVE'),
('MENU_ROLE_MGT',     'ROLE_MANAGEMENT',    'Phân quyền',               '/system/roles',     'admin_panel_settings','MENU_SYSTEM',2, 'ACTIVE'),
('MENU_API_GUARD',    'API_GUARD',          'API Guard',                 '/system/api-guard', 'security',       'MENU_SYSTEM',    3, 'ACTIVE'),
('MENU_AUDIT',        'AUDIT',              'Nhật ký hệ thống',         '/system/audit-logs','history',        'MENU_SYSTEM',    4, 'ACTIVE');

-- *********************************************************************
-- 6. GÁN MENU CHO VAI TRÒ (ROLE_MENUS)
-- *********************************************************************
INSERT INTO role_menus (role_id, menu_id) VALUES
-- ADMIN: Toàn bộ menu
('ROLE_ADMIN', 'MENU_DASHBOARD'),    ('ROLE_ADMIN', 'MENU_PATIENT_MGT'),
('ROLE_ADMIN', 'MENU_APPOINTMENT'),  ('ROLE_ADMIN', 'MENU_EMR'),
('ROLE_ADMIN', 'MENU_PHARMACY'),     ('ROLE_ADMIN', 'MENU_FACILITY'),
('ROLE_ADMIN', 'MENU_STAFF_HR'),     ('ROLE_ADMIN', 'MENU_SERVICE'),
('ROLE_ADMIN', 'MENU_BILLING'),      ('ROLE_ADMIN', 'MENU_REPORT'),
('ROLE_ADMIN', 'MENU_SYSTEM'),       ('ROLE_ADMIN', 'MENU_USER_MGT'),
('ROLE_ADMIN', 'MENU_ROLE_MGT'),     ('ROLE_ADMIN', 'MENU_API_GUARD'),
('ROLE_ADMIN', 'MENU_AUDIT'),
-- DOCTOR
('ROLE_DOCTOR', 'MENU_DASHBOARD'),   ('ROLE_DOCTOR', 'MENU_PATIENT_MGT'),
('ROLE_DOCTOR', 'MENU_APPOINTMENT'), ('ROLE_DOCTOR', 'MENU_EMR'),
('ROLE_DOCTOR', 'MENU_PHARMACY'),    ('ROLE_DOCTOR', 'MENU_REPORT'),
-- NURSE
('ROLE_NURSE', 'MENU_DASHBOARD'),    ('ROLE_NURSE', 'MENU_PATIENT_MGT'),
('ROLE_NURSE', 'MENU_APPOINTMENT'),  ('ROLE_NURSE', 'MENU_EMR'),
('ROLE_NURSE', 'MENU_REPORT'),
-- PHARMACIST
('ROLE_PHARMACIST', 'MENU_DASHBOARD'), ('ROLE_PHARMACIST', 'MENU_PHARMACY'),
('ROLE_PHARMACIST', 'MENU_REPORT'),
-- STAFF
('ROLE_STAFF', 'MENU_DASHBOARD'),    ('ROLE_STAFF', 'MENU_PATIENT_MGT'),
('ROLE_STAFF', 'MENU_APPOINTMENT'),  ('ROLE_STAFF', 'MENU_FACILITY'),
('ROLE_STAFF', 'MENU_SERVICE'),      ('ROLE_STAFF', 'MENU_BILLING'),
('ROLE_STAFF', 'MENU_REPORT'),       ('ROLE_STAFF', 'MENU_STAFF_HR'),
-- PATIENT
('ROLE_PATIENT', 'MENU_DASHBOARD'),  ('ROLE_PATIENT', 'MENU_APPOINTMENT');

COMMIT;
