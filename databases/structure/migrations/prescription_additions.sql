-- =====================================================================
-- MODULE 4.5: KÊ ĐƠN THUỐC (PRESCRIPTION MANAGEMENT)
-- Bổ sung cột cho bảng prescriptions & prescription_details
-- =====================================================================

-- 1. UNIQUE constraint: 1 encounter = 1 đơn thuốc
ALTER TABLE prescriptions
    ADD CONSTRAINT uq_prescriptions_encounter UNIQUE (encounter_id);

-- 2. Liên kết chẩn đoán chính
ALTER TABLE prescriptions
    ADD COLUMN primary_diagnosis_id VARCHAR(50) NULL
        REFERENCES encounter_diagnoses(encounter_diagnoses_id) ON DELETE SET NULL;

-- 3. Timestamps quản lý vòng đời
ALTER TABLE prescriptions
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN cancelled_at TIMESTAMPTZ NULL,
    ADD COLUMN cancelled_reason TEXT NULL;

-- 4. Index tối ưu truy vấn
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

-- =====================================================================
-- PRESCRIPTION DETAILS — Bổ sung cột
-- =====================================================================

-- 1. Đường dùng thuốc + ghi chú BS
ALTER TABLE prescription_details
    ADD COLUMN route_of_administration VARCHAR(50) NULL,
    ADD COLUMN notes TEXT NULL;

-- 2. Sắp xếp + soft delete
ALTER TABLE prescription_details
    ADD COLUMN sort_order INT DEFAULT 0,
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- 3. Timestamps
ALTER TABLE prescription_details
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Index cho tìm kiếm dòng thuốc theo đơn
CREATE INDEX idx_prescription_details_prescription ON prescription_details(prescription_id);
CREATE INDEX idx_prescription_details_drug ON prescription_details(drug_id);

-- ==============================================================================
-- JWT PERMISSIONS (bảng permissions: code, module, description)
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EMR_PRESCRIPTION_CREATE', 'EMR_PRESCRIPTION_CREATE', 'EMR', 'Tạo đơn thuốc cho encounter'),
('PERM_EMR_PRESCRIPTION_VIEW',   'EMR_PRESCRIPTION_VIEW',   'EMR', 'Xem đơn thuốc, lịch sử, tóm tắt, tìm kiếm thuốc'),
('PERM_EMR_PRESCRIPTION_EDIT',   'EMR_PRESCRIPTION_EDIT',   'EMR', 'Sửa/xác nhận/hủy đơn thuốc, CRUD dòng thuốc')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS (bảng role_permissions)
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EMR_PRESCRIPTION_CREATE','EMR_PRESCRIPTION_VIEW','EMR_PRESCRIPTION_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EMR_PRESCRIPTION_CREATE','EMR_PRESCRIPTION_VIEW','EMR_PRESCRIPTION_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EMR_PRESCRIPTION_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: chỉ xem (cấp phát thuốc thuộc module Pharmacy riêng)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('EMR_PRESCRIPTION_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EMR_PRESCRIPTION_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS (bảng api_permissions: api_id, method, endpoint)
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EMR_RX_CREATE',       'EMR', 'POST',   '/api/prescriptions/:encounterId',              'Tạo đơn thuốc cho encounter'),
('API_EMR_RX_GET_ENC',      'EMR', 'GET',    '/api/prescriptions/:encounterId',              'Lấy đơn thuốc theo encounter'),
('API_EMR_RX_UPDATE',       'EMR', 'PATCH',  '/api/prescriptions/:prescriptionId/update',    'Cập nhật header đơn thuốc'),
('API_EMR_RX_CONFIRM',      'EMR', 'PATCH',  '/api/prescriptions/:prescriptionId/confirm',   'Xác nhận đơn thuốc DRAFT → PRESCRIBED'),
('API_EMR_RX_CANCEL',       'EMR', 'PATCH',  '/api/prescriptions/:prescriptionId/cancel',    'Hủy đơn thuốc'),
('API_EMR_RX_PATIENT',      'EMR', 'GET',    '/api/prescriptions/by-patient/:patientId',     'Lịch sử đơn thuốc theo bệnh nhân'),
('API_EMR_RX_ADD_DETAIL',   'EMR', 'POST',   '/api/prescriptions/:prescriptionId/details',   'Thêm dòng thuốc vào đơn'),
('API_EMR_RX_UPD_DETAIL',   'EMR', 'PATCH',  '/api/prescriptions/details/:detailId',         'Sửa dòng thuốc'),
('API_EMR_RX_DEL_DETAIL',   'EMR', 'DELETE', '/api/prescriptions/details/:detailId',         'Xóa dòng thuốc (soft delete)'),
('API_EMR_RX_GET_DETAILS',  'EMR', 'GET',    '/api/prescriptions/:prescriptionId/details',   'Danh sách dòng thuốc trong đơn'),
('API_EMR_RX_SEARCH_DRUGS', 'EMR', 'GET',    '/api/prescriptions/search-drugs',              'Tìm kiếm thuốc (autocomplete)'),
('API_EMR_RX_SUMMARY',      'EMR', 'GET',    '/api/prescriptions/:encounterId/summary',      'Tóm tắt đơn thuốc cho encounter')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS (bảng role_api_permissions)
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_EMR_RX_CREATE', 'API_EMR_RX_GET_ENC', 'API_EMR_RX_UPDATE',
    'API_EMR_RX_CONFIRM', 'API_EMR_RX_CANCEL', 'API_EMR_RX_PATIENT',
    'API_EMR_RX_ADD_DETAIL', 'API_EMR_RX_UPD_DETAIL', 'API_EMR_RX_DEL_DETAIL',
    'API_EMR_RX_GET_DETAILS', 'API_EMR_RX_SEARCH_DRUGS', 'API_EMR_RX_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_EMR_RX_CREATE', 'API_EMR_RX_GET_ENC', 'API_EMR_RX_UPDATE',
    'API_EMR_RX_CONFIRM', 'API_EMR_RX_CANCEL', 'API_EMR_RX_PATIENT',
    'API_EMR_RX_ADD_DETAIL', 'API_EMR_RX_UPD_DETAIL', 'API_EMR_RX_DEL_DETAIL',
    'API_EMR_RX_GET_DETAILS', 'API_EMR_RX_SEARCH_DRUGS', 'API_EMR_RX_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- NURSE: chỉ xem đơn + danh sách dòng thuốc + tóm tắt
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN (
    'API_EMR_RX_GET_ENC', 'API_EMR_RX_PATIENT',
    'API_EMR_RX_GET_DETAILS', 'API_EMR_RX_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- PHARMACIST: xem đơn + dòng thuốc (để cấp phát thuốc)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST'
  AND a.api_id IN (
    'API_EMR_RX_GET_ENC', 'API_EMR_RX_PATIENT',
    'API_EMR_RX_GET_DETAILS', 'API_EMR_RX_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- STAFF: chỉ xem cơ bản
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN ('API_EMR_RX_GET_ENC', 'API_EMR_RX_GET_DETAILS')
ON CONFLICT DO NOTHING;
