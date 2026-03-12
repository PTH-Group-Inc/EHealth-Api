-- =========================================================================
-- MODULE 2.3 ENHANCEMENTS: NÂNG CẤP QUẢN LÝ BẢO HIỂM BỆNH NHÂN
-- Sub-modules: 2.3.3, 2.3.4, 2.3.5, 2.3.6, 2.3.7
-- =========================================================================

-- ==============================================================================
-- 1. TẠO BẢNG insurance_coverages (Danh mục tỷ lệ chi trả bảo hiểm)
--    Liên kết FK với insurance_providers
-- ==============================================================================

CREATE TABLE IF NOT EXISTS insurance_coverages (
    insurance_coverages_id VARCHAR(50) PRIMARY KEY,
    coverage_name VARCHAR(255) NOT NULL,           -- VD: "BHYT cơ bản", "VIP Gold"
    provider_id VARCHAR(50) NOT NULL REFERENCES insurance_providers(insurance_providers_id),
    coverage_percent NUMERIC(5,2) NOT NULL CHECK (coverage_percent >= 0 AND coverage_percent <= 100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. THÊM CỘT has_insurance VÀO BẢNG patients (Fast Billing Flag)
-- ==============================================================================

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT FALSE;

-- ==============================================================================
-- 3. API PERMISSIONS
-- ==============================================================================

-- 3.1 Insurance Coverages APIs (2.3.4)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_INS_COV_LIST',    'INSURANCE', 'GET',    '/api/insurance-coverage',     'Lấy danh sách tỷ lệ chi trả bảo hiểm'),
('API_INS_COV_CREATE',  'INSURANCE', 'POST',   '/api/insurance-coverage',     'Tạo tỷ lệ chi trả bảo hiểm'),
('API_INS_COV_UPDATE',  'INSURANCE', 'PUT',    '/api/insurance-coverage/:id', 'Cập nhật tỷ lệ chi trả bảo hiểm'),
('API_INS_COV_DELETE',  'INSURANCE', 'DELETE', '/api/insurance-coverage/:id', 'Xóa tỷ lệ chi trả bảo hiểm')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3.2 Patient Insurance Validity APIs (2.3.3)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PAT_INS_ACTIVE',  'INSURANCE', 'GET', '/api/patient-insurances/active',  'Danh sách bảo hiểm còn hiệu lực'),
('API_PAT_INS_EXPIRED', 'INSURANCE', 'GET', '/api/patient-insurances/expired', 'Danh sách bảo hiểm hết hạn')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3.3 Patient Insurance History API (2.3.6)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PAT_INS_HISTORY', 'INSURANCE', 'GET', '/api/patient-insurances/:id/history', 'Lịch sử thay đổi thẻ bảo hiểm')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3.4 Nested Patient Insurances APIs (2.3.5)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PAT_INS_BY_PAT_LIST',   'INSURANCE', 'GET',  '/api/patients/:patientId/insurances', 'DS thẻ BH của bệnh nhân'),
('API_PAT_INS_BY_PAT_CREATE', 'INSURANCE', 'POST', '/api/patients/:patientId/insurances', 'Thêm thẻ BH cho bệnh nhân')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3.5 Patient Insurance Status APIs (2.3.7)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PAT_INS_STATUS_UPDATE', 'INSURANCE', 'PATCH', '/api/patients/:id/insurance-status', 'Cập nhật trạng thái BH bệnh nhân'),
('API_PAT_WITH_INS',          'INSURANCE', 'GET',   '/api/patients/with-insurance',        'DS bệnh nhân CÓ bảo hiểm'),
('API_PAT_WITHOUT_INS',       'INSURANCE', 'GET',   '/api/patients/without-insurance',     'DS bệnh nhân KHÔNG CÓ bảo hiểm')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 4. ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: toàn quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_INS_COV_LIST', 'API_INS_COV_CREATE', 'API_INS_COV_UPDATE', 'API_INS_COV_DELETE',
    'API_PAT_INS_ACTIVE', 'API_PAT_INS_EXPIRED', 'API_PAT_INS_HISTORY',
    'API_PAT_INS_BY_PAT_LIST', 'API_PAT_INS_BY_PAT_CREATE',
    'API_PAT_INS_STATUS_UPDATE', 'API_PAT_WITH_INS', 'API_PAT_WITHOUT_INS'
  )
ON CONFLICT DO NOTHING;

-- STAFF: tạo, sửa, xem (không xóa coverage)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN (
    'API_INS_COV_LIST', 'API_INS_COV_CREATE', 'API_INS_COV_UPDATE',
    'API_PAT_INS_ACTIVE', 'API_PAT_INS_EXPIRED', 'API_PAT_INS_HISTORY',
    'API_PAT_INS_BY_PAT_LIST', 'API_PAT_INS_BY_PAT_CREATE',
    'API_PAT_INS_STATUS_UPDATE', 'API_PAT_WITH_INS', 'API_PAT_WITHOUT_INS'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_INS_COV_LIST',
    'API_PAT_INS_ACTIVE', 'API_PAT_INS_EXPIRED', 'API_PAT_INS_HISTORY',
    'API_PAT_INS_BY_PAT_LIST',
    'API_PAT_WITH_INS', 'API_PAT_WITHOUT_INS'
  )
ON CONFLICT DO NOTHING;

-- CUSTOMER & PATIENT: xem thẻ BH của mình, xem hiệu lực, xem lịch sử
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('CUSTOMER', 'PATIENT')
  AND a.api_id IN (
    'API_PAT_INS_ACTIVE', 'API_PAT_INS_EXPIRED', 'API_PAT_INS_HISTORY',
    'API_PAT_INS_BY_PAT_LIST'
  )
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. JWT PERMISSIONS
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_INS_COV_VIEW',   'INSURANCE_COVERAGE_VIEW',   'INSURANCE', 'Xem danh mục tỷ lệ chi trả bảo hiểm'),
    ('PERM_INS_COV_CREATE', 'INSURANCE_COVERAGE_CREATE', 'INSURANCE', 'Tạo tỷ lệ chi trả bảo hiểm'),
    ('PERM_INS_COV_UPDATE', 'INSURANCE_COVERAGE_UPDATE', 'INSURANCE', 'Cập nhật tỷ lệ chi trả bảo hiểm'),
    ('PERM_INS_COV_DELETE', 'INSURANCE_COVERAGE_DELETE', 'INSURANCE', 'Xóa tỷ lệ chi trả bảo hiểm')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 6. ROLE → JWT PERMISSIONS
-- ==============================================================================

-- ADMIN: toàn quyền Coverage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('INSURANCE_COVERAGE_VIEW', 'INSURANCE_COVERAGE_CREATE', 'INSURANCE_COVERAGE_UPDATE', 'INSURANCE_COVERAGE_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: xem, tạo, sửa
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('INSURANCE_COVERAGE_VIEW', 'INSURANCE_COVERAGE_CREATE', 'INSURANCE_COVERAGE_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR & NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND p.code IN ('INSURANCE_COVERAGE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;
