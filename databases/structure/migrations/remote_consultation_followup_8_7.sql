-- *********************************************************************
-- MODULE 8.7: THEO DÕI SAU TƯ VẤN & TÁI KHÁM TỪ XA
-- (Post-Consultation Follow-up & Monitoring)
-- *********************************************************************

-- =====================================================================
-- 1. tele_follow_up_plans — Kế hoạch theo dõi
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_follow_up_plans (
    plan_id                    VARCHAR(50) PRIMARY KEY,
    tele_consultation_id       VARCHAR(50) NOT NULL,
    patient_id                 VARCHAR(50) NOT NULL,
    doctor_id                  VARCHAR(50) NOT NULL,
    encounter_id               VARCHAR(50),
    -- Kế hoạch
    plan_type                  VARCHAR(30) NOT NULL,                 -- MEDICATION_MONITOR, SYMPTOM_TRACK, POST_PROCEDURE, CHRONIC_CARE
    description                TEXT,
    instructions               TEXT,
    monitoring_items           JSONB,                                -- ["Nhiệt độ","Huyết áp","Đường huyết"]
    frequency                  VARCHAR(50) DEFAULT 'WEEKLY',        -- DAILY, WEEKLY, BI_WEEKLY, MONTHLY
    start_date                 DATE NOT NULL,
    end_date                   DATE,
    -- Tái khám
    next_follow_up_date        DATE,
    follow_up_type             VARCHAR(20),                          -- TELECONSULTATION, IN_PERSON
    follow_up_booking_id       VARCHAR(50),
    reminder_sent              BOOLEAN DEFAULT FALSE,
    reminder_sent_at           TIMESTAMPTZ,
    -- Kết quả
    status                     VARCHAR(30) DEFAULT 'ACTIVE',        -- ACTIVE, COMPLETED, CONVERTED_IN_PERSON, CANCELLED
    outcome                    TEXT,
    outcome_rating             VARCHAR(20),                          -- IMPROVED, STABLE, WORSENED, RESOLVED
    completed_at               TIMESTAMPTZ,
    converted_reason           TEXT,
    -- Metadata
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE SET NULL,
    FOREIGN KEY (follow_up_booking_id) REFERENCES tele_booking_sessions(session_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tfp_consultation ON tele_follow_up_plans(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_tfp_patient ON tele_follow_up_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_tfp_doctor ON tele_follow_up_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tfp_status ON tele_follow_up_plans(status);
CREATE INDEX IF NOT EXISTS idx_tfp_upcoming ON tele_follow_up_plans(next_follow_up_date) WHERE status = 'ACTIVE' AND next_follow_up_date IS NOT NULL;

-- =====================================================================
-- 2. tele_health_updates — Diễn biến sức khỏe BN
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_health_updates (
    update_id                  VARCHAR(50) PRIMARY KEY,
    plan_id                    VARCHAR(50) NOT NULL,
    reported_by                VARCHAR(50) NOT NULL,
    reporter_type              VARCHAR(20) NOT NULL,                 -- PATIENT, DOCTOR
    update_type                VARCHAR(30) NOT NULL,                 -- SYMPTOM_UPDATE, VITAL_SIGNS, MEDICATION_RESPONSE, SIDE_EFFECT, GENERAL_NOTE
    content                    TEXT,
    vital_data                 JSONB,                                -- {temp, pulse, bp_systolic, bp_diastolic, spo2, weight}
    severity_level             VARCHAR(20) DEFAULT 'NORMAL',        -- NORMAL, MILD, MODERATE, SEVERE, CRITICAL
    attachments                JSONB,                                -- [{file_name, file_url}]
    doctor_response            TEXT,
    responded_at               TIMESTAMPTZ,
    requires_attention         BOOLEAN DEFAULT FALSE,
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES tele_follow_up_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(users_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_thu_plan ON tele_health_updates(plan_id);
CREATE INDEX IF NOT EXISTS idx_thu_attention ON tele_health_updates(requires_attention) WHERE requires_attention = TRUE AND doctor_response IS NULL;
CREATE INDEX IF NOT EXISTS idx_thu_severity ON tele_health_updates(severity_level) WHERE severity_level IN ('SEVERE','CRITICAL');

-- *********************************************************************
-- PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_FU_VIEW',     'TELE_FU_VIEW',     'REMOTE_CONSULTATION', 'Xem kế hoạch theo dõi từ xa'),
('PERM_TELE_FU_MANAGE',   'TELE_FU_MANAGE',   'REMOTE_CONSULTATION', 'Quản lý kế hoạch theo dõi từ xa'),
('PERM_TELE_FU_REPORT',   'TELE_FU_REPORT',   'REMOTE_CONSULTATION', 'BN ghi nhận diễn biến sức khỏe')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TELE_FU_VIEW','TELE_FU_MANAGE','TELE_FU_REPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('TELE_FU_VIEW','TELE_FU_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN ('TELE_FU_VIEW','TELE_FU_REPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Follow-up plans
('API_TELE_FU_CREATE',       'REMOTE_CONSULTATION', 'POST',  '/api/teleconsultation/follow-ups/plans/:consultationId',            'Tạo follow-up plan'),
('API_TELE_FU_UPDATE',       'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/follow-ups/plans/:planId',                    'Cập nhật plan'),
('API_TELE_FU_DETAIL',       'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/plans/:planId',                    'Chi tiết plan'),
('API_TELE_FU_COMPLETE',     'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/follow-ups/plans/:planId/complete',            'Hoàn thành plan'),
('API_TELE_FU_CONVERT',      'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/follow-ups/plans/:planId/convert',             'Chuyển khám trực tiếp'),
-- Health updates
('API_TELE_FU_ADD_UPDATE',   'REMOTE_CONSULTATION', 'POST',  '/api/teleconsultation/follow-ups/plans/:planId/updates',             'Ghi diễn biến'),
('API_TELE_FU_LIST_UPDATES', 'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/plans/:planId/updates',             'DS diễn biến'),
('API_TELE_FU_RESPOND',      'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/follow-ups/updates/:updateId/respond',         'BS phản hồi'),
('API_TELE_FU_ATTENTION',    'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/updates/attention',                 'DS cần xem xét'),
-- Reminders
('API_TELE_FU_REMINDER',     'REMOTE_CONSULTATION', 'POST',  '/api/teleconsultation/follow-ups/plans/:planId/send-reminder',       'Gửi nhắc'),
('API_TELE_FU_UPCOMING',     'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/plans/upcoming',                    'DS sắp tái khám'),
-- Tra cứu
('API_TELE_FU_LIST',         'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/plans',                             'DS plans'),
('API_TELE_FU_PATIENT',      'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/plans/patient/:patientId',          'Lịch sử BN'),
('API_TELE_FU_REPORT',       'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/plans/:planId/report',              'Báo cáo điều trị'),
('API_TELE_FU_STATS',        'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/follow-ups/stats',                             'Thống kê')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN → all
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_FU_%'
ON CONFLICT DO NOTHING;

-- DOCTOR
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_FU_CREATE','API_TELE_FU_UPDATE','API_TELE_FU_DETAIL',
    'API_TELE_FU_COMPLETE','API_TELE_FU_CONVERT',
    'API_TELE_FU_ADD_UPDATE','API_TELE_FU_LIST_UPDATES','API_TELE_FU_RESPOND','API_TELE_FU_ATTENTION',
    'API_TELE_FU_REMINDER','API_TELE_FU_UPCOMING',
    'API_TELE_FU_LIST','API_TELE_FU_PATIENT','API_TELE_FU_REPORT','API_TELE_FU_STATS'
) ON CONFLICT DO NOTHING;

-- PATIENT
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_TELE_FU_DETAIL','API_TELE_FU_ADD_UPDATE','API_TELE_FU_LIST_UPDATES','API_TELE_FU_PATIENT'
) ON CONFLICT DO NOTHING;
