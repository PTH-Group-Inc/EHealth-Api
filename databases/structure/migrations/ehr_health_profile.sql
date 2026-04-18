-- =====================================================================
-- MODULE 6.1: HỒ SƠ SỨC KHỎE TỔNG HỢP (EHR — Patient Health Profile)
-- Mục đích: Lưu metadata EHR + cảnh báo y tế thủ công cho bệnh nhân
-- =====================================================================

-- 1. Bảng metadata EHR — 1:1 với patients
-- Lưu ghi chú tổng hợp, mức rủi ro, thời điểm BS review gần nhất
CREATE TABLE IF NOT EXISTS ehr_health_profiles (
    ehr_profile_id       VARCHAR(50) PRIMARY KEY,
    patient_id           VARCHAR(50) NOT NULL UNIQUE,
    risk_level           VARCHAR(20) DEFAULT 'LOW',       -- LOW, MODERATE, HIGH, CRITICAL
    ehr_notes            TEXT,                              -- Ghi chú tổng hợp của BS
    last_reviewed_by     VARCHAR(50),                       -- BS xem xét gần nhất
    last_reviewed_at     TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (last_reviewed_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ehr_profiles_patient ON ehr_health_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_profiles_risk ON ehr_health_profiles(risk_level);

-- 2. Bảng cảnh báo y tế thủ công
-- Cảnh báo TỰ ĐỘNG được tính runtime (không lưu DB), chỉ cảnh báo THỦ CÔNG lưu ở đây
CREATE TABLE IF NOT EXISTS ehr_health_alerts (
    alert_id             VARCHAR(50) PRIMARY KEY,
    patient_id           VARCHAR(50) NOT NULL,
    alert_type           VARCHAR(50) NOT NULL,              -- MANUAL_NOTE, DRUG_WARNING, CONDITION_NOTE
    severity             VARCHAR(20) DEFAULT 'INFO',        -- INFO, WARNING, CRITICAL
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    created_by           VARCHAR(50) NOT NULL,
    is_active            BOOLEAN DEFAULT TRUE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMPTZ,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ehr_alerts_patient ON ehr_health_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_alerts_active ON ehr_health_alerts(patient_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ehr_alerts_severity ON ehr_health_alerts(severity) WHERE deleted_at IS NULL;

-- ==============================================================================
-- JWT PERMISSIONS (bảng permissions: code, module, description)
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_PROFILE_VIEW',    'EHR_PROFILE_VIEW',    'EHR', 'Xem hồ sơ sức khỏe tổng hợp bệnh nhân'),
('PERM_EHR_PROFILE_EDIT',    'EHR_PROFILE_EDIT',    'EHR', 'Cập nhật ghi chú & mức rủi ro EHR'),
('PERM_EHR_ALERT_VIEW',      'EHR_ALERT_VIEW',      'EHR', 'Xem danh sách cảnh báo y tế'),
('PERM_EHR_ALERT_CREATE',    'EHR_ALERT_CREATE',    'EHR', 'Thêm cảnh báo y tế thủ công'),
('PERM_EHR_ALERT_MANAGE',    'EHR_ALERT_MANAGE',    'EHR', 'Cập nhật và xóa cảnh báo y tế thủ công')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS (bảng role_permissions)
-- ==============================================================================

-- ADMIN: full quyền EHR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EHR_PROFILE_VIEW','EHR_PROFILE_EDIT','EHR_ALERT_VIEW','EHR_ALERT_CREATE','EHR_ALERT_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full quyền EHR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EHR_PROFILE_VIEW','EHR_PROFILE_EDIT','EHR_ALERT_VIEW','EHR_ALERT_CREATE','EHR_ALERT_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem hồ sơ + xem cảnh báo
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EHR_PROFILE_VIEW','EHR_ALERT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: chỉ xem hồ sơ + cảnh báo
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EHR_PROFILE_VIEW','EHR_ALERT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: xem hồ sơ + cảnh báo (cần biết dị ứng, thuốc đang dùng)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('EHR_PROFILE_VIEW','EHR_ALERT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS (bảng api_permissions: api_id, module, method, endpoint)
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Hồ sơ sức khỏe tổng hợp (READ)
('API_EHR_PROFILE',          'EHR', 'GET',    '/api/ehr/patients/:patientId/profile',             'Hồ sơ sức khỏe tổng hợp (panorama)'),
('API_EHR_SUMMARY',          'EHR', 'GET',    '/api/ehr/patients/:patientId/health-summary',      'Tóm tắt sức khỏe nhanh'),
('API_EHR_VITALS',           'EHR', 'GET',    '/api/ehr/patients/:patientId/latest-vitals',       'Sinh hiệu lần khám gần nhất'),
('API_EHR_CONDITIONS',       'EHR', 'GET',    '/api/ehr/patients/:patientId/active-conditions',   'Bệnh lý đang hoạt động'),
('API_EHR_ALLERGIES',        'EHR', 'GET',    '/api/ehr/patients/:patientId/allergy-list',        'Danh sách dị ứng'),
('API_EHR_MEDICATIONS',      'EHR', 'GET',    '/api/ehr/patients/:patientId/current-medications', 'Thuốc đang sử dụng'),
('API_EHR_DIAGNOSES',        'EHR', 'GET',    '/api/ehr/patients/:patientId/diagnosis-history',   'Lịch sử chẩn đoán'),
('API_EHR_INSURANCE',        'EHR', 'GET',    '/api/ehr/patients/:patientId/insurance-status',    'Tình trạng bảo hiểm'),
-- Cảnh báo y tế
('API_EHR_ALERT_LIST',       'EHR', 'GET',    '/api/ehr/patients/:patientId/alerts',              'Danh sách cảnh báo y tế'),
('API_EHR_ALERT_CREATE',     'EHR', 'POST',   '/api/ehr/patients/:patientId/alerts',              'Thêm cảnh báo thủ công'),
('API_EHR_ALERT_UPDATE',     'EHR', 'PUT',    '/api/ehr/patients/:patientId/alerts/:alertId',     'Cập nhật cảnh báo thủ công'),
('API_EHR_ALERT_DELETE',     'EHR', 'DELETE', '/api/ehr/patients/:patientId/alerts/:alertId',     'Xóa cảnh báo thủ công'),
-- Ghi chú EHR
('API_EHR_NOTES_UPDATE',     'EHR', 'PUT',    '/api/ehr/patients/:patientId/notes',               'Cập nhật ghi chú & mức rủi ro EHR')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS (bảng role_api_permissions)
-- ==============================================================================

-- ADMIN: full quyền tất cả API
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_EHR_PROFILE', 'API_EHR_SUMMARY', 'API_EHR_VITALS',
    'API_EHR_CONDITIONS', 'API_EHR_ALLERGIES', 'API_EHR_MEDICATIONS',
    'API_EHR_DIAGNOSES', 'API_EHR_INSURANCE',
    'API_EHR_ALERT_LIST', 'API_EHR_ALERT_CREATE', 'API_EHR_ALERT_UPDATE', 'API_EHR_ALERT_DELETE',
    'API_EHR_NOTES_UPDATE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: full quyền tất cả API
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_EHR_PROFILE', 'API_EHR_SUMMARY', 'API_EHR_VITALS',
    'API_EHR_CONDITIONS', 'API_EHR_ALLERGIES', 'API_EHR_MEDICATIONS',
    'API_EHR_DIAGNOSES', 'API_EHR_INSURANCE',
    'API_EHR_ALERT_LIST', 'API_EHR_ALERT_CREATE', 'API_EHR_ALERT_UPDATE', 'API_EHR_ALERT_DELETE',
    'API_EHR_NOTES_UPDATE'
  )
ON CONFLICT DO NOTHING;

-- NURSE: xem hồ sơ + xem cảnh báo (không tạo/sửa/xóa cảnh báo, không sửa ghi chú)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN (
    'API_EHR_PROFILE', 'API_EHR_SUMMARY', 'API_EHR_VITALS',
    'API_EHR_CONDITIONS', 'API_EHR_ALLERGIES', 'API_EHR_MEDICATIONS',
    'API_EHR_DIAGNOSES', 'API_EHR_INSURANCE',
    'API_EHR_ALERT_LIST'
  )
ON CONFLICT DO NOTHING;

-- STAFF: xem hồ sơ cơ bản + cảnh báo
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN (
    'API_EHR_PROFILE', 'API_EHR_SUMMARY', 'API_EHR_VITALS',
    'API_EHR_CONDITIONS', 'API_EHR_ALLERGIES',
    'API_EHR_INSURANCE', 'API_EHR_ALERT_LIST'
  )
ON CONFLICT DO NOTHING;

-- PHARMACIST: xem tóm tắt, dị ứng, thuốc đang dùng, cảnh báo (cần cho kê đơn an toàn)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST'
  AND a.api_id IN (
    'API_EHR_SUMMARY', 'API_EHR_ALLERGIES', 'API_EHR_MEDICATIONS',
    'API_EHR_ALERT_LIST'
  )
ON CONFLICT DO NOTHING;
