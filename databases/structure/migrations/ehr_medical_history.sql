-- ==============================================================================
-- MODULE 6.3: TIỀN SỬ BỆNH & YẾU TỐ NGUY CƠ (Medical History & Risk Factors)
-- ==============================================================================

-- 1. Bảng mới: Yếu tố nguy cơ
CREATE TABLE IF NOT EXISTS patient_risk_factors (
    risk_factor_id       VARCHAR(50) PRIMARY KEY,
    patient_id           VARCHAR(50) NOT NULL,
    factor_type          VARCHAR(50) NOT NULL,        -- SMOKING, ALCOHOL, OCCUPATION, LIFESTYLE, GENETIC, OTHER
    severity             VARCHAR(20) DEFAULT 'LOW',   -- LOW, MODERATE, HIGH
    details              TEXT NOT NULL,
    start_date           DATE,
    end_date             DATE,
    is_active            BOOLEAN DEFAULT TRUE,
    recorded_by          VARCHAR(50),
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMPTZ,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_prf_patient ON patient_risk_factors(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prf_type ON patient_risk_factors(factor_type) WHERE deleted_at IS NULL;

-- 2. Bảng mới: Tình trạng đặc biệt
CREATE TABLE IF NOT EXISTS patient_special_conditions (
    special_condition_id VARCHAR(50) PRIMARY KEY,
    patient_id           VARCHAR(50) NOT NULL,
    condition_type       VARCHAR(50) NOT NULL,        -- PREGNANCY, DISABILITY, IMPLANT, TRANSPLANT, INFECTIOUS, MENTAL_HEALTH, OTHER
    description          TEXT NOT NULL,
    start_date           DATE,
    end_date             DATE,
    is_active            BOOLEAN DEFAULT TRUE,
    recorded_by          VARCHAR(50),
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMPTZ,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_psc_patient ON patient_special_conditions(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_psc_type ON patient_special_conditions(condition_type) WHERE deleted_at IS NULL;

-- 3. Bổ sung cột cho patient_medical_histories (tiền sử bệnh)
ALTER TABLE patient_medical_histories
    ADD COLUMN IF NOT EXISTS relationship VARCHAR(50),       -- FATHER, MOTHER, SIBLING... (chỉ dùng khi history_type=FAMILY)
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pmh_patient ON patient_medical_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_pmh_type ON patient_medical_histories(history_type);

-- 4. Bổ sung cột cho patient_allergies (dị ứng)
ALTER TABLE patient_allergies
    ADD COLUMN IF NOT EXISTS reported_by VARCHAR(50) REFERENCES users(users_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pa_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_pa_type ON patient_allergies(allergen_type);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_HISTORY_VIEW',  'EHR_HISTORY_VIEW',  'EHR', 'Xem tiền sử bệnh, dị ứng, yếu tố nguy cơ, tình trạng đặc biệt'),
('PERM_EHR_HISTORY_EDIT',  'EHR_HISTORY_EDIT',  'EHR', 'Thêm/sửa/xóa tiền sử bệnh, dị ứng, yếu tố nguy cơ, tình trạng đặc biệt')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS
-- ==============================================================================

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EHR_HISTORY_VIEW','EHR_HISTORY_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EHR_HISTORY_VIEW','EHR_HISTORY_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EHR_HISTORY_VIEW','EHR_HISTORY_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EHR_HISTORY_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: chỉ xem (dị ứng)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('EHR_HISTORY_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm A: Tiền sử bệnh
('API_EHR_HIST_LIST',           'EHR', 'GET',    '/api/ehr/patients/:patientId/medical-histories',                   'Danh sách tiền sử bệnh'),
('API_EHR_HIST_DETAIL',         'EHR', 'GET',    '/api/ehr/patients/:patientId/medical-histories/:historyId',        'Chi tiết tiền sử bệnh'),
('API_EHR_HIST_CREATE',         'EHR', 'POST',   '/api/ehr/patients/:patientId/medical-histories',                   'Thêm tiền sử bệnh'),
('API_EHR_HIST_UPDATE',         'EHR', 'PUT',    '/api/ehr/patients/:patientId/medical-histories/:historyId',        'Cập nhật tiền sử bệnh'),
('API_EHR_HIST_STATUS',         'EHR', 'PATCH',  '/api/ehr/patients/:patientId/medical-histories/:historyId/status', 'Đổi trạng thái tiền sử'),
('API_EHR_HIST_DELETE',         'EHR', 'DELETE', '/api/ehr/patients/:patientId/medical-histories/:historyId',        'Xóa tiền sử bệnh'),
-- Nhóm B: Dị ứng
('API_EHR_ALLERGY_LIST',        'EHR', 'GET',    '/api/ehr/patients/:patientId/allergies',                           'Danh sách dị ứng'),
('API_EHR_ALLERGY_DETAIL',      'EHR', 'GET',    '/api/ehr/patients/:patientId/allergies/:allergyId',                'Chi tiết dị ứng'),
('API_EHR_ALLERGY_CREATE',      'EHR', 'POST',   '/api/ehr/patients/:patientId/allergies',                           'Thêm dị ứng'),
('API_EHR_ALLERGY_UPDATE',      'EHR', 'PUT',    '/api/ehr/patients/:patientId/allergies/:allergyId',                'Cập nhật dị ứng'),
('API_EHR_ALLERGY_DELETE',      'EHR', 'DELETE', '/api/ehr/patients/:patientId/allergies/:allergyId',                'Xóa dị ứng'),
-- Nhóm C: Yếu tố nguy cơ
('API_EHR_RISK_LIST',           'EHR', 'GET',    '/api/ehr/patients/:patientId/risk-factors',                        'Danh sách yếu tố nguy cơ'),
('API_EHR_RISK_CREATE',         'EHR', 'POST',   '/api/ehr/patients/:patientId/risk-factors',                        'Thêm yếu tố nguy cơ'),
('API_EHR_RISK_UPDATE',         'EHR', 'PUT',    '/api/ehr/patients/:patientId/risk-factors/:factorId',              'Cập nhật yếu tố nguy cơ'),
('API_EHR_RISK_DELETE',         'EHR', 'DELETE', '/api/ehr/patients/:patientId/risk-factors/:factorId',              'Xóa yếu tố nguy cơ'),
-- Nhóm D: Tình trạng đặc biệt
('API_EHR_SPECIAL_LIST',        'EHR', 'GET',    '/api/ehr/patients/:patientId/special-conditions',                  'Danh sách tình trạng đặc biệt'),
('API_EHR_SPECIAL_CREATE',      'EHR', 'POST',   '/api/ehr/patients/:patientId/special-conditions',                  'Thêm tình trạng đặc biệt'),
('API_EHR_SPECIAL_DELETE',      'EHR', 'DELETE', '/api/ehr/patients/:patientId/special-conditions/:conditionId',     'Xóa tình trạng đặc biệt')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full 18 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_EHR_HIST_LIST','API_EHR_HIST_DETAIL','API_EHR_HIST_CREATE','API_EHR_HIST_UPDATE','API_EHR_HIST_STATUS','API_EHR_HIST_DELETE',
    'API_EHR_ALLERGY_LIST','API_EHR_ALLERGY_DETAIL','API_EHR_ALLERGY_CREATE','API_EHR_ALLERGY_UPDATE','API_EHR_ALLERGY_DELETE',
    'API_EHR_RISK_LIST','API_EHR_RISK_CREATE','API_EHR_RISK_UPDATE','API_EHR_RISK_DELETE',
    'API_EHR_SPECIAL_LIST','API_EHR_SPECIAL_CREATE','API_EHR_SPECIAL_DELETE'
) ON CONFLICT DO NOTHING;

-- DOCTOR: full 18 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_EHR_HIST_LIST','API_EHR_HIST_DETAIL','API_EHR_HIST_CREATE','API_EHR_HIST_UPDATE','API_EHR_HIST_STATUS','API_EHR_HIST_DELETE',
    'API_EHR_ALLERGY_LIST','API_EHR_ALLERGY_DETAIL','API_EHR_ALLERGY_CREATE','API_EHR_ALLERGY_UPDATE','API_EHR_ALLERGY_DELETE',
    'API_EHR_RISK_LIST','API_EHR_RISK_CREATE','API_EHR_RISK_UPDATE','API_EHR_RISK_DELETE',
    'API_EHR_SPECIAL_LIST','API_EHR_SPECIAL_CREATE','API_EHR_SPECIAL_DELETE'
) ON CONFLICT DO NOTHING;

-- NURSE: xem + thêm/sửa (không xóa)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_EHR_HIST_LIST','API_EHR_HIST_DETAIL','API_EHR_HIST_CREATE','API_EHR_HIST_UPDATE','API_EHR_HIST_STATUS',
    'API_EHR_ALLERGY_LIST','API_EHR_ALLERGY_DETAIL','API_EHR_ALLERGY_CREATE','API_EHR_ALLERGY_UPDATE',
    'API_EHR_RISK_LIST','API_EHR_RISK_CREATE','API_EHR_RISK_UPDATE',
    'API_EHR_SPECIAL_LIST','API_EHR_SPECIAL_CREATE'
) ON CONFLICT DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_EHR_HIST_LIST','API_EHR_HIST_DETAIL',
    'API_EHR_ALLERGY_LIST','API_EHR_ALLERGY_DETAIL',
    'API_EHR_RISK_LIST',
    'API_EHR_SPECIAL_LIST'
) ON CONFLICT DO NOTHING;

-- PHARMACIST: xem dị ứng + tiền sử
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_EHR_HIST_LIST','API_EHR_HIST_DETAIL',
    'API_EHR_ALLERGY_LIST','API_EHR_ALLERGY_DETAIL'
) ON CONFLICT DO NOTHING;
