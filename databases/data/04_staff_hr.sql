-- =====================================================================
-- SEED DATA: MODULE 4 - NHÂN SỰ Y TẾ (STAFF & HR)
-- =====================================================================
-- Thứ tự chạy: SAU 01, 01b, 02, 03
-- Bao gồm: user_branch_dept, doctors, user_licenses
-- =====================================================================

BEGIN;

-- *********************************************************************
-- 1. GÁN NHÂN VIÊN VÀO CHI NHÁNH/KHOA (USER_BRANCH_DEPT)
-- 29 nhân viên → BR_MAIN, phân bổ theo chuyên môn
-- *********************************************************************
INSERT INTO user_branch_dept (user_branch_dept_id, user_id, branch_id, department_id, role_title, status) VALUES
-- ── Admin – Quản lý toàn phòng khám ──
('UBD_ADMIN_01', 'USR_ADMIN_01', 'BR_MAIN', NULL,          'Quản trị viên hệ thống',     'ACTIVE'),

-- ── Bác sĩ (10) – Phân bổ theo chuyên khoa ──
('UBD_DOC_01',   'USR_DOC_01',   'BR_MAIN', 'DEPT_KB',     'Bác sĩ Khám bệnh',           'ACTIVE'),
('UBD_DOC_02',   'USR_DOC_02',   'BR_MAIN', 'DEPT_NOI',    'Trưởng khoa Nội',             'ACTIVE'),
('UBD_DOC_03',   'USR_DOC_03',   'BR_MAIN', 'DEPT_NGOAI',  'Trưởng khoa Ngoại',           'ACTIVE'),
('UBD_DOC_04',   'USR_DOC_04',   'BR_MAIN', 'DEPT_SAN',    'Trưởng khoa Sản',             'ACTIVE'),
('UBD_DOC_05',   'USR_DOC_05',   'BR_MAIN', 'DEPT_NHI',    'Trưởng khoa Nhi',             'ACTIVE'),
('UBD_DOC_06',   'USR_DOC_06',   'BR_MAIN', 'DEPT_CC',     'Bác sĩ Cấp cứu',             'ACTIVE'),
('UBD_DOC_07',   'USR_DOC_07',   'BR_MAIN', 'DEPT_ICU',    'Trưởng khoa Hồi sức',   'ACTIVE'),
('UBD_DOC_08',   'USR_DOC_08',   'BR_MAIN', 'DEPT_XN',     'Bác sĩ Xét nghiệm',          'ACTIVE'),
('UBD_DOC_09',   'USR_DOC_09',   'BR_MAIN', 'DEPT_CDHA',   'Bác sĩ Chẩn đoán hình ảnh',  'ACTIVE'),
('UBD_DOC_10',   'USR_DOC_10',   'BR_MAIN', 'DEPT_KB',     'Bác sĩ Khám bệnh',           'ACTIVE'),

-- ── Y tá / Điều dưỡng (10) – Phân bổ theo khoa ──
('UBD_NUR_01',   'USR_NUR_01',   'BR_MAIN', 'DEPT_KB',     'Điều dưỡng trưởng Khoa KB',   'ACTIVE'),
('UBD_NUR_02',   'USR_NUR_02',   'BR_MAIN', 'DEPT_NOI',    'Điều dưỡng Khoa Nội',         'ACTIVE'),
('UBD_NUR_03',   'USR_NUR_03',   'BR_MAIN', 'DEPT_NGOAI',  'Điều dưỡng Khoa Ngoại',       'ACTIVE'),
('UBD_NUR_04',   'USR_NUR_04',   'BR_MAIN', 'DEPT_SAN',    'Điều dưỡng Khoa Sản',         'ACTIVE'),
('UBD_NUR_05',   'USR_NUR_05',   'BR_MAIN', 'DEPT_NHI',    'Điều dưỡng Khoa Nhi',         'ACTIVE'),
('UBD_NUR_06',   'USR_NUR_06',   'BR_MAIN', 'DEPT_CC',     'Điều dưỡng Cấp cứu',         'ACTIVE'),
('UBD_NUR_07',   'USR_NUR_07',   'BR_MAIN', 'DEPT_ICU',    'Điều dưỡng Hồi sức',         'ACTIVE'),
('UBD_NUR_08',   'USR_NUR_08',   'BR_MAIN', 'DEPT_XN',     'Kỹ thuật viên Xét nghiệm',   'ACTIVE'),
('UBD_NUR_09',   'USR_NUR_09',   'BR_MAIN', 'DEPT_CDHA',   'Kỹ thuật viên CĐHA',         'ACTIVE'),
('UBD_NUR_10',   'USR_NUR_10',   'BR_MAIN', 'DEPT_KB',     'Điều dưỡng tiếp nhận',       'ACTIVE'),

-- ── Dược sĩ (3) – Khoa Dược ──
('UBD_PHA_01',   'USR_PHA_01',   'BR_MAIN', 'DEPT_DUOC',   'Trưởng khoa Dược',            'ACTIVE'),
('UBD_PHA_02',   'USR_PHA_02',   'BR_MAIN', 'DEPT_DUOC',   'Dược sĩ cấp phát',           'ACTIVE'),
('UBD_PHA_03',   'USR_PHA_03',   'BR_MAIN', 'DEPT_DUOC',   'Dược sĩ kiểm kê',            'ACTIVE'),

-- ── Nhân viên (5) – Hành chính / Lễ tân ──
('UBD_STF_01',   'USR_STF_01',   'BR_MAIN', 'DEPT_KB',     'Lễ tân tiếp nhận',            'ACTIVE'),
('UBD_STF_02',   'USR_STF_02',   'BR_MAIN', 'DEPT_KB',     'Lễ tân tiếp nhận',            'ACTIVE'),
('UBD_STF_03',   'USR_STF_03',   'BR_MAIN', NULL,          'Nhân viên hành chính',         'ACTIVE'),
('UBD_STF_04',   'USR_STF_04',   'BR_MAIN', NULL,          'Nhân viên kế toán',            'ACTIVE'),
('UBD_STF_05',   'USR_STF_05',   'BR_MAIN', NULL,          'Nhân viên IT hệ thống',        'ACTIVE');

-- *********************************************************************
-- 2. THÔNG TIN BÁC SĨ CHUYÊN KHOA (DOCTORS) - 10 bác sĩ
-- Phí khám theo bậc chuyên môn (VNĐ)
-- *********************************************************************
INSERT INTO doctors (doctors_id, user_id, specialty_id, title, biography, consultation_fee, is_active) VALUES
('DOC_01', 'USR_DOC_01', 'SPC_TONG_QUAT',
    'BS. CKI',
    'Bác sĩ chuyên khoa I Đa khoa, 15 năm kinh nghiệm khám sàng lọc và tư vấn sức khỏe tổng quát. Tốt nghiệp ĐH Y Dược TP.HCM.',
    200000, TRUE),

('DOC_02', 'USR_DOC_02', 'SPC_NOI',
    'TS. BS',
    'Tiến sĩ Y khoa chuyên ngành Nội khoa, 20 năm kinh nghiệm. Chuyên sâu Tim mạch - Nội tiết. Từng tu nghiệp tại Nhật Bản.',
    350000, TRUE),

('DOC_03', 'USR_DOC_03', 'SPC_NGOAI',
    'BS. CKII',
    'Bác sĩ chuyên khoa II Ngoại Tổng quát, 22 năm kinh nghiệm phẫu thuật. Chuyên sâu Chấn thương chỉnh hình và Ngoại tiêu hóa.',
    400000, TRUE),

('DOC_04', 'USR_DOC_04', 'SPC_SAN',
    'ThS. BS',
    'Thạc sĩ Y khoa chuyên ngành Sản Phụ khoa, 18 năm kinh nghiệm. Chuyên sâu Thai kỳ nguy cơ cao, Siêu âm 4D.',
    350000, TRUE),

('DOC_05', 'USR_DOC_05', 'SPC_NHI',
    'PGS. TS',
    'Phó Giáo sư, Tiến sĩ Nhi khoa, 25 năm kinh nghiệm. Chuyên gia về Hô hấp Nhi, nguyên Phó khoa BV Nhi Đồng 1.',
    500000, TRUE),

('DOC_06', 'USR_DOC_06', 'SPC_CC',
    'BS. CKI',
    'Bác sĩ chuyên khoa I Hồi sức Cấp cứu, 12 năm kinh nghiệm cấp cứu đa chấn thương. Chứng chỉ ACLS, ATLS quốc tế.',
    300000, TRUE),

('DOC_07', 'USR_DOC_07', 'SPC_HSCC',
    'BS. CKII',
    'Bác sĩ chuyên khoa II Hồi sức tích cực, 20 năm kinh nghiệm. Chuyên gia thở máy, lọc máu liên tục. Từng tu nghiệp tại Pháp.',
    400000, TRUE),

('DOC_08', 'USR_DOC_08', 'SPC_XN',
    'ThS. BS',
    'Thạc sĩ Y khoa chuyên ngành Huyết học, 14 năm kinh nghiệm xét nghiệm lâm sàng. Chuyên sâu Sinh hóa và Vi sinh.',
    250000, TRUE),

('DOC_09', 'USR_DOC_09', 'SPC_CDHA',
    'BS. CKI',
    'Bác sĩ chuyên khoa I Chẩn đoán hình ảnh, 13 năm kinh nghiệm. Chuyên sâu CT, MRI thần kinh và Siêu âm can thiệp.',
    300000, TRUE),

('DOC_10', 'USR_DOC_10', 'SPC_TONG_QUAT',
    'BS',
    'Bác sĩ Đa khoa, 8 năm kinh nghiệm khám bệnh tổng quát. Tốt nghiệp ĐH Y Dược TP.HCM, đang học CKI.',
    150000, TRUE);

-- *********************************************************************
-- 3. BẰNG CẤP / CHỨNG CHỈ HÀNH NGHỀ (USER_LICENSES)
-- Mỗi nhân viên y tế ít nhất 1 chứng chỉ
-- *********************************************************************
INSERT INTO user_licenses (licenses_id, user_id, license_type, license_number, issue_date, expiry_date, issued_by) VALUES
-- ── Bác sĩ – Chứng chỉ hành nghề (CCHN) ──
('LIC_DOC_01_CCHN', 'USR_DOC_01', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2012-00145', '2012-06-15', '2027-06-15', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_DOC_01_CKI',  'USR_DOC_01', 'BẰNG CHUYÊN KHOA I',              'CKI-DK-2015-00089',  '2015-09-20', NULL,         'Đại học Y Dược TP.HCM'),
('LIC_DOC_02_CCHN', 'USR_DOC_02', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2008-00067', '2008-03-10', '2028-03-10', 'Bộ Y tế'),
('LIC_DOC_02_TS',   'USR_DOC_02', 'BẰNG TIẾN SĨ Y KHOA',            'TS-NK-2014-00023',   '2014-11-25', NULL,         'Đại học Y Dược TP.HCM'),
('LIC_DOC_03_CCHN', 'USR_DOC_03', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2006-00034', '2006-07-01', '2026-07-01', 'Bộ Y tế'),
('LIC_DOC_03_CKII', 'USR_DOC_03', 'BẰNG CHUYÊN KHOA II',             'CKII-NG-2012-00015', '2012-05-18', NULL,         'Đại học Y Dược TP.HCM'),
('LIC_DOC_04_CCHN', 'USR_DOC_04', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2010-00098', '2010-04-22', '2030-04-22', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_DOC_04_THS',  'USR_DOC_04', 'BẰNG THẠC SĨ Y KHOA',            'THS-SK-2013-00041',  '2013-08-15', NULL,         'Đại học Y Hà Nội'),
('LIC_DOC_05_CCHN', 'USR_DOC_05', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2004-00012', '2004-01-10', '2029-01-10', 'Bộ Y tế'),
('LIC_DOC_05_PGS',  'USR_DOC_05', 'CHỨC DANH PHÓ GIÁO SƯ',          'PGS-NH-2018-00007',  '2018-11-20', NULL,         'Hội đồng CDGS Nhà nước'),
('LIC_DOC_06_CCHN', 'USR_DOC_06', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2015-00178', '2015-12-01', '2030-12-01', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_DOC_06_ACLS', 'USR_DOC_06', 'CHỨNG CHỈ ACLS QUỐC TẾ',         'ACLS-INT-2023-0456', '2023-03-15', '2027-03-15', 'American Heart Association'),
('LIC_DOC_07_CCHN', 'USR_DOC_07', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2007-00055', '2007-08-20', '2027-08-20', 'Bộ Y tế'),
('LIC_DOC_08_CCHN', 'USR_DOC_08', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2014-00134', '2014-02-28', '2029-02-28', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_DOC_09_CCHN', 'USR_DOC_09', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2014-00156', '2014-05-10', '2029-05-10', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_DOC_10_CCHN', 'USR_DOC_10', 'CHỨNG CHỈ HÀNH NGHỀ KHÁM BỆNH', 'CCHN-BS-2019-00267', '2019-09-05', '2029-09-05', 'Sở Y tế TP. Hồ Chí Minh'),

-- ── Y tá – Chứng chỉ hành nghề Điều dưỡng ──
('LIC_NUR_01_CCHN', 'USR_NUR_01', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2016-00201', '2016-04-10', '2031-04-10', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_02_CCHN', 'USR_NUR_02', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2018-00215', '2018-06-20', '2033-06-20', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_03_CCHN', 'USR_NUR_03', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2017-00189', '2017-08-15', '2032-08-15', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_04_CCHN', 'USR_NUR_04', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2019-00234', '2019-02-28', '2034-02-28', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_05_CCHN', 'USR_NUR_05', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2015-00145', '2015-11-10', '2030-11-10', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_06_CCHN', 'USR_NUR_06', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2020-00267', '2020-03-25', '2035-03-25', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_07_CCHN', 'USR_NUR_07', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2016-00178', '2016-09-12', '2031-09-12', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_08_CCHN', 'USR_NUR_08', 'CHỨNG CHỈ HÀNH NGHỀ KỸ THUẬT Y', 'CCHN-KT-2021-00089', '2021-01-18', '2036-01-18', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_09_CCHN', 'USR_NUR_09', 'CHỨNG CHỈ HÀNH NGHỀ KỸ THUẬT Y', 'CCHN-KT-2017-00112', '2017-07-05', '2032-07-05', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_NUR_10_CCHN', 'USR_NUR_10', 'CHỨNG CHỈ HÀNH NGHỀ ĐIỀU DƯỠNG', 'CCHN-DD-2014-00098', '2014-12-20', '2029-12-20', 'Sở Y tế TP. Hồ Chí Minh'),

-- ── Dược sĩ – Chứng chỉ hành nghề Dược ──
('LIC_PHA_01_CCHN', 'USR_PHA_01', 'CHỨNG CHỈ HÀNH NGHỀ DƯỢC',       'CCHN-DS-2012-00056', '2012-10-15', '2027-10-15', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_PHA_01_GPP',  'USR_PHA_01', 'CHỨNG CHỈ THỰC HÀNH TỐT NHÀ THUỐC (GPP)', 'GPP-2020-00034', '2020-05-20', '2025-05-20', 'Cục Quản lý Dược - Bộ Y tế'),
('LIC_PHA_02_CCHN', 'USR_PHA_02', 'CHỨNG CHỈ HÀNH NGHỀ DƯỢC',       'CCHN-DS-2015-00078', '2015-03-08', '2030-03-08', 'Sở Y tế TP. Hồ Chí Minh'),
('LIC_PHA_03_CCHN', 'USR_PHA_03', 'CHỨNG CHỈ HÀNH NGHỀ DƯỢC',       'CCHN-DS-2016-00091', '2016-07-22', '2031-07-22', 'Sở Y tế TP. Hồ Chí Minh');

COMMIT;

-- =====================================================================
-- THỐNG KÊ SEED DATA MODULE 4
-- =====================================================================
-- user_branch_dept:  29 bản ghi (gán toàn bộ nhân viên vào BR_MAIN)
-- doctors:           10 bác sĩ (đủ 10 chuyên khoa)
-- user_licenses:     32 chứng chỉ (16 BS + 10 ĐD + 3 KTV + 3 DS)
-- TỔNG:              71 bản ghi
-- =====================================================================
