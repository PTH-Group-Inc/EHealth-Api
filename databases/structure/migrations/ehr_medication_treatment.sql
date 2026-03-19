-- ==============================================================================
-- MODULE 6.5: HỒ SƠ ĐƠN THUỐC & ĐIỀU TRỊ (Medication & Treatment Records)
-- ==============================================================================

-- 1. Bảng mới: Theo dõi tuân thủ dùng thuốc
CREATE TABLE IF NOT EXISTS ehr_medication_adherence (
    adherence_id             VARCHAR(50) PRIMARY KEY,
    patient_id               VARCHAR(50) NOT NULL,
    prescription_detail_id   VARCHAR(50) NOT NULL,
    adherence_date           DATE NOT NULL,
    taken                    BOOLEAN NOT NULL DEFAULT TRUE,
    skip_reason              TEXT,
    recorded_by              VARCHAR(50),
    created_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_detail_id) REFERENCES prescription_details(prescription_details_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ema_patient ON ehr_medication_adherence(patient_id);
CREATE INDEX IF NOT EXISTS idx_ema_detail ON ehr_medication_adherence(prescription_detail_id);
CREATE INDEX IF NOT EXISTS idx_ema_date ON ehr_medication_adherence(adherence_date);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_MEDICATION_VIEW', 'EHR_MEDICATION_VIEW', 'EHR', 'Xem lịch sử thuốc, điều trị, tuân thủ (EHR)'),
('PERM_EHR_MEDICATION_EDIT', 'EHR_MEDICATION_EDIT', 'EHR', 'Ghi nhận tuân thủ dùng thuốc (EHR)')
ON CONFLICT DO NOTHING;

-- ROLE → JWT PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('ADMIN','DOCTOR','NURSE') AND p.code IN ('EHR_MEDICATION_VIEW','EHR_MEDICATION_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('STAFF','PHARMACIST') AND p.code = 'EHR_MEDICATION_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EHR_MED_LIST',          'EHR', 'GET',  '/api/ehr/patients/:patientId/medication-records',                        'Lịch sử đơn thuốc'),
('API_EHR_MED_DETAIL',        'EHR', 'GET',  '/api/ehr/patients/:patientId/medication-records/:prescriptionId',        'Chi tiết đơn thuốc'),
('API_EHR_MED_CURRENT',       'EHR', 'GET',  '/api/ehr/patients/:patientId/medication-records/current',                'Thuốc đang sử dụng'),
('API_EHR_TREAT_LIST',        'EHR', 'GET',  '/api/ehr/patients/:patientId/treatment-records',                         'Lịch sử điều trị'),
('API_EHR_TREAT_DETAIL',      'EHR', 'GET',  '/api/ehr/patients/:patientId/treatment-records/:planId',                 'Chi tiết kế hoạch điều trị'),
('API_EHR_MED_INTERACT',      'EHR', 'GET',  '/api/ehr/patients/:patientId/medication-records/interaction-check',      'Cảnh báo tương tác thuốc'),
('API_EHR_ADHERE_CREATE',     'EHR', 'POST', '/api/ehr/patients/:patientId/medication-adherence',                      'Ghi nhận tuân thủ'),
('API_EHR_ADHERE_LIST',       'EHR', 'GET',  '/api/ehr/patients/:patientId/medication-adherence',                      'Lịch sử tuân thủ'),
('API_EHR_MED_TIMELINE',      'EHR', 'GET',  '/api/ehr/patients/:patientId/medication-records/timeline',               'Timeline thuốc + điều trị')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN, DOCTOR, NURSE: full 9 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','DOCTOR','NURSE') AND a.api_id IN (
    'API_EHR_MED_LIST','API_EHR_MED_DETAIL','API_EHR_MED_CURRENT',
    'API_EHR_TREAT_LIST','API_EHR_TREAT_DETAIL','API_EHR_MED_INTERACT',
    'API_EHR_ADHERE_CREATE','API_EHR_ADHERE_LIST','API_EHR_MED_TIMELINE'
) ON CONFLICT DO NOTHING;

-- STAFF: read-only hạn chế
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_EHR_MED_LIST','API_EHR_TREAT_LIST','API_EHR_MED_TIMELINE'
) ON CONFLICT DO NOTHING;

-- PHARMACIST: xem thuốc + tương tác
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_EHR_MED_LIST','API_EHR_MED_DETAIL','API_EHR_MED_CURRENT','API_EHR_MED_INTERACT'
) ON CONFLICT DO NOTHING;
