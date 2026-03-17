-- =====================================================================
-- SEED DATA: MODULE 3 - QUẢN LÝ CƠ SỞ Y TẾ (FACILITY MANAGEMENT)
-- =====================================================================
-- Thứ tự chạy: Sau khi đã có structure DB (db_clean.sql)
-- Bao gồm: facilities, operation_hours, closed_days, holidays,
--           branches, departments, specialties, department_specialties,
--           medical_rooms, booking_configurations
-- =====================================================================

BEGIN;

-- *********************************************************************
-- 1. CƠ SỞ Y TẾ (FACILITIES)
-- *********************************************************************
INSERT INTO facilities (facilities_id, code, name, tax_code, email, phone, website, logo_url, headquarters_address, status)
VALUES (
    'FAC_EHEALTH',
    'EHEALTH-PK',
    'Phòng khám Đa khoa E-Health',
    '0312345678',
    'info@ehealth.vn',
    '028-3800-1234',
    'https://ehealth.vn',
    NULL,
    '123 Nguyễn Thị Minh Khai, Phường Bến Thành, TP. Hồ Chí Minh',
    'ACTIVE'
);

-- *********************************************************************
-- 2. GIỜ HOẠT ĐỘNG (FACILITY OPERATION HOURS)
-- Thứ 2 (1) → Thứ 6 (5): 07:00 - 17:00
-- Thứ 7 (6): 07:00 - 12:00
-- Chủ nhật (0): Nghỉ
-- *********************************************************************
INSERT INTO facility_operation_hours (operation_hours_id, facility_id, day_of_week, open_time, close_time, is_closed) VALUES
('OPH_MON', 'FAC_EHEALTH', 1, '07:00', '17:00', FALSE),
('OPH_TUE', 'FAC_EHEALTH', 2, '07:00', '17:00', FALSE),
('OPH_WED', 'FAC_EHEALTH', 3, '07:00', '17:00', FALSE),
('OPH_THU', 'FAC_EHEALTH', 4, '07:00', '17:00', FALSE),
('OPH_FRI', 'FAC_EHEALTH', 5, '07:00', '17:00', FALSE),
('OPH_SAT', 'FAC_EHEALTH', 6, '07:00', '12:00', FALSE),
('OPH_SUN', 'FAC_EHEALTH', 0, '00:00', '00:00', TRUE);

-- *********************************************************************
-- 3. NGÀY ĐÓNG CỬA ĐỊNH KỲ (FACILITY CLOSED DAYS)
-- Nghỉ chiều Thứ 7 và cả ngày Chủ nhật
-- *********************************************************************
INSERT INTO facility_closed_days (closed_day_id, facility_id, day_of_week, title, start_time, end_time) VALUES
('CD_SAT_PM', 'FAC_EHEALTH', 6, 'Nghỉ chiều Thứ Bảy', '12:00', '17:00'),
('CD_SUN',    'FAC_EHEALTH', 0, 'Nghỉ Chủ nhật',       '00:00', '23:59');

-- *********************************************************************
-- 4. NGÀY LỄ VIỆT NAM 2026 (FACILITY HOLIDAYS)
-- Đầy đủ theo Bộ luật Lao động Việt Nam
-- *********************************************************************
INSERT INTO facility_holidays (holiday_id, facility_id, holiday_date, title, is_closed, special_open_time, special_close_time, description, is_recurring) VALUES
-- Tết Dương lịch
('HOL_NEWYEAR',     'FAC_EHEALTH', '2026-01-01', 'Tết Dương lịch',                    TRUE, NULL, NULL, 'Ngày đầu năm mới Dương lịch (Điều 112 BLLĐ)', TRUE),

-- Tết Nguyên Đán 2026 (Âm lịch: Bính Ngọ)
-- Mùng 1 Tết = 17/02/2026. Nghỉ 5 ngày: 16/02 (29 Tết) → 20/02 (Mùng 4)
('HOL_TET_01',      'FAC_EHEALTH', '2026-02-16', 'Tết Nguyên Đán - 29 Tết',           TRUE, NULL, NULL, 'Ngày cuối năm Âm lịch (Điều 112 BLLĐ)', FALSE),
('HOL_TET_02',      'FAC_EHEALTH', '2026-02-17', 'Tết Nguyên Đán - Mùng 1 Tết',      TRUE, NULL, NULL, 'Mùng 1 Tết Bính Ngọ', FALSE),
('HOL_TET_03',      'FAC_EHEALTH', '2026-02-18', 'Tết Nguyên Đán - Mùng 2 Tết',      TRUE, NULL, NULL, 'Mùng 2 Tết Bính Ngọ', FALSE),
('HOL_TET_04',      'FAC_EHEALTH', '2026-02-19', 'Tết Nguyên Đán - Mùng 3 Tết',      TRUE, NULL, NULL, 'Mùng 3 Tết Bính Ngọ', FALSE),
('HOL_TET_05',      'FAC_EHEALTH', '2026-02-20', 'Tết Nguyên Đán - Mùng 4 Tết',      TRUE, NULL, NULL, 'Mùng 4 Tết Bính Ngọ (ngày nghỉ bù)', FALSE),

-- Giỗ Tổ Hùng Vương (10/3 Âm lịch = 26/04/2026)
('HOL_HUNGVUONG',   'FAC_EHEALTH', '2026-04-26', 'Giỗ Tổ Hùng Vương',                TRUE, NULL, NULL, 'Ngày Giỗ Tổ Hùng Vương 10/3 Âm lịch (Điều 112 BLLĐ)', FALSE),

-- Ngày Thống nhất & Quốc tế Lao động
('HOL_THONGNHAT',   'FAC_EHEALTH', '2026-04-30', 'Ngày Giải phóng miền Nam',          TRUE, NULL, NULL, 'Ngày Giải phóng miền Nam 30/4 (Điều 112 BLLĐ)', TRUE),
('HOL_LAODONG',     'FAC_EHEALTH', '2026-05-01', 'Ngày Quốc tế Lao động',             TRUE, NULL, NULL, 'Ngày Quốc tế Lao động 1/5 (Điều 112 BLLĐ)', TRUE),
('HOL_LAODONG_BU',  'FAC_EHEALTH', '2026-05-02', 'Nghỉ bù Quốc tế Lao động',         TRUE, NULL, NULL, 'Ngày nghỉ bù (do 30/4 rơi vào Thứ Năm, 1/5 Thứ Sáu, nghỉ bù Thứ Bảy)', FALSE),

-- Quốc khánh
('HOL_QUOCKHANH_1', 'FAC_EHEALTH', '2026-09-02', 'Ngày Quốc khánh',                   TRUE, NULL, NULL, 'Ngày Quốc khánh 2/9 (Điều 112 BLLĐ)', TRUE),
('HOL_QUOCKHANH_2', 'FAC_EHEALTH', '2026-09-03', 'Nghỉ bù Quốc khánh',               TRUE, NULL, NULL, 'Ngày nghỉ liền kề Quốc khánh (Điều 112 BLLĐ)', FALSE);

-- *********************************************************************
-- 5. CHI NHÁNH (BRANCHES) - 1 trụ sở chính duy nhất
-- *********************************************************************
INSERT INTO branches (branches_id, facility_id, code, name, address, phone, status, established_date)
VALUES (
    'BR_MAIN',
    'FAC_EHEALTH',
    'BR-HCM-Q1',
    'Trụ sở chính - Quận 1',
    '123 Nguyễn Thị Minh Khai, Phường Bến Thành, TP. Hồ Chí Minh',
    '028-3800-1234',
    'ACTIVE',
    '2020-01-15'
);

-- *********************************************************************
-- 6. PHÒNG BAN / KHOA (DEPARTMENTS) - 10 Khoa chuẩn phòng khám VN
-- group_type: CLINICAL (Lâm sàng) | PARACLINICAL (Cận lâm sàng)
-- *********************************************************************
INSERT INTO departments (departments_id, branch_id, code, name, description, group_type, status) VALUES
-- ── Khối Lâm sàng (7 Khoa) ──
('DEPT_KB',    'BR_MAIN', 'KHOA-KB',    'Khoa Khám bệnh',              'Khoa tiếp nhận, khám sàng lọc và khám bệnh ban đầu cho bệnh nhân ngoại trú', 'CLINICAL', 'ACTIVE'),
('DEPT_NOI',   'BR_MAIN', 'KHOA-NOI',   'Khoa Nội',                    'Khoa chẩn đoán và điều trị các bệnh lý nội khoa: tim mạch, tiêu hóa, hô hấp, nội tiết, thận', 'CLINICAL', 'ACTIVE'),
('DEPT_NGOAI', 'BR_MAIN', 'KHOA-NGOAI', 'Khoa Ngoại',                  'Khoa phẫu thuật và điều trị các bệnh lý ngoại khoa: tổng quát, chấn thương chỉnh hình, tiết niệu', 'CLINICAL', 'ACTIVE'),
('DEPT_SAN',   'BR_MAIN', 'KHOA-SAN',   'Khoa Sản',                    'Khoa quản lý thai kỳ, đỡ đẻ, chăm sóc sản phụ và trẻ sơ sinh, phụ khoa', 'CLINICAL', 'ACTIVE'),
('DEPT_NHI',   'BR_MAIN', 'KHOA-NHI',   'Khoa Nhi',                    'Khoa khám và điều trị bệnh lý ở trẻ em từ sơ sinh đến 16 tuổi, tiêm chủng', 'CLINICAL', 'ACTIVE'),
('DEPT_CC',    'BR_MAIN', 'KHOA-CC',    'Khoa Cấp cứu',               'Khoa tiếp nhận và xử trí cấp cứu các trường hợp nguy kịch 24/7', 'CLINICAL', 'ACTIVE'),
('DEPT_ICU',   'BR_MAIN', 'KHOA-ICU',   'Khoa Hồi sức tích cực (ICU)','Khoa hồi sức cấp cứu, chăm sóc đặc biệt cho bệnh nhân nặng cần theo dõi liên tục', 'CLINICAL', 'ACTIVE'),
-- ── Khối Cận lâm sàng (3 Khoa) ──
('DEPT_XN',    'BR_MAIN', 'KHOA-XN',    'Khoa Xét nghiệm',            'Khoa thực hiện các xét nghiệm huyết học, sinh hóa, vi sinh, miễn dịch phục vụ chẩn đoán', 'PARACLINICAL', 'ACTIVE'),
('DEPT_CDHA',  'BR_MAIN', 'KHOA-CDHA',  'Khoa Chẩn đoán hình ảnh',    'Khoa thực hiện X-quang, CT Scanner, MRI, siêu âm phục vụ chẩn đoán bệnh', 'PARACLINICAL', 'ACTIVE'),
('DEPT_DUOC',  'BR_MAIN', 'KHOA-DUOC',  'Khoa Dược',                   'Khoa quản lý kho thuốc, cấp phát thuốc ngoại trú/nội trú, kiểm soát chất lượng dược phẩm', 'PARACLINICAL', 'ACTIVE');

-- *********************************************************************
-- 7. CHUYÊN KHOA (SPECIALTIES) - Danh mục chuyên khoa y tế
-- *********************************************************************
INSERT INTO specialties (specialties_id, code, name, description) VALUES
-- Khối Lâm sàng (Clinical)
('SPC_TONG_QUAT', 'TONG-QUAT',  'Đa khoa Tổng quát',       'Khám và điều trị các bệnh lý thông thường, sàng lọc sức khỏe tổng quát'),
('SPC_NOI',       'NOI-KHOA',   'Nội khoa',                 'Chẩn đoán và điều trị nội khoa: tim mạch, tiêu hóa, hô hấp, nội tiết, thận-tiết niệu'),
('SPC_NGOAI',     'NGOAI-KHOA', 'Ngoại khoa',               'Phẫu thuật và điều trị các bệnh lý cần can thiệp ngoại khoa'),
('SPC_SAN',       'SAN-KHOA',   'Sản - Phụ khoa',           'Quản lý thai kỳ, đỡ đẻ, chăm sóc sản phụ, khám và điều trị bệnh phụ khoa'),
('SPC_NHI',       'NHI-KHOA',   'Nhi khoa',                 'Khám và điều trị bệnh lý ở trẻ em từ sơ sinh đến 16 tuổi'),
('SPC_CC',        'CAP-CUU',    'Cấp cứu',                  'Xử trí cấp cứu các trường hợp đe dọa tính mạng và chấn thương nặng'),
('SPC_HSCC',      'HOI-SUC',    'Hồi sức cấp cứu',          'Hồi sức tích cực, chăm sóc đặc biệt cho bệnh nhân nặng, thở máy'),
-- Khối Cận lâm sàng (Paraclinical)
('SPC_XN',        'XET-NGHIEM', 'Xét nghiệm',               'Thực hiện xét nghiệm huyết học, sinh hóa, vi sinh, miễn dịch hỗ trợ chẩn đoán'),
('SPC_CDHA',      'CDHA',       'Chẩn đoán hình ảnh',       'X-quang, CT Scanner, MRI, siêu âm chẩn đoán hình ảnh y khoa'),
('SPC_DUOC',      'DUOC',       'Dược',                      'Quản lý dược phẩm, tư vấn sử dụng thuốc, kiểm soát tương tác thuốc');

-- *********************************************************************
-- 8. LIÊN KẾT KHOA ↔ CHUYÊN KHOA (DEPARTMENT_SPECIALTIES)
-- *********************************************************************
INSERT INTO department_specialties (department_specialty_id, department_id, specialty_id) VALUES
('DS_KB_TQ',    'DEPT_KB',    'SPC_TONG_QUAT'),
('DS_NOI',      'DEPT_NOI',   'SPC_NOI'),
('DS_NGOAI',    'DEPT_NGOAI', 'SPC_NGOAI'),
('DS_SAN',      'DEPT_SAN',   'SPC_SAN'),
('DS_NHI',      'DEPT_NHI',   'SPC_NHI'),
('DS_CC',       'DEPT_CC',    'SPC_CC'),
('DS_ICU',      'DEPT_ICU',   'SPC_HSCC'),
('DS_XN',       'DEPT_XN',    'SPC_XN'),
('DS_CDHA',     'DEPT_CDHA',  'SPC_CDHA'),
('DS_DUOC',     'DEPT_DUOC',  'SPC_DUOC');

-- *********************************************************************
-- 9. PHÒNG KHÁM / PHÒNG CHỨC NĂNG (MEDICAL ROOMS)
-- 47 phòng tổng cộng, phân bổ theo 10 Khoa
-- room_type: CONSULTATION, LAB, IMAGING, OPERATING, PROCEDURE,
--            INPATIENT, OBSERVATION, EMERGENCY, ICU, PHARMACY
-- *********************************************************************

-- ═══════════════════════════════════════
-- 9.1  Khoa Khám bệnh (5 phòng)
-- ═══════════════════════════════════════
INSERT INTO medical_rooms (medical_rooms_id, department_id, branch_id, code, name, room_type, capacity, status) VALUES
('ROOM_KB_01', 'DEPT_KB', 'BR_MAIN', 'KB-P01', 'Phòng khám tổng quát',          'CONSULTATION', 2, 'ACTIVE'),
('ROOM_KB_02', 'DEPT_KB', 'BR_MAIN', 'KB-P02', 'Phòng khám chuyên khoa',        'CONSULTATION', 2, 'ACTIVE'),
('ROOM_KB_03', 'DEPT_KB', 'BR_MAIN', 'KB-P03', 'Phòng đo sinh hiệu',            'CONSULTATION', 3, 'ACTIVE'),
('ROOM_KB_04', 'DEPT_KB', 'BR_MAIN', 'KB-P04', 'Phòng lấy mẫu xét nghiệm',     'LAB',          4, 'ACTIVE'),
('ROOM_KB_05', 'DEPT_KB', 'BR_MAIN', 'KB-P05', 'Phòng tư vấn',                  'CONSULTATION', 2, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.2  Khoa Nội (4 phòng)
-- ═══════════════════════════════════════
('ROOM_NOI_01', 'DEPT_NOI', 'BR_MAIN', 'NOI-P01', 'Phòng khám nội',              'CONSULTATION', 2, 'ACTIVE'),
('ROOM_NOI_02', 'DEPT_NOI', 'BR_MAIN', 'NOI-P02', 'Phòng điều trị nội trú',      'INPATIENT',    6, 'ACTIVE'),
('ROOM_NOI_03', 'DEPT_NOI', 'BR_MAIN', 'NOI-P03', 'Phòng theo dõi bệnh nhân',    'OBSERVATION',  4, 'ACTIVE'),
('ROOM_NOI_04', 'DEPT_NOI', 'BR_MAIN', 'NOI-P04', 'Phòng thủ thuật',             'PROCEDURE',    2, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.3  Khoa Ngoại (5 phòng)
-- ═══════════════════════════════════════
('ROOM_NGOAI_01', 'DEPT_NGOAI', 'BR_MAIN', 'NGOAI-P01', 'Phòng khám ngoại',                          'CONSULTATION', 2, 'ACTIVE'),
('ROOM_NGOAI_02', 'DEPT_NGOAI', 'BR_MAIN', 'NGOAI-P02', 'Phòng tiền phẫu',                           'OBSERVATION',  3, 'ACTIVE'),
('ROOM_NGOAI_03', 'DEPT_NGOAI', 'BR_MAIN', 'NGOAI-P03', 'Phòng mổ',                                  'OPERATING',    1, 'ACTIVE'),
('ROOM_NGOAI_04', 'DEPT_NGOAI', 'BR_MAIN', 'NGOAI-P04', 'Phòng hậu phẫu',                            'OBSERVATION',  4, 'ACTIVE'),
('ROOM_NGOAI_05', 'DEPT_NGOAI', 'BR_MAIN', 'NGOAI-P05', 'Phòng thay băng – xử lý vết thương',        'PROCEDURE',    3, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.4  Khoa Sản (5 phòng)
-- ═══════════════════════════════════════
('ROOM_SAN_01', 'DEPT_SAN', 'BR_MAIN', 'SAN-P01', 'Phòng khám thai',             'CONSULTATION', 2, 'ACTIVE'),
('ROOM_SAN_02', 'DEPT_SAN', 'BR_MAIN', 'SAN-P02', 'Phòng siêu âm thai',          'IMAGING',      2, 'ACTIVE'),
('ROOM_SAN_03', 'DEPT_SAN', 'BR_MAIN', 'SAN-P03', 'Phòng sinh',                  'OPERATING',    2, 'ACTIVE'),
('ROOM_SAN_04', 'DEPT_SAN', 'BR_MAIN', 'SAN-P04', 'Phòng hậu sản',              'INPATIENT',    4, 'ACTIVE'),
('ROOM_SAN_05', 'DEPT_SAN', 'BR_MAIN', 'SAN-P05', 'Phòng chăm sóc trẻ sơ sinh', 'OBSERVATION',  6, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.5  Khoa Nhi (4 phòng)
-- ═══════════════════════════════════════
('ROOM_NHI_01', 'DEPT_NHI', 'BR_MAIN', 'NHI-P01', 'Phòng khám nhi',                'CONSULTATION', 2, 'ACTIVE'),
('ROOM_NHI_02', 'DEPT_NHI', 'BR_MAIN', 'NHI-P02', 'Phòng điều trị nội trú nhi',    'INPATIENT',    6, 'ACTIVE'),
('ROOM_NHI_03', 'DEPT_NHI', 'BR_MAIN', 'NHI-P03', 'Phòng tiêm chủng',              'PROCEDURE',    4, 'ACTIVE'),
('ROOM_NHI_04', 'DEPT_NHI', 'BR_MAIN', 'NHI-P04', 'Phòng theo dõi trẻ bệnh nặng', 'OBSERVATION',  3, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.6  Khoa Cấp cứu (5 phòng)
-- ═══════════════════════════════════════
('ROOM_CC_01', 'DEPT_CC', 'BR_MAIN', 'CC-P01', 'Phòng tiếp nhận cấp cứu',    'EMERGENCY',    3, 'ACTIVE'),
('ROOM_CC_02', 'DEPT_CC', 'BR_MAIN', 'CC-P02', 'Phòng cấp cứu',              'EMERGENCY',    4, 'ACTIVE'),
('ROOM_CC_03', 'DEPT_CC', 'BR_MAIN', 'CC-P03', 'Phòng hồi sức cấp cứu',      'ICU',          3, 'ACTIVE'),
('ROOM_CC_04', 'DEPT_CC', 'BR_MAIN', 'CC-P04', 'Phòng xử lý chấn thương',    'PROCEDURE',    2, 'ACTIVE'),
('ROOM_CC_05', 'DEPT_CC', 'BR_MAIN', 'CC-P05', 'Phòng theo dõi sau cấp cứu', 'OBSERVATION',  4, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.7  Khoa Hồi sức tích cực - ICU (4 phòng)
-- ═══════════════════════════════════════
('ROOM_ICU_01', 'DEPT_ICU', 'BR_MAIN', 'ICU-P01', 'Phòng Hồi sức',                'ICU',         4, 'ACTIVE'),
('ROOM_ICU_02', 'DEPT_ICU', 'BR_MAIN', 'ICU-P02', 'Phòng theo dõi đặc biệt',      'OBSERVATION', 3, 'ACTIVE'),
('ROOM_ICU_03', 'DEPT_ICU', 'BR_MAIN', 'ICU-P03', 'Phòng kiểm soát nhiễm khuẩn',  'PROCEDURE',   2, 'ACTIVE'),
('ROOM_ICU_04', 'DEPT_ICU', 'BR_MAIN', 'ICU-P04', 'Phòng thiết bị hồi sức',       'ICU',         2, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.8  Khoa Xét nghiệm (5 phòng)
-- ═══════════════════════════════════════
('ROOM_XN_01', 'DEPT_XN', 'BR_MAIN', 'XN-P01', 'Phòng xét nghiệm huyết học', 'LAB', 3, 'ACTIVE'),
('ROOM_XN_02', 'DEPT_XN', 'BR_MAIN', 'XN-P02', 'Phòng sinh hóa',             'LAB', 3, 'ACTIVE'),
('ROOM_XN_03', 'DEPT_XN', 'BR_MAIN', 'XN-P03', 'Phòng vi sinh',              'LAB', 2, 'ACTIVE'),
('ROOM_XN_04', 'DEPT_XN', 'BR_MAIN', 'XN-P04', 'Phòng miễn dịch',            'LAB', 2, 'ACTIVE'),
('ROOM_XN_05', 'DEPT_XN', 'BR_MAIN', 'XN-P05', 'Phòng lấy mẫu',             'LAB', 4, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.9  Khoa Chẩn đoán hình ảnh (5 phòng)
-- ═══════════════════════════════════════
('ROOM_CDHA_01', 'DEPT_CDHA', 'BR_MAIN', 'CDHA-P01', 'Phòng X-quang (X-ray)',            'IMAGING', 1, 'ACTIVE'),
('ROOM_CDHA_02', 'DEPT_CDHA', 'BR_MAIN', 'CDHA-P02', 'Phòng chụp CT Scanner',            'IMAGING', 1, 'ACTIVE'),
('ROOM_CDHA_03', 'DEPT_CDHA', 'BR_MAIN', 'CDHA-P03', 'Phòng chụp cộng hưởng từ (MRI)',   'IMAGING', 1, 'ACTIVE'),
('ROOM_CDHA_04', 'DEPT_CDHA', 'BR_MAIN', 'CDHA-P04', 'Phòng siêu âm',                    'IMAGING', 2, 'ACTIVE'),
('ROOM_CDHA_05', 'DEPT_CDHA', 'BR_MAIN', 'CDHA-P05', 'Phòng đọc kết quả hình ảnh',       'IMAGING', 3, 'ACTIVE'),

-- ═══════════════════════════════════════
-- 9.10 Khoa Dược (5 phòng)
-- ═══════════════════════════════════════
('ROOM_DUOC_01', 'DEPT_DUOC', 'BR_MAIN', 'DUOC-P01', 'Kho thuốc chính',                     'PHARMACY', 2, 'ACTIVE'),
('ROOM_DUOC_02', 'DEPT_DUOC', 'BR_MAIN', 'DUOC-P02', 'Phòng cấp phát thuốc ngoại trú',      'PHARMACY', 3, 'ACTIVE'),
('ROOM_DUOC_03', 'DEPT_DUOC', 'BR_MAIN', 'DUOC-P03', 'Phòng cấp phát thuốc nội trú',        'PHARMACY', 2, 'ACTIVE'),
('ROOM_DUOC_04', 'DEPT_DUOC', 'BR_MAIN', 'DUOC-P04', 'Phòng kiểm kê thuốc',                 'PHARMACY', 2, 'ACTIVE'),
('ROOM_DUOC_05', 'DEPT_DUOC', 'BR_MAIN', 'DUOC-P05', 'Phòng quản lý thuốc đặc biệt (GKSH)','PHARMACY', 1, 'ACTIVE');

-- *********************************************************************
-- 10. CẤU HÌNH ĐẶT LỊCH (BOOKING CONFIGURATIONS)
-- *********************************************************************
INSERT INTO booking_configurations (config_id, facility_id, branch_id, max_patients_per_slot, buffer_duration, advance_booking_days, minimum_booking_hours, cancellation_allowed_hours)
VALUES (
    'BKCFG_MAIN',
    'FAC_EHEALTH',
    'BR_MAIN',
    3,    -- Tối đa 3 bệnh nhân / slot
    5,    -- Đệm 5 phút giữa các slot
    30,   -- Đặt trước tối đa 30 ngày
    2,    -- Đặt trước tối thiểu 2 giờ
    24    -- Hủy trước 24 giờ
);

COMMIT;

-- =====================================================================
-- THỐNG KÊ SEED DATA
-- =====================================================================
-- facilities:              1 cơ sở
-- facility_operation_hours: 7 bản ghi (T2-CN)
-- facility_closed_days:     2 bản ghi (chiều T7, CN)
-- facility_holidays:       12 ngày lễ (Tết Dương lịch, Tết Nguyên Đán 5 ngày,
--                              Giỗ Tổ Hùng Vương, 30/4, 1/5, nghỉ bù,
--                              Quốc khánh 2/9, nghỉ bù)
-- branches:                 1 chi nhánh (trụ sở chính)
-- departments:             10 khoa
-- specialties:             10 chuyên khoa
-- department_specialties:  10 liên kết
-- medical_rooms:           47 phòng
-- booking_configurations:   1 cấu hình
-- =====================================================================
