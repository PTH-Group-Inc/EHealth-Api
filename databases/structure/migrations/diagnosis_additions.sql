-- =====================================================================
-- MODULE 4.3: Bổ sung cột cho bảng encounter_diagnoses & encounters
-- =====================================================================

-- 1. updated_at — track cập nhật chẩn đoán
ALTER TABLE encounter_diagnoses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. is_active — soft delete chẩn đoán
ALTER TABLE encounter_diagnoses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Kết luận khám — lưu trên encounters
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS conclusion TEXT;

-- Index
CREATE INDEX IF NOT EXISTS idx_encounter_diagnoses_active ON encounter_diagnoses(encounter_id, is_active);

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_DIAG_CREATE',        'EMR', 'POST',   '/api/diagnoses/:encounterId',             'Thêm chẩn đoán cho encounter'),
('API_DIAG_LIST',          'EMR', 'GET',    '/api/diagnoses/:encounterId',             'Lấy danh sách chẩn đoán của encounter'),
('API_DIAG_UPDATE',        'EMR', 'PATCH',  '/api/diagnoses/:diagnosisId',             'Cập nhật chẩn đoán'),
('API_DIAG_DELETE',        'EMR', 'DELETE', '/api/diagnoses/:diagnosisId',             'Xóa (soft) chẩn đoán'),
('API_DIAG_CHANGE_TYPE',   'EMR', 'PATCH',  '/api/diagnoses/:diagnosisId/type',        'Chuyển loại chẩn đoán'),
('API_DIAG_SET_CONCLUSION','EMR', 'PUT',    '/api/diagnoses/:encounterId/conclusion',  'Ghi kết luận khám'),
('API_DIAG_GET_CONCLUSION','EMR', 'GET',    '/api/diagnoses/:encounterId/conclusion',  'Lấy kết luận khám'),
('API_DIAG_BY_PATIENT',    'EMR', 'GET',    '/api/diagnoses/by-patient/:patientId',    'Lịch sử chẩn đoán theo BN'),
('API_DIAG_SEARCH_ICD',    'EMR', 'GET',    '/api/diagnoses/search-icd',               'Tìm kiếm mã ICD-10')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_DIAG_CREATE', 'API_DIAG_LIST', 'API_DIAG_UPDATE', 'API_DIAG_DELETE',
    'API_DIAG_CHANGE_TYPE', 'API_DIAG_SET_CONCLUSION', 'API_DIAG_GET_CONCLUSION',
    'API_DIAG_BY_PATIENT', 'API_DIAG_SEARCH_ICD'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: CRUD + finalize + conclusion + search
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_DIAG_CREATE', 'API_DIAG_LIST', 'API_DIAG_UPDATE', 'API_DIAG_DELETE',
    'API_DIAG_CHANGE_TYPE', 'API_DIAG_SET_CONCLUSION', 'API_DIAG_GET_CONCLUSION',
    'API_DIAG_BY_PATIENT', 'API_DIAG_SEARCH_ICD'
  )
ON CONFLICT DO NOTHING;

-- NURSE: xem + search
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN ('API_DIAG_LIST', 'API_DIAG_GET_CONCLUSION', 'API_DIAG_BY_PATIENT', 'API_DIAG_SEARCH_ICD')
ON CONFLICT DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN ('API_DIAG_LIST', 'API_DIAG_GET_CONCLUSION')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_DIAG_VIEW',   'EMR_DIAGNOSIS_VIEW',   'EMR', 'Xem chẩn đoán & kết luận khám'),
    ('PERM_DIAG_CREATE', 'EMR_DIAGNOSIS_CREATE', 'EMR', 'Thêm chẩn đoán mới'),
    ('PERM_DIAG_EDIT',   'EMR_DIAGNOSIS_EDIT',   'EMR', 'Sửa, xóa, chuyển loại chẩn đoán, ghi kết luận')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EMR_DIAGNOSIS_VIEW', 'EMR_DIAGNOSIS_CREATE', 'EMR_DIAGNOSIS_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EMR_DIAGNOSIS_VIEW', 'EMR_DIAGNOSIS_CREATE', 'EMR_DIAGNOSIS_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EMR_DIAGNOSIS_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EMR_DIAGNOSIS_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- ICD-10 SEED DATA (Danh mục mã bệnh phổ biến tại phòng khám)
-- ==============================================================================

-- Tạo category ICD10 trước
INSERT INTO master_data_categories (master_data_categories_id, code, name, description)
VALUES ('MDC_ICD10', 'ICD10', 'Mã bệnh ICD-10', 'Danh mục mã bệnh quốc tế ICD-10 phổ biến')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_data_items (master_data_items_id, category_code, code, value, sort_order, is_active) VALUES
-- Bệnh truyền nhiễm
('MDI_ICD_A09',  'ICD10', 'A09',  'Tiêu chảy và viêm dạ dày ruột',                1, TRUE),
('MDI_ICD_B34',  'ICD10', 'B34',  'Nhiễm virus không xác định vị trí',             2, TRUE),
-- Bướu tân sinh
('MDI_ICD_D50',  'ICD10', 'D50',  'Thiếu máu do thiếu sắt',                        3, TRUE),
-- Nội tiết, dinh dưỡng
('MDI_ICD_E11',  'ICD10', 'E11',  'Đái tháo đường type 2',                         4, TRUE),
('MDI_ICD_E78',  'ICD10', 'E78',  'Rối loạn chuyển hóa lipoprotein',               5, TRUE),
-- Rối loạn tâm thần
('MDI_ICD_F32',  'ICD10', 'F32',  'Giai đoạn trầm cảm',                            6, TRUE),
('MDI_ICD_F41',  'ICD10', 'F41',  'Rối loạn lo âu khác',                           7, TRUE),
-- Thần kinh
('MDI_ICD_G43',  'ICD10', 'G43',  'Migraine (Đau nửa đầu)',                        8, TRUE),
('MDI_ICD_G47',  'ICD10', 'G47',  'Rối loạn giấc ngủ',                             9, TRUE),
-- Tuần hoàn
('MDI_ICD_I10',  'ICD10', 'I10',  'Tăng huyết áp vô căn (nguyên phát)',           10, TRUE),
('MDI_ICD_I25',  'ICD10', 'I25',  'Bệnh tim thiếu máu cục bộ mạn tính',          11, TRUE),
('MDI_ICD_I48',  'ICD10', 'I48',  'Rung nhĩ và cuồng nhĩ',                        12, TRUE),
('MDI_ICD_I50',  'ICD10', 'I50',  'Suy tim',                                       13, TRUE),
-- Hô hấp
('MDI_ICD_J06',  'ICD10', 'J06',  'Nhiễm trùng hô hấp trên cấp tính',            14, TRUE),
('MDI_ICD_J18',  'ICD10', 'J18',  'Viêm phổi không xác định tác nhân',            15, TRUE),
('MDI_ICD_J20',  'ICD10', 'J20',  'Viêm phế quản cấp',                            16, TRUE),
('MDI_ICD_J45',  'ICD10', 'J45',  'Hen phế quản',                                 17, TRUE),
-- Tiêu hóa
('MDI_ICD_K21',  'ICD10', 'K21',  'Bệnh trào ngược dạ dày - thực quản (GERD)',    18, TRUE),
('MDI_ICD_K29',  'ICD10', 'K29',  'Viêm dạ dày và viêm tá tràng',                19, TRUE),
('MDI_ICD_K35',  'ICD10', 'K35',  'Viêm ruột thừa cấp',                           20, TRUE),
('MDI_ICD_K80',  'ICD10', 'K80',  'Sỏi mật',                                      21, TRUE),
-- Cơ xương khớp
('MDI_ICD_M54',  'ICD10', 'M54',  'Đau lưng',                                     22, TRUE),
('MDI_ICD_M79',  'ICD10', 'M79',  'Đau cơ xương khớp không xác định',             23, TRUE),
-- Tiết niệu - Sinh dục
('MDI_ICD_N39',  'ICD10', 'N39',  'Nhiễm trùng đường tiết niệu',                  24, TRUE),
('MDI_ICD_N40',  'ICD10', 'N40',  'Phì đại tuyến tiền liệt',                      25, TRUE),
-- Chấn thương
('MDI_ICD_S00',  'ICD10', 'S00',  'Chấn thương nông ở đầu',                       26, TRUE),
('MDI_ICD_S61',  'ICD10', 'S61',  'Vết thương hở ở cổ tay và bàn tay',            27, TRUE),
-- Triệu chứng chung
('MDI_ICD_R05',  'ICD10', 'R05',  'Ho',                                            28, TRUE),
('MDI_ICD_R10',  'ICD10', 'R10',  'Đau bụng',                                     29, TRUE),
('MDI_ICD_R50',  'ICD10', 'R50',  'Sốt không rõ nguyên nhân',                     30, TRUE),
('MDI_ICD_R51',  'ICD10', 'R51',  'Đau đầu',                                      31, TRUE)
ON CONFLICT DO NOTHING;
