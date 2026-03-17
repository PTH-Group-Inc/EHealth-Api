-- =====================================================================
-- SEED DATA: MODULE 2 - DANH MỤC NỀN (MASTER DATA)
-- =====================================================================
-- Thứ tự chạy: SAU 01_core_roles_users.sql, 01b_patient_users.sql
-- Bao gồm: master_data_categories, master_data_items, relation_types,
--           document_types, tags
-- =====================================================================

BEGIN;

-- *********************************************************************
-- 1. NHÓM DANH MỤC (MASTER DATA CATEGORIES)
-- 15 nhóm danh mục chính trong hệ thống y tế
-- *********************************************************************
INSERT INTO master_data_categories (master_data_categories_id, code, name, description) VALUES
('MDC_GENDER',          'GENDER',           'Giới tính',                    'Danh mục giới tính theo chuẩn HL7 FHIR'),
('MDC_BLOOD_TYPE',      'BLOOD_TYPE',       'Nhóm máu',                    'Phân loại nhóm máu hệ ABO và Rh'),
('MDC_ETHNICITY',       'ETHNICITY',        'Dân tộc',                     'Danh mục 54 dân tộc Việt Nam (trích chính)'),
('MDC_RELIGION',        'RELIGION',         'Tôn giáo',                    'Danh mục tôn giáo tại Việt Nam'),
('MDC_MARITAL_STATUS',  'MARITAL_STATUS',   'Tình trạng hôn nhân',         'Tình trạng hôn nhân của bệnh nhân'),
('MDC_OCCUPATION',      'OCCUPATION',       'Nghề nghiệp',                 'Danh mục nghề nghiệp phổ biến'),
('MDC_NATIONALITY',     'NATIONALITY',      'Quốc tịch',                   'Danh mục quốc tịch'),
('MDC_PROVINCE',        'PROVINCE',         'Tỉnh/Thành phố',             'Danh mục tỉnh thành trực thuộc TW (trích chính)'),
('MDC_INSURANCE_TYPE',  'INSURANCE_TYPE',   'Loại bảo hiểm',              'Phân loại loại hình bảo hiểm y tế'),
('MDC_ALLERGY_TYPE',    'ALLERGY_TYPE',     'Loại dị ứng',                'Phân loại dị ứng theo nguồn gây dị ứng'),
('MDC_SEVERITY',        'SEVERITY',         'Mức độ nghiêm trọng',        'Phân cấp mức độ nghiêm trọng lâm sàng'),
('MDC_PAYMENT_METHOD',  'PAYMENT_METHOD',   'Phương thức thanh toán',      'Hình thức thanh toán viện phí'),
('MDC_VITAL_SIGN',      'VITAL_SIGN',       'Sinh hiệu',                   'Danh mục các chỉ số sinh hiệu theo dõi'),
('MDC_EDUCATION',       'EDUCATION',        'Trình độ học vấn',            'Danh mục trình độ học vấn'),
('MDC_DISCHARGE_TYPE',  'DISCHARGE_TYPE',   'Hình thức ra viện',           'Phân loại hình thức ra viện/kết thúc khám');

-- *********************************************************************
-- 2. CHI TIẾT DANH MỤC (MASTER DATA ITEMS)
-- Dữ liệu chi tiết theo từng nhóm
-- *********************************************************************

-- ═══════════════════════════════════════
-- 2.1 GIỚI TÍNH (GENDER)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_GENDER_MALE',     'GENDER', 'MALE',    'Nam',            1, TRUE),
('MDI_GENDER_FEMALE',   'GENDER', 'FEMALE',  'Nữ',             2, TRUE),
('MDI_GENDER_OTHER',    'GENDER', 'OTHER',   'Khác',            3, TRUE);

-- ═══════════════════════════════════════
-- 2.2 NHÓM MÁU (BLOOD_TYPE) - Hệ ABO + Rh
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_BT_A_POS',   'BLOOD_TYPE', 'A_POSITIVE',    'A+',   1, TRUE),
('MDI_BT_A_NEG',   'BLOOD_TYPE', 'A_NEGATIVE',    'A-',   2, TRUE),
('MDI_BT_B_POS',   'BLOOD_TYPE', 'B_POSITIVE',    'B+',   3, TRUE),
('MDI_BT_B_NEG',   'BLOOD_TYPE', 'B_NEGATIVE',    'B-',   4, TRUE),
('MDI_BT_AB_POS',  'BLOOD_TYPE', 'AB_POSITIVE',   'AB+',  5, TRUE),
('MDI_BT_AB_NEG',  'BLOOD_TYPE', 'AB_NEGATIVE',   'AB-',  6, TRUE),
('MDI_BT_O_POS',   'BLOOD_TYPE', 'O_POSITIVE',    'O+',   7, TRUE),
('MDI_BT_O_NEG',   'BLOOD_TYPE', 'O_NEGATIVE',    'O-',   8, TRUE);

-- ═══════════════════════════════════════
-- 2.3 DÂN TỘC (ETHNICITY) - 20 dân tộc chính tại Việt Nam
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_ETH_KINH',     'ETHNICITY', 'KINH',      'Kinh',           1, TRUE),
('MDI_ETH_TAY',      'ETHNICITY', 'TAY',       'Tày',            2, TRUE),
('MDI_ETH_THAI',     'ETHNICITY', 'THAI',      'Thái',           3, TRUE),
('MDI_ETH_MUONG',    'ETHNICITY', 'MUONG',     'Mường',          4, TRUE),
('MDI_ETH_KHMER',    'ETHNICITY', 'KHMER',     'Khmer',          5, TRUE),
('MDI_ETH_HOA',      'ETHNICITY', 'HOA',       'Hoa',            6, TRUE),
('MDI_ETH_NUNG',     'ETHNICITY', 'NUNG',      'Nùng',           7, TRUE),
('MDI_ETH_HMONG',    'ETHNICITY', 'HMONG',     'H''Mông',        8, TRUE),
('MDI_ETH_DAO',      'ETHNICITY', 'DAO',       'Dao',            9, TRUE),
('MDI_ETH_GIARAI',   'ETHNICITY', 'GIA_RAI',   'Gia Rai',       10, TRUE),
('MDI_ETH_EDE',      'ETHNICITY', 'E_DE',      'Ê Đê',          11, TRUE),
('MDI_ETH_BANA',     'ETHNICITY', 'BA_NA',     'Ba Na',          12, TRUE),
('MDI_ETH_SANCH',    'ETHNICITY', 'SAN_CHAY',  'Sán Chay',      13, TRUE),
('MDI_ETH_CHAM',     'ETHNICITY', 'CHAM',      'Chăm',           14, TRUE),
('MDI_ETH_CODHO',    'ETHNICITY', 'CO_HO',     'Cơ Ho',          15, TRUE),
('MDI_ETH_XODANG',   'ETHNICITY', 'XO_DANG',   'Xơ Đăng',       16, TRUE),
('MDI_ETH_SANDIU',   'ETHNICITY', 'SAN_DIU',   'Sán Dìu',       17, TRUE),
('MDI_ETH_HROI',     'ETHNICITY', 'HROI',      'Hrê',            18, TRUE),
('MDI_ETH_RAGLAY',   'ETHNICITY', 'RA_GLAI',   'Ra Glai',        19, TRUE),
('MDI_ETH_OTHER',    'ETHNICITY', 'OTHER',     'Dân tộc khác',   20, TRUE);

-- ═══════════════════════════════════════
-- 2.4 TÔN GIÁO (RELIGION)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_REL_NONE',       'RELIGION', 'NONE',         'Không tôn giáo',      1, TRUE),
('MDI_REL_BUDDHISM',   'RELIGION', 'BUDDHISM',     'Phật giáo',           2, TRUE),
('MDI_REL_CATHOLIC',   'RELIGION', 'CATHOLIC',     'Công giáo',           3, TRUE),
('MDI_REL_PROTESTANT', 'RELIGION', 'PROTESTANT',   'Tin Lành',            4, TRUE),
('MDI_REL_CAODAI',     'RELIGION', 'CAO_DAI',      'Cao Đài',             5, TRUE),
('MDI_REL_HOAHAO',     'RELIGION', 'HOA_HAO',      'Hòa Hảo',            6, TRUE),
('MDI_REL_ISLAM',      'RELIGION', 'ISLAM',        'Hồi giáo',           7, TRUE),
('MDI_REL_HINDU',      'RELIGION', 'HINDUISM',     'Ấn Độ giáo',         8, TRUE),
('MDI_REL_OTHER',      'RELIGION', 'OTHER',        'Tôn giáo khác',      9, TRUE);

-- ═══════════════════════════════════════
-- 2.5 TÌNH TRẠNG HÔN NHÂN (MARITAL_STATUS)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_MS_SINGLE',    'MARITAL_STATUS', 'SINGLE',    'Độc thân',          1, TRUE),
('MDI_MS_MARRIED',   'MARITAL_STATUS', 'MARRIED',   'Đã kết hôn',       2, TRUE),
('MDI_MS_DIVORCED',  'MARITAL_STATUS', 'DIVORCED',  'Đã ly hôn',        3, TRUE),
('MDI_MS_WIDOWED',   'MARITAL_STATUS', 'WIDOWED',   'Góa',               4, TRUE),
('MDI_MS_SEPARATED', 'MARITAL_STATUS', 'SEPARATED', 'Ly thân',           5, TRUE);

-- ═══════════════════════════════════════
-- 2.6 NGHỀ NGHIỆP (OCCUPATION) - 20 nghề phổ biến
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_OCC_WORKER',       'OCCUPATION', 'WORKER',         'Công nhân',                1, TRUE),
('MDI_OCC_FARMER',       'OCCUPATION', 'FARMER',         'Nông dân',                 2, TRUE),
('MDI_OCC_OFFICER',      'OCCUPATION', 'OFFICER',        'Công chức / Viên chức',    3, TRUE),
('MDI_OCC_BUSINESS',     'OCCUPATION', 'BUSINESS',       'Kinh doanh / Buôn bán',    4, TRUE),
('MDI_OCC_TEACHER',      'OCCUPATION', 'TEACHER',        'Giáo viên / Giảng viên',   5, TRUE),
('MDI_OCC_DOCTOR',       'OCCUPATION', 'DOCTOR',         'Bác sĩ / Y tá',           6, TRUE),
('MDI_OCC_ENGINEER',     'OCCUPATION', 'ENGINEER',       'Kỹ sư',                    7, TRUE),
('MDI_OCC_DRIVER',       'OCCUPATION', 'DRIVER',         'Lái xe',                    8, TRUE),
('MDI_OCC_STUDENT',      'OCCUPATION', 'STUDENT',        'Học sinh / Sinh viên',      9, TRUE),
('MDI_OCC_RETIRED',      'OCCUPATION', 'RETIRED',        'Hưu trí',                  10, TRUE),
('MDI_OCC_HOMEMAKER',    'OCCUPATION', 'HOMEMAKER',      'Nội trợ',                  11, TRUE),
('MDI_OCC_FREELANCE',    'OCCUPATION', 'FREELANCE',      'Tự do / Freelance',        12, TRUE),
('MDI_OCC_IT',           'OCCUPATION', 'IT',             'Công nghệ thông tin',      13, TRUE),
('MDI_OCC_ACCOUNTANT',   'OCCUPATION', 'ACCOUNTANT',     'Kế toán / Tài chính',      14, TRUE),
('MDI_OCC_LAWYER',       'OCCUPATION', 'LAWYER',         'Luật sư',                  15, TRUE),
('MDI_OCC_MILITARY',     'OCCUPATION', 'MILITARY',       'Quân nhân / Công an',      16, TRUE),
('MDI_OCC_CRAFTSMAN',    'OCCUPATION', 'CRAFTSMAN',      'Thợ thủ công',             17, TRUE),
('MDI_OCC_JOURNALIST',   'OCCUPATION', 'JOURNALIST',     'Nhà báo / Truyền thông',   18, TRUE),
('MDI_OCC_UNEMPLOYED',   'OCCUPATION', 'UNEMPLOYED',     'Thất nghiệp',             19, TRUE),
('MDI_OCC_OTHER',        'OCCUPATION', 'OTHER',          'Nghề khác',                20, TRUE);

-- ═══════════════════════════════════════
-- 2.7 QUỐC TỊCH (NATIONALITY)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_NAT_VN',   'NATIONALITY', 'VN', 'Việt Nam',       1, TRUE),
('MDI_NAT_US',   'NATIONALITY', 'US', 'Hoa Kỳ',         2, TRUE),
('MDI_NAT_JP',   'NATIONALITY', 'JP', 'Nhật Bản',       3, TRUE),
('MDI_NAT_KR',   'NATIONALITY', 'KR', 'Hàn Quốc',      4, TRUE),
('MDI_NAT_CN',   'NATIONALITY', 'CN', 'Trung Quốc',    5, TRUE),
('MDI_NAT_TH',   'NATIONALITY', 'TH', 'Thái Lan',       6, TRUE),
('MDI_NAT_SG',   'NATIONALITY', 'SG', 'Singapore',       7, TRUE),
('MDI_NAT_AU',   'NATIONALITY', 'AU', 'Úc',              8, TRUE),
('MDI_NAT_GB',   'NATIONALITY', 'GB', 'Anh',             9, TRUE),
('MDI_NAT_FR',   'NATIONALITY', 'FR', 'Pháp',           10, TRUE),
('MDI_NAT_DE',   'NATIONALITY', 'DE', 'Đức',            11, TRUE),
('MDI_NAT_OT',   'NATIONALITY', 'OTHER', 'Quốc tịch khác', 12, TRUE);

-- ═══════════════════════════════════════
-- 2.8 TỈNH/THÀNH PHỐ (PROVINCE) - 5 TP trực thuộc TW + 10 tỉnh chính
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_PRV_HCM',    'PROVINCE', 'HCM',       'TP. Hồ Chí Minh',    1, TRUE),
('MDI_PRV_HN',     'PROVINCE', 'HA_NOI',    'TP. Hà Nội',         2, TRUE),
('MDI_PRV_DN',     'PROVINCE', 'DA_NANG',   'TP. Đà Nẵng',       3, TRUE),
('MDI_PRV_HP',     'PROVINCE', 'HAI_PHONG', 'TP. Hải Phòng',     4, TRUE),
('MDI_PRV_CT',     'PROVINCE', 'CAN_THO',   'TP. Cần Thơ',       5, TRUE),
('MDI_PRV_BRVT',   'PROVINCE', 'BA_RIA_VT', 'Bà Rịa - Vũng Tàu',6, TRUE),
('MDI_PRV_BD',     'PROVINCE', 'BINH_DUONG','Bình Dương',          7, TRUE),
('MDI_PRV_DN2',    'PROVINCE', 'DONG_NAI',  'Đồng Nai',           8, TRUE),
('MDI_PRV_LA',     'PROVINCE', 'LONG_AN',   'Long An',             9, TRUE),
('MDI_PRV_TG',     'PROVINCE', 'TIEN_GIANG','Tiền Giang',         10, TRUE),
('MDI_PRV_KH',     'PROVINCE', 'KHANH_HOA', 'Khánh Hòa',         11, TRUE),
('MDI_PRV_TH',     'PROVINCE', 'THANH_HOA', 'Thanh Hóa',          12, TRUE),
('MDI_PRV_NA',     'PROVINCE', 'NGHE_AN',   'Nghệ An',            13, TRUE),
('MDI_PRV_TTH',    'PROVINCE', 'THUA_THIEN','Thừa Thiên Huế',    14, TRUE),
('MDI_PRV_GL',     'PROVINCE', 'GIA_LAI',   'Gia Lai',            15, TRUE);

-- ═══════════════════════════════════════
-- 2.9 LOẠI BẢO HIỂM (INSURANCE_TYPE)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_INS_BHXH',      'INSURANCE_TYPE', 'BHYT_COMPULSORY',  'BHYT bắt buộc (BHXH)',         1, TRUE),
('MDI_INS_BHYT_VOL',  'INSURANCE_TYPE', 'BHYT_VOLUNTARY',   'BHYT tự nguyện',               2, TRUE),
('MDI_INS_PRIVATE',   'INSURANCE_TYPE', 'PRIVATE',           'Bảo hiểm tư nhân',            3, TRUE),
('MDI_INS_COMPANY',   'INSURANCE_TYPE', 'COMPANY',           'Bảo hiểm doanh nghiệp',       4, TRUE),
('MDI_INS_INTL',      'INSURANCE_TYPE', 'INTERNATIONAL',     'Bảo hiểm quốc tế',            5, TRUE),
('MDI_INS_NONE',      'INSURANCE_TYPE', 'NONE',              'Không có bảo hiểm',            6, TRUE);

-- ═══════════════════════════════════════
-- 2.10 LOẠI DỊ ỨNG (ALLERGY_TYPE)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_ALG_DRUG',        'ALLERGY_TYPE', 'DRUG',          'Dị ứng thuốc',                1, TRUE),
('MDI_ALG_FOOD',        'ALLERGY_TYPE', 'FOOD',          'Dị ứng thực phẩm',            2, TRUE),
('MDI_ALG_ENV',         'ALLERGY_TYPE', 'ENVIRONMENT',   'Dị ứng môi trường',           3, TRUE),
('MDI_ALG_CHEMICAL',    'ALLERGY_TYPE', 'CHEMICAL',      'Dị ứng hóa chất',             4, TRUE),
('MDI_ALG_LATEX',       'ALLERGY_TYPE', 'LATEX',         'Dị ứng latex',                 5, TRUE),
('MDI_ALG_INSECT',      'ALLERGY_TYPE', 'INSECT',        'Dị ứng côn trùng',            6, TRUE),
('MDI_ALG_CONTRAST',    'ALLERGY_TYPE', 'CONTRAST',      'Dị ứng thuốc cản quang',      7, TRUE),
('MDI_ALG_OTHER',       'ALLERGY_TYPE', 'OTHER',         'Dị ứng khác',                  8, TRUE);

-- ═══════════════════════════════════════
-- 2.11 MỨC ĐỘ NGHIÊM TRỌNG (SEVERITY)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_SEV_MILD',       'SEVERITY', 'MILD',       'Nhẹ',                 1, TRUE),
('MDI_SEV_MODERATE',   'SEVERITY', 'MODERATE',   'Trung bình',          2, TRUE),
('MDI_SEV_SEVERE',     'SEVERITY', 'SEVERE',     'Nặng',                3, TRUE),
('MDI_SEV_CRITICAL',   'SEVERITY', 'CRITICAL',   'Nguy kịch',           4, TRUE);

-- ═══════════════════════════════════════
-- 2.12 PHƯƠNG THỨC THANH TOÁN (PAYMENT_METHOD)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_PAY_CASH',       'PAYMENT_METHOD', 'CASH',           'Tiền mặt',                    1, TRUE),
('MDI_PAY_CARD',       'PAYMENT_METHOD', 'CARD',           'Thẻ ngân hàng (ATM/Visa)',     2, TRUE),
('MDI_PAY_TRANSFER',   'PAYMENT_METHOD', 'BANK_TRANSFER',  'Chuyển khoản ngân hàng',       3, TRUE),
('MDI_PAY_MOMO',       'PAYMENT_METHOD', 'MOMO',           'Ví MoMo',                      4, TRUE),
('MDI_PAY_ZALOPAY',    'PAYMENT_METHOD', 'ZALOPAY',        'ZaloPay',                       5, TRUE),
('MDI_PAY_VNPAY',      'PAYMENT_METHOD', 'VNPAY',          'VNPay QR',                      6, TRUE),
('MDI_PAY_INSURANCE',  'PAYMENT_METHOD', 'INSURANCE',      'Thanh toán qua bảo hiểm',      7, TRUE);

-- ═══════════════════════════════════════
-- 2.13 SINH HIỆU (VITAL_SIGN)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_VS_TEMP',        'VITAL_SIGN', 'TEMPERATURE',       'Nhiệt độ (°C)',                  1, TRUE),
('MDI_VS_HR',          'VITAL_SIGN', 'HEART_RATE',        'Nhịp tim (bpm)',                  2, TRUE),
('MDI_VS_BP_SYS',      'VITAL_SIGN', 'BP_SYSTOLIC',       'Huyết áp tâm thu (mmHg)',         3, TRUE),
('MDI_VS_BP_DIA',      'VITAL_SIGN', 'BP_DIASTOLIC',      'Huyết áp tâm trương (mmHg)',      4, TRUE),
('MDI_VS_RR',          'VITAL_SIGN', 'RESPIRATORY_RATE',  'Nhịp thở (lần/phút)',             5, TRUE),
('MDI_VS_SPO2',        'VITAL_SIGN', 'SPO2',              'SpO2 - Độ bão hòa Oxy (%)',       6, TRUE),
('MDI_VS_WEIGHT',      'VITAL_SIGN', 'WEIGHT',            'Cân nặng (kg)',                   7, TRUE),
('MDI_VS_HEIGHT',      'VITAL_SIGN', 'HEIGHT',            'Chiều cao (cm)',                   8, TRUE),
('MDI_VS_BMI',         'VITAL_SIGN', 'BMI',               'Chỉ số BMI (kg/m²)',              9, TRUE),
('MDI_VS_GLUCOSE',     'VITAL_SIGN', 'BLOOD_GLUCOSE',     'Đường huyết (mmol/L)',            10, TRUE);

-- ═══════════════════════════════════════
-- 2.14 TRÌNH ĐỘ HỌC VẤN (EDUCATION)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_EDU_NONE',       'EDUCATION', 'NONE',          'Không đi học',              1, TRUE),
('MDI_EDU_PRIMARY',    'EDUCATION', 'PRIMARY',       'Tiểu học',                  2, TRUE),
('MDI_EDU_SECONDARY',  'EDUCATION', 'SECONDARY',     'Trung học cơ sở',          3, TRUE),
('MDI_EDU_HIGH',       'EDUCATION', 'HIGH_SCHOOL',   'Trung học phổ thông',      4, TRUE),
('MDI_EDU_VOCATIONAL', 'EDUCATION', 'VOCATIONAL',    'Trung cấp / Nghề',         5, TRUE),
('MDI_EDU_COLLEGE',    'EDUCATION', 'COLLEGE',       'Cao đẳng',                  6, TRUE),
('MDI_EDU_BACHELOR',   'EDUCATION', 'BACHELOR',      'Đại học',                   7, TRUE),
('MDI_EDU_MASTER',     'EDUCATION', 'MASTER',        'Thạc sĩ',                  8, TRUE),
('MDI_EDU_DOCTOR',     'EDUCATION', 'DOCTORATE',     'Tiến sĩ',                  9, TRUE);

-- ═══════════════════════════════════════
-- 2.15 HÌNH THỨC RA VIỆN (DISCHARGE_TYPE)
-- ═══════════════════════════════════════
INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
('MDI_DIS_COMPLETE',   'DISCHARGE_TYPE', 'COMPLETED',     'Hoàn tất điều trị',              1, TRUE),
('MDI_DIS_TRANSFER',   'DISCHARGE_TYPE', 'TRANSFERRED',   'Chuyển viện',                     2, TRUE),
('MDI_DIS_REQUEST',    'DISCHARGE_TYPE', 'SELF_REQUEST',   'Xin ra viện',                     3, TRUE),
('MDI_DIS_ESCAPE',     'DISCHARGE_TYPE', 'ESCAPED',        'Trốn viện',                       4, TRUE),
('MDI_DIS_DECEASED',   'DISCHARGE_TYPE', 'DECEASED',       'Tử vong',                         5, TRUE),
('MDI_DIS_FOLLOWUP',   'DISCHARGE_TYPE', 'FOLLOW_UP',      'Hẹn tái khám',                   6, TRUE);

-- *********************************************************************
-- 3. LOẠI QUAN HỆ (RELATION TYPES) - 12 loại quan hệ thân nhân
-- Dùng cho patient_contacts
-- *********************************************************************
INSERT INTO relation_types (relation_types_id, code, name, description, is_active) VALUES
('REL_FATHER',       'FATHER',         'Cha',                 'Cha ruột / Cha nuôi',                           TRUE),
('REL_MOTHER',       'MOTHER',         'Mẹ',                 'Mẹ ruột / Mẹ nuôi',                           TRUE),
('REL_SPOUSE',       'SPOUSE',         'Vợ/Chồng',          'Người phối ngẫu hợp pháp',                      TRUE),
('REL_CHILD',        'CHILD',          'Con',                 'Con ruột / Con nuôi',                           TRUE),
('REL_SIBLING',      'SIBLING',        'Anh/Chị/Em',        'Anh chị em ruột',                                TRUE),
('REL_GRANDPARENT',  'GRANDPARENT',    'Ông/Bà',            'Ông bà nội/ngoại',                               TRUE),
('REL_GRANDCHILD',   'GRANDCHILD',     'Cháu',               'Cháu nội/ngoại',                                TRUE),
('REL_UNCLE_AUNT',   'UNCLE_AUNT',     'Chú/Bác/Cô/Dì',   'Người thân bên nội/ngoại',                       TRUE),
('REL_NEPHEW_NIECE', 'NEPHEW_NIECE',   'Cháu (họ)',         'Cháu họ',                                        TRUE),
('REL_FRIEND',       'FRIEND',         'Bạn bè',            'Bạn bè thân thiết',                              TRUE),
('REL_COLLEAGUE',    'COLLEAGUE',      'Đồng nghiệp',      'Đồng nghiệp tại nơi làm việc',                  TRUE),
('REL_GUARDIAN',     'GUARDIAN',        'Người giám hộ',     'Người giám hộ hợp pháp (theo quyết định pháp lý)', TRUE);

-- *********************************************************************
-- 4. LOẠI TÀI LIỆU (DOCUMENT TYPES) - 15 loại hồ sơ y tế
-- Dùng cho patient_documents
-- *********************************************************************
INSERT INTO document_types (document_type_id, code, name, description, is_active) VALUES
('DOC_LAB_RESULT',       'LAB_RESULT',        'Kết quả xét nghiệm',           'Phiếu kết quả xét nghiệm máu, nước tiểu, vi sinh...',    TRUE),
('DOC_IMAGING',          'IMAGING_RESULT',    'Kết quả chẩn đoán hình ảnh',   'Phim X-quang, CT, MRI, siêu âm và phiếu đọc kết quả',    TRUE),
('DOC_PRESCRIPTION',     'PRESCRIPTION',      'Đơn thuốc',                     'Đơn thuốc điều trị ngoại trú / nội trú',                   TRUE),
('DOC_REFERRAL',         'REFERRAL',          'Giấy chuyển viện',              'Giấy chuyển tuyến / giấy giới thiệu khám bệnh',           TRUE),
('DOC_DISCHARGE',        'DISCHARGE_SUMMARY', 'Tóm tắt ra viện',              'Biên bản tóm tắt bệnh án khi ra viện',                     TRUE),
('DOC_CONSENT',          'CONSENT_FORM',      'Phiếu đồng ý thủ thuật',       'Cam kết đồng ý phẫu thuật / thủ thuật / gây mê',          TRUE),
('DOC_MEDICAL_CERT',     'MEDICAL_CERT',      'Giấy chứng nhận sức khỏe',    'Giấy khám sức khỏe định kỳ / đi làm / đi học',            TRUE),
('DOC_SICK_LEAVE',       'SICK_LEAVE',        'Giấy nghỉ ốm',                 'Giấy chứng nhận nghỉ ốm hưởng BHXH',                      TRUE),
('DOC_INSURANCE_CLAIM',  'INSURANCE_CLAIM',   'Hồ sơ yêu cầu bảo hiểm',     'Bộ hồ sơ claim bảo hiểm y tế',                             TRUE),
('DOC_VACCINATION',      'VACCINATION',       'Phiếu tiêm chủng',             'Sổ/phiếu tiêm chủng vaccine',                              TRUE),
('DOC_BIRTH_CERT',       'BIRTH_CERT',        'Giấy chứng sinh',              'Giấy chứng sinh cho trẻ sơ sinh',                          TRUE),
('DOC_DEATH_CERT',       'DEATH_CERT',        'Giấy chứng tử',                'Giấy chứng nhận tử vong y khoa',                           TRUE),
('DOC_EXTERNAL_EMR',     'EXTERNAL_EMR',      'Bệnh án ngoại viện',           'Hồ sơ bệnh án từ cơ sở y tế khác',                        TRUE),
('DOC_ID_CARD',          'ID_CARD',           'CMND/CCCD/Passport',            'Bản sao giấy tờ tùy thân',                                 TRUE),
('DOC_OTHER',            'OTHER',             'Tài liệu khác',                 'Các loại tài liệu y tế khác không thuộc danh mục trên',   TRUE);

-- *********************************************************************
-- 5. THẺ GẮN BỆNH NHÂN (TAGS) - 15 thẻ phân loại
-- Dùng cho patient_tags
-- *********************************************************************
INSERT INTO tags (tags_id, code, name, color_hex, description, is_active) VALUES
-- Nhãn ưu tiên / đặc biệt
('TAG_VIP',              'VIP',              'VIP',                     '#FFD700', 'Bệnh nhân VIP, cần ưu tiên chăm sóc đặc biệt',                TRUE),
('TAG_PRIORITY',         'PRIORITY',         'Ưu tiên',                '#FF6B6B', 'Bệnh nhân cần ưu tiên khám (người già, khuyết tật)',           TRUE),
-- Nhãn bệnh mãn tính
('TAG_CHRONIC',          'CHRONIC_CARE',     'Bệnh mãn tính',         '#4ECDC4', 'Bệnh nhân mắc bệnh mãn tính cần theo dõi dài hạn',            TRUE),
('TAG_DIABETES',         'DIABETES',         'Đái tháo đường',        '#45B7D1', 'Bệnh nhân đái tháo đường type 1/2',                            TRUE),
('TAG_HYPERTENSION',     'HYPERTENSION',     'Tăng huyết áp',         '#FF8C42', 'Bệnh nhân tăng huyết áp cần theo dõi định kỳ',                TRUE),
('TAG_HEART_DISEASE',    'HEART_DISEASE',    'Bệnh tim mạch',         '#E74C3C', 'Bệnh nhân có tiền sử bệnh tim mạch',                          TRUE),
-- Nhãn nguy cơ / cảnh báo
('TAG_HIGH_RISK',        'HIGH_RISK',        'Nguy cơ cao',            '#C0392B', 'Bệnh nhân có nguy cơ cao về sức khỏe',                        TRUE),
('TAG_ALLERGY_ALERT',    'ALLERGY_ALERT',    'Cảnh báo dị ứng',       '#E67E22', 'Bệnh nhân có tiền sử dị ứng thuốc/thực phẩm nghiêm trọng',   TRUE),
('TAG_FALL_RISK',        'FALL_RISK',        'Nguy cơ té ngã',        '#9B59B6', 'Bệnh nhân cao tuổi hoặc yếu có nguy cơ té ngã',              TRUE),
-- Nhãn bảo hiểm
('TAG_BHYT',             'INSURANCE_BHYT',   'Có BHYT',                '#27AE60', 'Bệnh nhân có thẻ BHYT còn hiệu lực',                          TRUE),
('TAG_PRIVATE_INS',      'INSURANCE_PRIVATE','BH Tư nhân',             '#3498DB', 'Bệnh nhân có bảo hiểm sức khỏe tư nhân',                     TRUE),
-- Nhãn hành chính
('TAG_NEW_PATIENT',      'NEW_PATIENT',      'Bệnh nhân mới',         '#1ABC9C', 'Bệnh nhân đến khám lần đầu',                                  TRUE),
('TAG_FREQUENT',         'FREQUENT_VISITOR', 'Khám thường xuyên',     '#2ECC71', 'Bệnh nhân khám định kỳ hàng tháng',                           TRUE),
('TAG_PREGNANT',         'PREGNANT',         'Thai phụ',                '#F39C12', 'Bệnh nhân đang mang thai, cần theo dõi đặc biệt',            TRUE),
('TAG_PEDIATRIC',        'PEDIATRIC',        'Nhi khoa',                '#3498DB', 'Bệnh nhân dưới 16 tuổi thuộc diện nhi khoa',                  TRUE);

COMMIT;

-- =====================================================================
-- THỐNG KÊ SEED DATA MODULE 2
-- =====================================================================
-- master_data_categories:  15 nhóm danh mục
-- master_data_items:      124 giá trị chi tiết
--   - GENDER:               3    - BLOOD_TYPE:        8
--   - ETHNICITY:           20    - RELIGION:          9
--   - MARITAL_STATUS:       5    - OCCUPATION:       20
--   - NATIONALITY:         12    - PROVINCE:         15
--   - INSURANCE_TYPE:       6    - ALLERGY_TYPE:      8
--   - SEVERITY:             4    - PAYMENT_METHOD:    7
--   - VITAL_SIGN:          10    - EDUCATION:         9
--   - DISCHARGE_TYPE:       6
-- relation_types:          12 loại quan hệ thân nhân
-- document_types:          15 loại tài liệu y tế
-- tags:                    15 thẻ phân loại bệnh nhân
-- TỔNG:                  181 bản ghi
-- =====================================================================
