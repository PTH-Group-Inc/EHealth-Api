-- =====================================================================
-- SEED DATA: THIẾT BỊ Y TẾ (MEDICAL EQUIPMENTS) & GIƯỜNG BỆNH (BEDS)
-- =====================================================================
-- Thứ tự chạy: Sau 03_facilities.sql (cần medical_rooms)
-- Bao gồm: medical_equipments, beds
-- =====================================================================

BEGIN;

-- *********************************************************************
-- 1. THIẾT BỊ Y TẾ (MEDICAL EQUIPMENTS) — 60 thiết bị
-- Phân bổ theo phòng thực tế trong 10 khoa
-- *********************************************************************

-- ═══════════════════════════════════════════════════════════════
-- 1.1  Khoa Khám bệnh (6 thiết bị)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO medical_equipments (equipment_id, facility_id, branch_id, code, name, serial_number, manufacturer, manufacturing_date, purchase_date, warranty_expiration, status, current_room_id) VALUES
('EQ_KB_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-KB-001', 'Máy đo huyết áp tự động Omron HEM-7156',           'OMR-7156-001',  'Omron Healthcare',  '2024-06-01', '2024-09-15', '2027-09-15', 'ACTIVE', 'ROOM_KB_03'),
('EQ_KB_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-KB-002', 'Nhiệt kế hồng ngoại Microlife NC 200',             'MCL-NC200-001', 'Microlife AG',      '2024-08-01', '2024-10-01', '2027-10-01', 'ACTIVE', 'ROOM_KB_03'),
('EQ_KB_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-KB-003', 'Cân sức khỏe điện tử Tanita BC-730',               'TNT-730-001',   'Tanita Corporation','2024-05-01', '2024-08-20', '2026-08-20', 'ACTIVE', 'ROOM_KB_03'),
('EQ_KB_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-KB-004', 'Máy đo SpO2 cầm tay Beurer PO 30',                'BER-PO30-001',  'Beurer GmbH',       '2024-07-01', '2024-09-10', '2027-09-10', 'ACTIVE', 'ROOM_KB_03'),
('EQ_KB_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-KB-005', 'Ống nghe y khoa Littmann Classic III',              'LTM-CLS3-001',  '3M Littmann',       '2024-03-01', '2024-06-15', '2029-06-15', 'ACTIVE', 'ROOM_KB_01'),
('EQ_KB_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-KB-006', 'Đèn khám tai Welch Allyn MacroView',               'WA-MV200-001',  'Welch Allyn',       '2024-04-01', '2024-07-20', '2027-07-20', 'ACTIVE', 'ROOM_KB_01'),

-- ═══════════════════════════════════════════════════════════════
-- 1.2  Khoa Nội (6 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_NOI_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NOI-001', 'Máy điện tim 12 kênh Nihon Kohden ECG-1350',     'NK-1350-001',   'Nihon Kohden',      '2023-12-01', '2024-03-10', '2027-03-10', 'ACTIVE', 'ROOM_NOI_01'),
('EQ_NOI_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NOI-002', 'Máy siêu âm tim Philips CX50',                   'PHL-CX50-001',  'Philips Healthcare','2023-06-01', '2023-10-15', '2028-10-15', 'ACTIVE', 'ROOM_NOI_01'),
('EQ_NOI_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NOI-003', 'Monitor theo dõi bệnh nhân Mindray iPM 10',      'MDR-IPM10-001', 'Mindray',           '2024-01-01', '2024-04-20', '2027-04-20', 'ACTIVE', 'ROOM_NOI_03'),
('EQ_NOI_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NOI-004', 'Monitor theo dõi bệnh nhân Mindray iPM 10',      'MDR-IPM10-002', 'Mindray',           '2024-01-01', '2024-04-20', '2027-04-20', 'ACTIVE', 'ROOM_NOI_02'),
('EQ_NOI_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NOI-005', 'Máy bơm tiêm điện Terumo TE-SS800',              'TRM-SS800-001', 'Terumo Corporation','2024-02-01', '2024-05-15', '2027-05-15', 'ACTIVE', 'ROOM_NOI_02'),
('EQ_NOI_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NOI-006', 'Máy đo đường huyết Accu-Chek Guide',             'ACH-GDE-001',   'Roche Diagnostics', '2024-09-01', '2024-11-10', '2026-11-10', 'ACTIVE', 'ROOM_NOI_04'),

-- ═══════════════════════════════════════════════════════════════
-- 1.3  Khoa Ngoại (7 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_NGOAI_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-001', 'Bàn mổ thủy lực OT-300',                     'OT300-001',     'Mỹ Châu Medical',  '2022-06-01', '2022-12-01', '2027-12-01', 'ACTIVE', 'ROOM_NGOAI_03'),
('EQ_NGOAI_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-002', 'Đèn mổ LED-780 hai dome',                    'LED780-001',    'Skylux Medical',    '2022-06-01', '2022-12-01', '2027-12-01', 'ACTIVE', 'ROOM_NGOAI_03'),
('EQ_NGOAI_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-003', 'Máy gây mê Drager Fabius Plus XL',           'DRG-FBP-001',   'Dräger',            '2022-09-01', '2023-01-15', '2028-01-15', 'ACTIVE', 'ROOM_NGOAI_03'),
('EQ_NGOAI_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-004', 'Máy hút dịch phẫu thuật Medela Dominant 50', 'MDL-D50-001',   'Medela AG',         '2023-03-01', '2023-06-20', '2026-06-20', 'ACTIVE', 'ROOM_NGOAI_03'),
('EQ_NGOAI_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-005', 'Dao mổ điện Valleylab FX8',                  'VLB-FX8-001',   'Medtronic',         '2023-01-01', '2023-04-10', '2028-04-10', 'ACTIVE', 'ROOM_NGOAI_03'),
('EQ_NGOAI_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-006', 'Monitor phòng mổ Philips MX700',             'PHL-MX700-001', 'Philips Healthcare','2023-06-01', '2023-09-15', '2028-09-15', 'ACTIVE', 'ROOM_NGOAI_03'),
('EQ_NGOAI_07', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NGOAI-007', 'Xe thay băng inox 3 tầng',                    'XTB-INOX-001',  'Y Khoa Kim Minh',   '2024-01-01', '2024-02-15', '2029-02-15', 'ACTIVE', 'ROOM_NGOAI_05'),

-- ═══════════════════════════════════════════════════════════════
-- 1.4  Khoa Sản (5 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_SAN_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-SAN-001', 'Máy siêu âm thai 4D Voluson E10',                'GE-VE10-001',   'GE Healthcare',     '2023-03-01', '2023-07-10', '2028-07-10', 'ACTIVE', 'ROOM_SAN_02'),
('EQ_SAN_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-SAN-002', 'Máy monitoring sản khoa Bionet FC-1400',         'BN-FC1400-001', 'Bionet Co.',        '2023-06-01', '2023-09-20', '2026-09-20', 'ACTIVE', 'ROOM_SAN_03'),
('EQ_SAN_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-SAN-003', 'Giường sanh đa năng LDR',                        'LDR-BED-001',   'Hill-Rom',          '2022-12-01', '2023-03-15', '2028-03-15', 'ACTIVE', 'ROOM_SAN_03'),
('EQ_SAN_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-SAN-004', 'Lồng ấp trẻ sơ sinh Atom Dual Incu i',          'ATM-DII-001',   'Atom Medical',      '2023-09-01', '2024-01-10', '2029-01-10', 'ACTIVE', 'ROOM_SAN_05'),
('EQ_SAN_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-SAN-005', 'Đèn chiếu vàng da sơ sinh Natus NeoBlue',        'NAT-NB-001',    'Natus Medical',     '2024-02-01', '2024-05-20', '2027-05-20', 'ACTIVE', 'ROOM_SAN_05'),

-- ═══════════════════════════════════════════════════════════════
-- 1.5  Khoa Nhi (5 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_NHI_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NHI-001', 'Máy khí dung Omron NE-C803',                     'OMR-C803-001',  'Omron Healthcare',  '2024-06-01', '2024-08-15', '2027-08-15', 'ACTIVE', 'ROOM_NHI_01'),
('EQ_NHI_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NHI-002', 'Cân sơ sinh điện tử Seca 757',                   'SEC-757-001',   'Seca GmbH',         '2024-03-01', '2024-05-10', '2027-05-10', 'ACTIVE', 'ROOM_NHI_01'),
('EQ_NHI_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NHI-003', 'Monitor nhi khoa Mindray iMEC 10',               'MDR-IMEC-001',  'Mindray',           '2024-01-01', '2024-04-20', '2027-04-20', 'ACTIVE', 'ROOM_NHI_04'),
('EQ_NHI_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NHI-004', 'Tủ lạnh bảo quản vaccine Haier HYC-68',          'HAI-68-001',    'Haier Biomedical',  '2024-04-01', '2024-06-25', '2027-06-25', 'ACTIVE', 'ROOM_NHI_03'),
('EQ_NHI_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-NHI-005', 'Bơm tiêm vaccine tự động',                       'VACCINE-INJ-01','BD Medical',        '2024-05-01', '2024-07-15', '2026-07-15', 'ACTIVE', 'ROOM_NHI_03'),

-- ═══════════════════════════════════════════════════════════════
-- 1.6  Khoa Cấp cứu (7 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_CC_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-001', 'Máy sốc điện Nihon Kohden TEC-5631',               'NK-5631-001',   'Nihon Kohden',      '2023-06-01', '2023-09-15', '2028-09-15', 'ACTIVE', 'ROOM_CC_02'),
('EQ_CC_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-002', 'Xe cấp cứu đa năng (crash cart)',                  'CART-CC-001',   'Y Khoa Kim Minh',   '2023-08-01', '2023-11-20', '2028-11-20', 'ACTIVE', 'ROOM_CC_02'),
('EQ_CC_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-003', 'Monitor cấp cứu Philips IntelliVue MX450',         'PHL-MX450-001', 'Philips Healthcare','2023-03-01', '2023-06-10', '2028-06-10', 'ACTIVE', 'ROOM_CC_02'),
('EQ_CC_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-004', 'Máy thở cấp cứu Hamilton T1',                     'HMT-T1-001',    'Hamilton Medical',  '2023-01-01', '2023-04-15', '2028-04-15', 'ACTIVE', 'ROOM_CC_03'),
('EQ_CC_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-005', 'Bộ đặt nội khí quản Macintosh',                    'INTUB-MAC-001', 'Teleflex',          '2024-02-01', '2024-04-10', '2027-04-10', 'ACTIVE', 'ROOM_CC_02'),
('EQ_CC_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-006', 'Bình oxy di động 10L có van giảm áp',              'O2-10L-001',    'OXY Medical VN',    '2024-01-01', '2024-03-15', '2029-03-15', 'ACTIVE', 'ROOM_CC_01'),
('EQ_CC_07', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CC-007', 'Máy hút đờm cấp cứu Medela Basic 30',             'MDL-B30-001',   'Medela AG',         '2024-03-01', '2024-05-20', '2027-05-20', 'ACTIVE', 'ROOM_CC_04'),

-- ═══════════════════════════════════════════════════════════════
-- 1.7  Khoa Hồi sức tích cực (6 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_ICU_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-ICU-001', 'Máy thở ICU Drager Evita V500',                  'DRG-V500-001',  'Dräger',            '2022-09-01', '2023-01-10', '2028-01-10', 'ACTIVE', 'ROOM_ICU_01'),
('EQ_ICU_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-ICU-002', 'Máy thở ICU Drager Evita V500',                  'DRG-V500-002',  'Dräger',            '2022-09-01', '2023-01-10', '2028-01-10', 'ACTIVE', 'ROOM_ICU_01'),
('EQ_ICU_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-ICU-003', 'Monitor ICU Philips IntelliVue MX800',            'PHL-MX800-001', 'Philips Healthcare','2023-03-01', '2023-06-15', '2028-06-15', 'ACTIVE', 'ROOM_ICU_01'),
('EQ_ICU_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-ICU-004', 'Monitor ICU Philips IntelliVue MX800',            'PHL-MX800-002', 'Philips Healthcare','2023-03-01', '2023-06-15', '2028-06-15', 'ACTIVE', 'ROOM_ICU_01'),
('EQ_ICU_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-ICU-005', 'Máy lọc máu liên tục Prismaflex',                'BXT-PFX-001',   'Baxter',            '2023-06-01', '2023-09-20', '2028-09-20', 'ACTIVE', 'ROOM_ICU_04'),
('EQ_ICU_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-ICU-006', 'Máy bơm truyền dịch B.Braun Infusomat Space',    'BBR-INFS-001',  'B.Braun',           '2024-01-01', '2024-03-10', '2027-03-10', 'ACTIVE', 'ROOM_ICU_01'),

-- ═══════════════════════════════════════════════════════════════
-- 1.8  Khoa Xét nghiệm (7 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_XN_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-001', 'Máy xét nghiệm huyết học Sysmex XN-1000',         'SYS-XN1K-001',  'Sysmex Corporation','2022-12-01', '2023-03-15', '2028-03-15', 'ACTIVE', 'ROOM_XN_01'),
('EQ_XN_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-002', 'Máy phân tích sinh hóa tự động Beckman AU5800',   'BCK-5800-001',  'Beckman Coulter',   '2023-03-01', '2023-06-10', '2028-06-10', 'ACTIVE', 'ROOM_XN_02'),
('EQ_XN_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-003', 'Máy phân tích nước tiểu Roche cobas u 601',       'RCH-U601-001',  'Roche Diagnostics', '2023-06-01', '2023-09-20', '2028-09-20', 'ACTIVE', 'ROOM_XN_02'),
('EQ_XN_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-004', 'Máy cấy máu tự động Biomérieux BacT/ALERT',       'BIO-BA-001',    'bioMérieux',        '2023-09-01', '2023-12-15', '2028-12-15', 'ACTIVE', 'ROOM_XN_03'),
('EQ_XN_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-005', 'Máy xét nghiệm miễn dịch Roche cobas e 411',      'RCH-E411-001',  'Roche Diagnostics', '2023-01-01', '2023-04-10', '2028-04-10', 'ACTIVE', 'ROOM_XN_04'),
('EQ_XN_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-006', 'Máy ly tâm máu Eppendorf 5804 R',                 'EPP-5804-001',  'Eppendorf',         '2024-01-01', '2024-03-20', '2027-03-20', 'ACTIVE', 'ROOM_XN_01'),
('EQ_XN_07', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-XN-007', 'Máy đông máu tự động Stago STA Compact Max',      'STG-SCM-001',   'Diagnostica Stago', '2023-06-01', '2023-09-15', '2028-09-15', 'ACTIVE', 'ROOM_XN_01'),

-- ═══════════════════════════════════════════════════════════════
-- 1.9  Khoa Chẩn đoán hình ảnh (5 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_CDHA_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CDHA-001', 'Máy X-quang kỹ thuật số Shimadzu RADspeed Pro', 'SHM-RSP-001',  'Shimadzu',          '2022-06-01', '2022-10-15', '2027-10-15', 'ACTIVE', 'ROOM_CDHA_01'),
('EQ_CDHA_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CDHA-002', 'Máy CT Scanner 64 lát Siemens SOMATOM go.UP',  'SIE-GOUP-001', 'Siemens Healthineers','2022-03-01', '2022-07-20', '2027-07-20', 'ACTIVE', 'ROOM_CDHA_02'),
('EQ_CDHA_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CDHA-003', 'Máy cộng hưởng từ MRI Siemens MAGNETOM Aera', 'SIE-MAG-001',  'Siemens Healthineers','2021-12-01', '2022-04-10', '2027-04-10', 'ACTIVE', 'ROOM_CDHA_03'),
('EQ_CDHA_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CDHA-004', 'Máy siêu âm tổng quát Philips EPIQ Elite',     'PHL-EPIQ-001', 'Philips Healthcare','2023-06-01', '2023-09-15', '2028-09-15', 'ACTIVE', 'ROOM_CDHA_04'),
('EQ_CDHA_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-CDHA-005', 'Máy siêu âm Doppler màu GE Vivid S70N',        'GE-VS70-001',  'GE Healthcare',     '2023-09-01', '2023-12-10', '2028-12-10', 'ACTIVE', 'ROOM_CDHA_04'),

-- ═══════════════════════════════════════════════════════════════
-- 1.10 Khoa Dược (6 thiết bị)
-- ═══════════════════════════════════════════════════════════════
('EQ_DUOC_01', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-DUOC-001', 'Tủ lạnh bảo quản thuốc Liebherr MKv 3913',     'LBH-3913-001', 'Liebherr',          '2023-06-01', '2023-09-10', '2026-09-10', 'ACTIVE', 'ROOM_DUOC_01'),
('EQ_DUOC_02', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-DUOC-002', 'Tủ lạnh bảo quản thuốc Liebherr MKv 3913',     'LBH-3913-002', 'Liebherr',          '2023-06-01', '2023-09-10', '2026-09-10', 'ACTIVE', 'ROOM_DUOC_05'),
('EQ_DUOC_03', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-DUOC-003', 'Máy đóng gói thuốc tự động TPM-350',           'TPM-350-001',  'Tosho Medical',     '2023-09-01', '2023-12-20', '2028-12-20', 'ACTIVE', 'ROOM_DUOC_02'),
('EQ_DUOC_04', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-DUOC-004', 'Máy đọc mã vạch thuốc Zebra DS2278',           'ZBR-2278-001', 'Zebra Technologies','2024-04-01', '2024-06-15', '2027-06-15', 'ACTIVE', 'ROOM_DUOC_02'),
('EQ_DUOC_05', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-DUOC-005', 'Máy đọc mã vạch thuốc Zebra DS2278',           'ZBR-2278-002', 'Zebra Technologies','2024-04-01', '2024-06-15', '2027-06-15', 'ACTIVE', 'ROOM_DUOC_03'),
('EQ_DUOC_06', 'FAC_EHEALTH', 'BR_MAIN', 'EQ-DUOC-006', 'Ẩm kế + nhiệt kế tủ thuốc Testo 174H',        'TST-174H-001', 'Testo SE',          '2024-06-01', '2024-08-10', '2027-08-10', 'ACTIVE', 'ROOM_DUOC_01');


-- *********************************************************************
-- 2. GIƯỜNG BỆNH (BEDS) — 62 giường
-- Phân bổ theo phòng nội trú / ICU / cấp cứu / theo dõi
-- *********************************************************************

-- ═══════════════════════════════════════════════════════════════
-- 2.1  Khoa Nội — 10 giường (6 nội trú + 4 theo dõi)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO beds (bed_id, facility_id, branch_id, department_id, room_id, name, code, type, status, description) VALUES
('BED_NOI_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_02', 'Giường nội trú 1',  'NOI-G01', 'STANDARD', 'EMPTY', 'Giường bệnh tiêu chuẩn 2 tay quay, có bàn ăn phụ'),
('BED_NOI_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_02', 'Giường nội trú 2',  'NOI-G02', 'STANDARD', 'EMPTY', 'Giường bệnh tiêu chuẩn 2 tay quay, có bàn ăn phụ'),
('BED_NOI_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_02', 'Giường nội trú 3',  'NOI-G03', 'STANDARD', 'EMPTY', 'Giường bệnh tiêu chuẩn 2 tay quay, có bàn ăn phụ'),
('BED_NOI_04', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_02', 'Giường nội trú 4',  'NOI-G04', 'STANDARD', 'EMPTY', 'Giường bệnh tiêu chuẩn 2 tay quay, có bàn ăn phụ'),
('BED_NOI_05', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_02', 'Giường nội trú 5',  'NOI-G05', 'STANDARD', 'EMPTY', 'Giường bệnh tiêu chuẩn 2 tay quay, có bàn ăn phụ'),
('BED_NOI_06', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_02', 'Giường nội trú 6',  'NOI-G06', 'STANDARD', 'EMPTY', 'Giường bệnh tiêu chuẩn 2 tay quay, có bàn ăn phụ'),
('BED_NOI_07', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_03', 'Giường theo dõi 1', 'NOI-G07', 'STANDARD', 'EMPTY', 'Giường theo dõi có monitor, chuông gọi y tá'),
('BED_NOI_08', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_03', 'Giường theo dõi 2', 'NOI-G08', 'STANDARD', 'EMPTY', 'Giường theo dõi có monitor, chuông gọi y tá'),
('BED_NOI_09', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_03', 'Giường theo dõi 3', 'NOI-G09', 'STANDARD', 'EMPTY', 'Giường theo dõi có monitor, chuông gọi y tá'),
('BED_NOI_10', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NOI', 'ROOM_NOI_03', 'Giường theo dõi 4', 'NOI-G10', 'STANDARD', 'EMPTY', 'Giường theo dõi có monitor, chuông gọi y tá'),

-- ═══════════════════════════════════════════════════════════════
-- 2.2  Khoa Ngoại — 7 giường (3 tiền phẫu + 4 hậu phẫu)
-- ═══════════════════════════════════════════════════════════════
('BED_NGOAI_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_02', 'Giường tiền phẫu 1',  'NGOAI-G01', 'STANDARD', 'EMPTY', 'Giường chuẩn bị trước phẫu thuật'),
('BED_NGOAI_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_02', 'Giường tiền phẫu 2',  'NGOAI-G02', 'STANDARD', 'EMPTY', 'Giường chuẩn bị trước phẫu thuật'),
('BED_NGOAI_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_02', 'Giường tiền phẫu 3',  'NGOAI-G03', 'STANDARD', 'EMPTY', 'Giường chuẩn bị trước phẫu thuật'),
('BED_NGOAI_04', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_04', 'Giường hậu phẫu 1',   'NGOAI-G04', 'STANDARD', 'EMPTY', 'Giường hồi phục sau mổ, có monitor'),
('BED_NGOAI_05', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_04', 'Giường hậu phẫu 2',   'NGOAI-G05', 'STANDARD', 'EMPTY', 'Giường hồi phục sau mổ, có monitor'),
('BED_NGOAI_06', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_04', 'Giường hậu phẫu 3',   'NGOAI-G06', 'STANDARD', 'EMPTY', 'Giường hồi phục sau mổ, có monitor'),
('BED_NGOAI_07', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NGOAI', 'ROOM_NGOAI_04', 'Giường hậu phẫu 4',   'NGOAI-G07', 'STANDARD', 'EMPTY', 'Giường hồi phục sau mổ, có monitor'),

-- ═══════════════════════════════════════════════════════════════
-- 2.3  Khoa Sản — 10 giường (4 hậu sản + 6 sơ sinh)
-- ═══════════════════════════════════════════════════════════════
('BED_SAN_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_04', 'Giường hậu sản 1',      'SAN-G01', 'STANDARD', 'EMPTY', 'Giường hậu sản có bàn phụ, vách ngăn riêng tư'),
('BED_SAN_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_04', 'Giường hậu sản 2',      'SAN-G02', 'STANDARD', 'EMPTY', 'Giường hậu sản có bàn phụ, vách ngăn riêng tư'),
('BED_SAN_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_04', 'Giường hậu sản 3',      'SAN-G03', 'STANDARD', 'EMPTY', 'Giường hậu sản có bàn phụ, vách ngăn riêng tư'),
('BED_SAN_04', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_04', 'Giường hậu sản 4',      'SAN-G04', 'STANDARD', 'EMPTY', 'Giường hậu sản có bàn phụ, vách ngăn riêng tư'),
('BED_SAN_05', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_05', 'Nôi sơ sinh 1',         'SAN-G05', 'STANDARD', 'EMPTY', 'Nôi trẻ sơ sinh trong suốt, có hệ thống sưởi'),
('BED_SAN_06', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_05', 'Nôi sơ sinh 2',         'SAN-G06', 'STANDARD', 'EMPTY', 'Nôi trẻ sơ sinh trong suốt, có hệ thống sưởi'),
('BED_SAN_07', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_05', 'Nôi sơ sinh 3',         'SAN-G07', 'STANDARD', 'EMPTY', 'Nôi trẻ sơ sinh trong suốt, có hệ thống sưởi'),
('BED_SAN_08', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_05', 'Nôi sơ sinh 4',         'SAN-G08', 'STANDARD', 'EMPTY', 'Nôi trẻ sơ sinh trong suốt, có hệ thống sưởi'),
('BED_SAN_09', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_05', 'Nôi sơ sinh 5',         'SAN-G09', 'STANDARD', 'EMPTY', 'Nôi trẻ sơ sinh trong suốt, có hệ thống sưởi'),
('BED_SAN_10', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_SAN', 'ROOM_SAN_05', 'Nôi sơ sinh 6',         'SAN-G10', 'STANDARD', 'EMPTY', 'Nôi trẻ sơ sinh trong suốt, có hệ thống sưởi'),

-- ═══════════════════════════════════════════════════════════════
-- 2.4  Khoa Nhi — 9 giường (6 nội trú + 3 theo dõi)
-- ═══════════════════════════════════════════════════════════════
('BED_NHI_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_02', 'Giường nhi nội trú 1',   'NHI-G01', 'STANDARD', 'EMPTY', 'Giường nhi (kích thước nhỏ), có thanh chắn an toàn'),
('BED_NHI_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_02', 'Giường nhi nội trú 2',   'NHI-G02', 'STANDARD', 'EMPTY', 'Giường nhi (kích thước nhỏ), có thanh chắn an toàn'),
('BED_NHI_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_02', 'Giường nhi nội trú 3',   'NHI-G03', 'STANDARD', 'EMPTY', 'Giường nhi (kích thước nhỏ), có thanh chắn an toàn'),
('BED_NHI_04', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_02', 'Giường nhi nội trú 4',   'NHI-G04', 'STANDARD', 'EMPTY', 'Giường nhi (kích thước nhỏ), có thanh chắn an toàn'),
('BED_NHI_05', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_02', 'Giường nhi nội trú 5',   'NHI-G05', 'STANDARD', 'EMPTY', 'Giường nhi (kích thước nhỏ), có thanh chắn an toàn'),
('BED_NHI_06', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_02', 'Giường nhi nội trú 6',   'NHI-G06', 'STANDARD', 'EMPTY', 'Giường nhi (kích thước nhỏ), có thanh chắn an toàn'),
('BED_NHI_07', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_04', 'Giường theo dõi nhi 1',  'NHI-G07', 'STANDARD', 'EMPTY', 'Giường theo dõi trẻ nặng, có monitor nhi khoa'),
('BED_NHI_08', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_04', 'Giường theo dõi nhi 2',  'NHI-G08', 'STANDARD', 'EMPTY', 'Giường theo dõi trẻ nặng, có monitor nhi khoa'),
('BED_NHI_09', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_NHI', 'ROOM_NHI_04', 'Giường theo dõi nhi 3',  'NHI-G09', 'STANDARD', 'EMPTY', 'Giường theo dõi trẻ nặng, có monitor nhi khoa'),

-- ═══════════════════════════════════════════════════════════════
-- 2.5  Khoa Cấp cứu — 11 giường (type: EMERGENCY)
-- ═══════════════════════════════════════════════════════════════
('BED_CC_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_01', 'Giường tiếp nhận CC 1',    'CC-G01', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu, có ray truyền dịch + oxy'),
('BED_CC_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_01', 'Giường tiếp nhận CC 2',    'CC-G02', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu, có ray truyền dịch + oxy'),
('BED_CC_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_01', 'Giường tiếp nhận CC 3',    'CC-G03', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu, có ray truyền dịch + oxy'),
('BED_CC_04', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_02', 'Giường cấp cứu 1',         'CC-G04', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu chính, đầy đủ trang thiết bị'),
('BED_CC_05', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_02', 'Giường cấp cứu 2',         'CC-G05', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu chính, đầy đủ trang thiết bị'),
('BED_CC_06', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_02', 'Giường cấp cứu 3',         'CC-G06', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu chính, đầy đủ trang thiết bị'),
('BED_CC_07', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_02', 'Giường cấp cứu 4',         'CC-G07', 'EMERGENCY', 'EMPTY', 'Giường cấp cứu chính, đầy đủ trang thiết bị'),
('BED_CC_08', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_05', 'Giường theo dõi sau CC 1', 'CC-G08', 'EMERGENCY', 'EMPTY', 'Giường theo dõi sau cấp cứu (lưu viện ngắn)'),
('BED_CC_09', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_05', 'Giường theo dõi sau CC 2', 'CC-G09', 'EMERGENCY', 'EMPTY', 'Giường theo dõi sau cấp cứu (lưu viện ngắn)'),
('BED_CC_10', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_05', 'Giường theo dõi sau CC 3', 'CC-G10', 'EMERGENCY', 'EMPTY', 'Giường theo dõi sau cấp cứu (lưu viện ngắn)'),
('BED_CC_11', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_05', 'Giường theo dõi sau CC 4', 'CC-G11', 'EMERGENCY', 'EMPTY', 'Giường theo dõi sau cấp cứu (lưu viện ngắn)'),

-- ═══════════════════════════════════════════════════════════════
-- 2.6  Khoa ICU — 9 giường (type: ICU, có monitor riêng)
-- ═══════════════════════════════════════════════════════════════
('BED_ICU_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_01', 'Giường ICU 1',          'ICU-G01', 'ICU', 'EMPTY', 'Giường ICU chuyên dụng Hill-Rom, tích hợp cân nặng, đệm chống loét'),
('BED_ICU_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_01', 'Giường ICU 2',          'ICU-G02', 'ICU', 'EMPTY', 'Giường ICU chuyên dụng Hill-Rom, tích hợp cân nặng, đệm chống loét'),
('BED_ICU_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_01', 'Giường ICU 3',          'ICU-G03', 'ICU', 'EMPTY', 'Giường ICU chuyên dụng Hill-Rom, tích hợp cân nặng, đệm chống loét'),
('BED_ICU_04', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_01', 'Giường ICU 4',          'ICU-G04', 'ICU', 'EMPTY', 'Giường ICU chuyên dụng Hill-Rom, tích hợp cân nặng, đệm chống loét'),
('BED_ICU_05', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_02', 'Giường đặc biệt 1',    'ICU-G05', 'ICU', 'EMPTY', 'Giường theo dõi đặc biệt, cách ly, có monitor riêng'),
('BED_ICU_06', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_02', 'Giường đặc biệt 2',    'ICU-G06', 'ICU', 'EMPTY', 'Giường theo dõi đặc biệt, cách ly, có monitor riêng'),
('BED_ICU_07', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_02', 'Giường đặc biệt 3',    'ICU-G07', 'ICU', 'EMPTY', 'Giường theo dõi đặc biệt, cách ly, có monitor riêng'),
('BED_ICU_08', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_04', 'Giường hồi sức TB 1',   'ICU-G08', 'ICU', 'EMPTY', 'Giường hồi sức thiết bị, gần máy thở + máy lọc máu'),
('BED_ICU_09', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_ICU', 'ROOM_ICU_04', 'Giường hồi sức TB 2',   'ICU-G09', 'ICU', 'EMPTY', 'Giường hồi sức thiết bị, gần máy thở + máy lọc máu');

-- ═══════════════════════════════════════════════════════════════
-- 2.7  Khoa Cấp cứu — Giường ICU tại phòng hồi sức CC
-- ═══════════════════════════════════════════════════════════════
INSERT INTO beds (bed_id, facility_id, branch_id, department_id, room_id, name, code, type, status, description) VALUES
('BED_CC_ICU_01', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_03', 'Giường hồi sức CC 1', 'CC-ICU-G01', 'ICU', 'EMPTY', 'Giường hồi sức cấp cứu, gắn máy thở + monitor'),
('BED_CC_ICU_02', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_03', 'Giường hồi sức CC 2', 'CC-ICU-G02', 'ICU', 'EMPTY', 'Giường hồi sức cấp cứu, gắn máy thở + monitor'),
('BED_CC_ICU_03', 'FAC_EHEALTH', 'BR_MAIN', 'DEPT_CC', 'ROOM_CC_03', 'Giường hồi sức CC 3', 'CC-ICU-G03', 'ICU', 'EMPTY', 'Giường hồi sức cấp cứu, gắn máy thở + monitor');

COMMIT;

-- =====================================================================
-- THỐNG KÊ SEED DATA
-- =====================================================================
-- medical_equipments:   60 thiết bị
--   Khoa Khám bệnh:     6 (đo HA, nhiệt kế, cân, SpO2, ống nghe, đèn khám)
--   Khoa Nội:            6 (điện tim, siêu âm, monitor x2, bơm tiêm, đường huyết)
--   Khoa Ngoại:          7 (bàn mổ, đèn mổ, gây mê, hút dịch, dao điện, monitor, xe băng)
--   Khoa Sản:            5 (SA 4D, monitoring, giường sanh, lồng ấp, đèn vàng da)
--   Khoa Nhi:            5 (khí dung, cân sơ sinh, monitor, tủ vaccine, bơm tiêm)
--   Khoa Cấp cứu:        7 (sốc điện, crash cart, monitor, máy thở, intubation, oxy, hút đờm)
--   Khoa ICU:             6 (máy thở x2, monitor x2, lọc máu, bơm truyền)
--   Khoa XN:              7 (huyết học, sinh hóa, nước tiểu, cấy máu, miễn dịch, ly tâm, đông máu)
--   Khoa CĐHA:            5 (X-quang, CT, MRI, SA tổng quát, SA Doppler)
--   Khoa Dược:            6 (tủ lạnh x2, đóng gói, mã vạch x2, ẩm kế)
--
-- beds:                  65 giường
--   Khoa Nội:            10 (6 nội trú + 4 theo dõi)
--   Khoa Ngoại:           7 (3 tiền phẫu + 4 hậu phẫu)
--   Khoa Sản:            10 (4 hậu sản + 6 nôi sơ sinh)
--   Khoa Nhi:             9 (6 nội trú + 3 theo dõi)
--   Khoa Cấp cứu:        14 (3 tiếp nhận + 4 CC chính + 4 theo dõi + 3 hồi sức ICU)
--   Khoa ICU:             9 (4 ICU chính + 3 đặc biệt + 2 hồi sức TB)
-- =====================================================================
