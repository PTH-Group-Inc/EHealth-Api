-- ==============================================================================
-- MODULE 4.8: KÝ SỐ & XÁC NHẬN HỒ SƠ Y KHOA (MEDICAL SIGN-OFF)
-- ==============================================================================

-- 1. Mở rộng bảng emr_signatures
ALTER TABLE emr_signatures
    DROP CONSTRAINT IF EXISTS emr_signatures_encounter_id_key;

ALTER TABLE emr_signatures
    ADD COLUMN IF NOT EXISTS sign_type VARCHAR(20) DEFAULT 'OFFICIAL',
    ADD COLUMN IF NOT EXISTS sign_scope VARCHAR(50) DEFAULT 'ENCOUNTER',
    ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS revoked_by VARCHAR(50),
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Unique: 1 scope chỉ có 1 OFFICIAL sign chưa bị revoke
CREATE UNIQUE INDEX IF NOT EXISTS idx_emr_sig_unique_official
ON emr_signatures (encounter_id, sign_scope)
WHERE sign_type = 'OFFICIAL' AND is_revoked = FALSE;

CREATE INDEX IF NOT EXISTS idx_emr_sig_sign_type ON emr_signatures(sign_type);
CREATE INDEX IF NOT EXISTS idx_emr_sig_scope ON emr_signatures(sign_scope);
CREATE INDEX IF NOT EXISTS idx_emr_sig_revoked ON emr_signatures(is_revoked);

-- 2. Bảng lịch sử hành động ký
CREATE TABLE emr_sign_audit_log (
    emr_sign_audit_log_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    sign_scope VARCHAR(50),
    details JSONB,
    client_ip VARCHAR(45),
    performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(users_id)
);

CREATE INDEX idx_sign_audit_encounter ON emr_sign_audit_log(encounter_id);
CREATE INDEX idx_sign_audit_action ON emr_sign_audit_log(action);
CREATE INDEX idx_sign_audit_date ON emr_sign_audit_log(performed_at DESC);

-- ==============================================================================
-- JWT PERMISSIONS (chỉ thêm mới, không trùng 4.6)
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EMR_SIGNOFF_COMPLETE', 'EMR_SIGNOFF_COMPLETE', 'EMR', 'Xác nhận hoàn tất khám → COMPLETED'),
('PERM_EMR_SIGNOFF_DRAFT',    'EMR_SIGNOFF_DRAFT',    'EMR', 'Ký nháp (review) hồ sơ y khoa'),
('PERM_EMR_SIGNOFF_REVOKE',   'EMR_SIGNOFF_REVOKE',   'EMR', 'Thu hồi chữ ký chính thức')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS
-- ==============================================================================

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EMR_SIGNOFF_COMPLETE','EMR_SIGNOFF_DRAFT','EMR_SIGNOFF_REVOKE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: complete + draft (không revoke)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EMR_SIGNOFF_COMPLETE','EMR_SIGNOFF_DRAFT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_SIGNOFF_COMPLETE',    'EMR', 'PATCH', '/api/sign-off/:encounterId/complete',      'Xác nhận hoàn tất khám'),
('API_SIGNOFF_DRAFT',       'EMR', 'POST',  '/api/sign-off/:encounterId/draft-sign',    'Ký nháp hồ sơ'),
('API_SIGNOFF_OFFICIAL',    'EMR', 'POST',  '/api/sign-off/:encounterId/official-sign', 'Ký chính thức hồ sơ'),
('API_SIGNOFF_REVOKE',      'EMR', 'POST',  '/api/sign-off/:encounterId/revoke',        'Thu hồi chữ ký'),
('API_SIGNOFF_SIGNATURES',  'EMR', 'GET',   '/api/sign-off/:encounterId/signatures',    'DS chữ ký encounter'),
('API_SIGNOFF_VERIFY',      'EMR', 'GET',   '/api/sign-off/:encounterId/verify',        'Xác minh tính toàn vẹn'),
('API_SIGNOFF_AUDIT',       'EMR', 'GET',   '/api/sign-off/:encounterId/audit-log',     'Lịch sử hành động ký'),
('API_SIGNOFF_LOCK_STATUS', 'EMR', 'GET',   '/api/sign-off/:encounterId/lock-status',   'Trạng thái khóa chỉnh sửa'),
('API_SIGNOFF_PENDING',     'EMR', 'GET',   '/api/sign-off/by-doctor/pending',          'DS encounter chờ ký')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_SIGNOFF_COMPLETE','API_SIGNOFF_DRAFT','API_SIGNOFF_OFFICIAL','API_SIGNOFF_REVOKE',
    'API_SIGNOFF_SIGNATURES','API_SIGNOFF_VERIFY','API_SIGNOFF_AUDIT','API_SIGNOFF_LOCK_STATUS','API_SIGNOFF_PENDING'
)
ON CONFLICT DO NOTHING;

-- DOCTOR: gần full (không revoke)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_SIGNOFF_COMPLETE','API_SIGNOFF_DRAFT','API_SIGNOFF_OFFICIAL',
    'API_SIGNOFF_SIGNATURES','API_SIGNOFF_VERIFY','API_SIGNOFF_AUDIT','API_SIGNOFF_LOCK_STATUS','API_SIGNOFF_PENDING'
)
ON CONFLICT DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_SIGNOFF_SIGNATURES','API_SIGNOFF_VERIFY','API_SIGNOFF_AUDIT','API_SIGNOFF_LOCK_STATUS'
)
ON CONFLICT DO NOTHING;

-- PHARMACIST: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_SIGNOFF_SIGNATURES','API_SIGNOFF_LOCK_STATUS'
)
ON CONFLICT DO NOTHING;
