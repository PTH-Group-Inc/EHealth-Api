-- *********************************************************************
-- MODULE 8.5: GHI NHẬN KẾT QUẢ KHÁM TỪ XA
-- (Teleconsultation Results)
-- *********************************************************************

-- =====================================================================
-- 1. tele_consultation_results — Kết quả khám từ xa
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_consultation_results (
    result_id                  VARCHAR(50) PRIMARY KEY,
    tele_consultation_id       VARCHAR(50) NOT NULL UNIQUE,
    encounter_id               VARCHAR(50),
    -- Triệu chứng BN mô tả
    chief_complaint            TEXT,
    symptom_description        TEXT,
    symptom_duration           VARCHAR(100),
    symptom_severity           VARCHAR(20),                         -- MILD, MODERATE, SEVERE
    self_reported_vitals       JSONB,                               -- {temp, pulse, bp_systolic, bp_diastolic, spo2, weight}
    -- Khám & Kết luận BS
    remote_examination_notes   TEXT,
    examination_limitations    TEXT,                                -- Giới hạn khám từ xa (bắt buộc y khoa)
    clinical_impression        TEXT,
    medical_conclusion         TEXT,
    conclusion_type            VARCHAR(30) DEFAULT 'PRELIMINARY',   -- PRELIMINARY, FINAL
    -- Tư vấn điều trị
    treatment_plan             TEXT,
    treatment_advice           TEXT,
    lifestyle_recommendations  TEXT,
    medication_notes           TEXT,
    referral_needed            BOOLEAN DEFAULT FALSE,
    referral_reason            TEXT,
    referral_specialty         VARCHAR(50),
    -- Follow-up
    follow_up_needed           BOOLEAN DEFAULT FALSE,
    follow_up_date             DATE,
    follow_up_notes            TEXT,
    follow_up_type             VARCHAR(20),                         -- TELECONSULTATION, IN_PERSON
    -- Ký xác nhận
    is_signed                  BOOLEAN DEFAULT FALSE,
    signed_at                  TIMESTAMPTZ,
    signed_by                  VARCHAR(50),
    signature_notes            TEXT,
    -- Metadata
    status                     VARCHAR(20) DEFAULT 'DRAFT',         -- DRAFT, COMPLETED, SIGNED
    created_by                 VARCHAR(50),
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE SET NULL,
    FOREIGN KEY (signed_by) REFERENCES users(users_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tcr_consultation ON tele_consultation_results(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_tcr_encounter ON tele_consultation_results(encounter_id) WHERE encounter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tcr_status ON tele_consultation_results(status);
CREATE INDEX IF NOT EXISTS idx_tcr_unsigned ON tele_consultation_results(is_signed) WHERE is_signed = FALSE AND status = 'COMPLETED';
CREATE INDEX IF NOT EXISTS idx_tcr_followup ON tele_consultation_results(follow_up_needed, follow_up_date) WHERE follow_up_needed = TRUE;

-- =====================================================================
-- 2. ALTER tele_consultations — Bổ sung trạng thái kết quả
-- =====================================================================
ALTER TABLE tele_consultations
    ADD COLUMN IF NOT EXISTS has_result BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS result_status VARCHAR(20);

-- *********************************************************************
-- PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_RESULT_VIEW',     'TELE_RESULT_VIEW',     'REMOTE_CONSULTATION', 'Xem kết quả khám từ xa'),
('PERM_TELE_RESULT_MANAGE',   'TELE_RESULT_MANAGE',   'REMOTE_CONSULTATION', 'Ghi nhận / cập nhật kết quả khám từ xa'),
('PERM_TELE_RESULT_SIGN',     'TELE_RESULT_SIGN',     'REMOTE_CONSULTATION', 'Ký xác nhận kết quả khám từ xa')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TELE_RESULT_VIEW','TELE_RESULT_MANAGE','TELE_RESULT_SIGN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('TELE_RESULT_VIEW','TELE_RESULT_MANAGE','TELE_RESULT_SIGN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT (chỉ xem)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN ('TELE_RESULT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Ghi nhận kết quả
('API_TELE_RESULT_CREATE',       'REMOTE_CONSULTATION', 'POST',  '/api/teleconsultation/results/:consultationId',              'Tạo kết quả DRAFT'),
('API_TELE_RESULT_UPDATE',       'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId',              'Cập nhật kết quả'),
('API_TELE_RESULT_DETAIL',       'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/results/:consultationId',              'Chi tiết kết quả'),
('API_TELE_RESULT_COMPLETE',     'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId/complete',     'Chuyển COMPLETED'),
('API_TELE_RESULT_SIGN',         'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId/sign',         'Ký xác nhận'),
-- Triệu chứng & Sinh hiệu
('API_TELE_RESULT_SYMPTOMS',     'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId/symptoms',     'Cập nhật triệu chứng'),
('API_TELE_RESULT_VITALS',       'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId/vitals',       'BN tự báo sinh hiệu'),
-- Chuyển tuyến & Tái khám
('API_TELE_RESULT_REFERRAL',     'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId/referral',     'Ghi chuyển tuyến'),
('API_TELE_RESULT_FOLLOWUP',     'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/results/:consultationId/follow-up',    'Ghi kế hoạch tái khám'),
-- Tra cứu
('API_TELE_RESULT_LIST',         'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/results',                              'DS kết quả'),
('API_TELE_RESULT_PATIENT',      'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/results/patient/:patientId',           'Lịch sử kết quả BN'),
('API_TELE_RESULT_UNSIGNED',     'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/results/unsigned',                     'DS chờ ký'),
('API_TELE_RESULT_FOLLOWUPS',    'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/results/follow-ups',                   'DS cần tái khám'),
('API_TELE_RESULT_SUMMARY',      'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/results/:consultationId/summary',      'Tổng kết phiên')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN → all
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_RESULT_%'
ON CONFLICT DO NOTHING;

-- DOCTOR
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_RESULT_CREATE','API_TELE_RESULT_UPDATE','API_TELE_RESULT_DETAIL',
    'API_TELE_RESULT_COMPLETE','API_TELE_RESULT_SIGN',
    'API_TELE_RESULT_SYMPTOMS','API_TELE_RESULT_VITALS',
    'API_TELE_RESULT_REFERRAL','API_TELE_RESULT_FOLLOWUP',
    'API_TELE_RESULT_LIST','API_TELE_RESULT_PATIENT',
    'API_TELE_RESULT_UNSIGNED','API_TELE_RESULT_FOLLOWUPS','API_TELE_RESULT_SUMMARY'
) ON CONFLICT DO NOTHING;

-- PATIENT (chỉ xem + cập nhật triệu chứng/vitals)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_TELE_RESULT_DETAIL','API_TELE_RESULT_SYMPTOMS',
    'API_TELE_RESULT_VITALS','API_TELE_RESULT_PATIENT'
) ON CONFLICT DO NOTHING;
