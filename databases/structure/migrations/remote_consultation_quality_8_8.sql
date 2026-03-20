-- *********************************************************************
-- MODULE 8.8: QUẢN LÝ CHẤT LƯỢNG & ĐÁNH GIÁ DỊCH VỤ KHÁM TỪ XA
-- (Quality Management & Service Evaluation)
-- *********************************************************************

-- =====================================================================
-- 1. tele_quality_reviews — Đánh giá chi tiết chất lượng
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_quality_reviews (
    review_id                  VARCHAR(50) PRIMARY KEY,
    tele_consultation_id       VARCHAR(50) NOT NULL UNIQUE,
    patient_id                 VARCHAR(50) NOT NULL,
    doctor_id                  VARCHAR(50) NOT NULL,
    -- Đánh giá BS (1-5)
    doctor_professionalism     INT CHECK (doctor_professionalism >= 1 AND doctor_professionalism <= 5),
    doctor_communication       INT CHECK (doctor_communication >= 1 AND doctor_communication <= 5),
    doctor_knowledge           INT CHECK (doctor_knowledge >= 1 AND doctor_knowledge <= 5),
    doctor_empathy             INT CHECK (doctor_empathy >= 1 AND doctor_empathy <= 5),
    doctor_overall             INT CHECK (doctor_overall >= 1 AND doctor_overall <= 5),
    doctor_comment             TEXT,
    -- Trải nghiệm BN
    ease_of_use                INT CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
    waiting_time_rating        INT CHECK (waiting_time_rating >= 1 AND waiting_time_rating <= 5),
    overall_satisfaction       INT CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    would_recommend            BOOLEAN DEFAULT TRUE,
    patient_comment            TEXT,
    -- Chất lượng kết nối
    video_quality              INT CHECK (video_quality >= 1 AND video_quality <= 5),
    audio_quality              INT CHECK (audio_quality >= 1 AND audio_quality <= 5),
    connection_stability       INT CHECK (connection_stability >= 1 AND connection_stability <= 5),
    tech_issues                JSONB,                                -- ["AUDIO_LAG","VIDEO_FREEZE","DISCONNECTED"]
    -- Metadata
    is_anonymous               BOOLEAN DEFAULT FALSE,
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(users_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tqr_consultation ON tele_quality_reviews(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_tqr_doctor ON tele_quality_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tqr_patient ON tele_quality_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_tqr_satisfaction ON tele_quality_reviews(overall_satisfaction);

-- =====================================================================
-- 2. tele_quality_alerts — Cảnh báo chất lượng
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_quality_alerts (
    alert_id                   VARCHAR(50) PRIMARY KEY,
    alert_type                 VARCHAR(30) NOT NULL,                 -- LOW_RATING, TECH_ISSUE, HIGH_CANCEL_RATE, PATIENT_COMPLAINT
    severity                   VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- WARNING, CRITICAL
    target_type                VARCHAR(20) NOT NULL,                 -- DOCTOR, SYSTEM, PLATFORM
    target_id                  VARCHAR(50),                          -- doctor_id hoặc null (system-wide)
    title                      VARCHAR(200) NOT NULL,
    description                TEXT,
    metrics_snapshot           JSONB,                                -- {avg_rating, total_reviews, cancel_rate}
    status                     VARCHAR(20) DEFAULT 'OPEN',          -- OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED
    resolved_by                VARCHAR(50),
    resolution_notes           TEXT,
    resolved_at                TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resolved_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tqa_status ON tele_quality_alerts(status);
CREATE INDEX IF NOT EXISTS idx_tqa_type ON tele_quality_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_tqa_target ON tele_quality_alerts(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_tqa_open ON tele_quality_alerts(status) WHERE status = 'OPEN';

-- *********************************************************************
-- PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_QA_VIEW',     'TELE_QA_VIEW',     'REMOTE_CONSULTATION', 'Xem đánh giá chất lượng từ xa'),
('PERM_TELE_QA_REVIEW',   'TELE_QA_REVIEW',   'REMOTE_CONSULTATION', 'Gửi đánh giá chất lượng'),
('PERM_TELE_QA_MANAGE',   'TELE_QA_MANAGE',   'REMOTE_CONSULTATION', 'Quản lý chất lượng & cảnh báo')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TELE_QA_VIEW','TELE_QA_REVIEW','TELE_QA_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('TELE_QA_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN ('TELE_QA_VIEW','TELE_QA_REVIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Đánh giá
('API_TELE_QA_CREATE',         'REMOTE_CONSULTATION', 'POST',  '/api/teleconsultation/quality/reviews/:consultationId',            'Gửi đánh giá'),
('API_TELE_QA_DETAIL',         'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/reviews/:consultationId',            'Chi tiết đánh giá'),
('API_TELE_QA_LIST',           'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/reviews',                            'DS đánh giá'),
('API_TELE_QA_BY_DOCTOR',      'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/reviews/doctor/:doctorId',           'DS đánh giá theo BS'),
-- Metrics
('API_TELE_QA_DOCTOR_METRICS', 'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/metrics/doctor/:doctorId',           'Metrics BS'),
('API_TELE_QA_OVERVIEW',       'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/metrics/overview',                   'Tổng quan hệ thống'),
('API_TELE_QA_CONNECTION',     'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/metrics/connection',                 'Thống kê kết nối'),
('API_TELE_QA_TRENDS',         'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/metrics/trends',                     'Xu hướng'),
-- Cảnh báo
('API_TELE_QA_ALERTS_LIST',    'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/alerts',                             'DS cảnh báo'),
('API_TELE_QA_ALERT_CREATE',   'REMOTE_CONSULTATION', 'POST',  '/api/teleconsultation/quality/alerts',                             'Tạo cảnh báo'),
('API_TELE_QA_ALERT_RESOLVE',  'REMOTE_CONSULTATION', 'PUT',   '/api/teleconsultation/quality/alerts/:alertId/resolve',            'Resolve cảnh báo'),
('API_TELE_QA_ALERT_STATS',    'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/alerts/stats',                       'Thống kê cảnh báo'),
-- Báo cáo
('API_TELE_QA_REPORT_DOCTOR',  'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/reports/doctor/:doctorId',           'Báo cáo BS'),
('API_TELE_QA_REPORT_SUMMARY', 'REMOTE_CONSULTATION', 'GET',   '/api/teleconsultation/quality/reports/summary',                    'Báo cáo tổng hợp')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN → all
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_QA_%'
ON CONFLICT DO NOTHING;

-- DOCTOR (xem reviews + metrics mình)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_QA_DETAIL','API_TELE_QA_BY_DOCTOR','API_TELE_QA_DOCTOR_METRICS'
) ON CONFLICT DO NOTHING;

-- PATIENT (gửi + xem review mình)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_TELE_QA_CREATE','API_TELE_QA_DETAIL'
) ON CONFLICT DO NOTHING;
