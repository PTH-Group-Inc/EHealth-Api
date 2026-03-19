-- ==============================================================================
-- MODULE 4.7: THEO DÕI TIẾN TRÌNH ĐIỀU TRỊ (TREATMENT PROGRESS)
-- ==============================================================================

-- 1. Kế hoạch điều trị
CREATE TABLE treatment_plans (
    treatment_plans_id VARCHAR(50) PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    primary_diagnosis_code VARCHAR(20) NOT NULL,
    primary_diagnosis_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goals TEXT,
    start_date DATE NOT NULL,
    expected_end_date DATE,
    actual_end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_by VARCHAR(50) NOT NULL,
    created_encounter_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    FOREIGN KEY (created_encounter_id) REFERENCES encounters(encounters_id)
);

CREATE INDEX idx_tp_patient ON treatment_plans(patient_id);
CREATE INDEX idx_tp_status ON treatment_plans(status);
CREATE INDEX idx_tp_diagnosis ON treatment_plans(primary_diagnosis_code);

-- 2. Ghi nhận diễn tiến
CREATE TABLE treatment_progress_notes (
    treatment_progress_notes_id VARCHAR(50) PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50),
    note_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'NORMAL',
    recorded_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES treatment_plans(treatment_plans_id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id),
    FOREIGN KEY (recorded_by) REFERENCES users(users_id)
);

CREATE INDEX idx_tpn_plan ON treatment_progress_notes(plan_id);
CREATE INDEX idx_tpn_encounter ON treatment_progress_notes(encounter_id);
CREATE INDEX idx_tpn_type ON treatment_progress_notes(note_type);

-- 3. Liên kết chuỗi tái khám
CREATE TABLE encounter_follow_up_links (
    encounter_follow_up_links_id VARCHAR(50) PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL,
    previous_encounter_id VARCHAR(50) NOT NULL,
    follow_up_encounter_id VARCHAR(50) NOT NULL,
    follow_up_reason TEXT,
    scheduled_date DATE,
    actual_date DATE,
    notes TEXT,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES treatment_plans(treatment_plans_id) ON DELETE CASCADE,
    FOREIGN KEY (previous_encounter_id) REFERENCES encounters(encounters_id),
    FOREIGN KEY (follow_up_encounter_id) REFERENCES encounters(encounters_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    UNIQUE(previous_encounter_id, follow_up_encounter_id)
);

CREATE INDEX idx_efl_plan ON encounter_follow_up_links(plan_id);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TREATMENT_PLAN_VIEW',     'TREATMENT_PLAN_VIEW',     'EMR', 'Xem kế hoạch điều trị, ghi nhận, chuỗi tái khám'),
('PERM_TREATMENT_PLAN_CREATE',   'TREATMENT_PLAN_CREATE',   'EMR', 'Tạo kế hoạch điều trị mới'),
('PERM_TREATMENT_PLAN_EDIT',     'TREATMENT_PLAN_EDIT',     'EMR', 'Sửa/cập nhật kế hoạch, chuyển trạng thái, liên kết follow-up'),
('PERM_TREATMENT_NOTE_CREATE',   'TREATMENT_NOTE_CREATE',   'EMR', 'Ghi nhận diễn tiến, phản ứng, thay đổi triệu chứng'),
('PERM_TREATMENT_NOTE_EDIT',     'TREATMENT_NOTE_EDIT',     'EMR', 'Sửa/xóa ghi nhận diễn tiến')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS
-- ==============================================================================

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TREATMENT_PLAN_VIEW','TREATMENT_PLAN_CREATE','TREATMENT_PLAN_EDIT','TREATMENT_NOTE_CREATE','TREATMENT_NOTE_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('TREATMENT_PLAN_VIEW','TREATMENT_PLAN_CREATE','TREATMENT_PLAN_EDIT','TREATMENT_NOTE_CREATE','TREATMENT_NOTE_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem + ghi nhận
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('TREATMENT_PLAN_VIEW','TREATMENT_NOTE_CREATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('TREATMENT_PLAN_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_TP_CREATE',         'EMR', 'POST',   '/api/treatment-plans',                            'Tạo kế hoạch điều trị'),
('API_TP_DETAIL',         'EMR', 'GET',    '/api/treatment-plans/:planId',                    'Chi tiết kế hoạch điều trị'),
('API_TP_UPDATE',         'EMR', 'PATCH',  '/api/treatment-plans/:planId',                    'Cập nhật kế hoạch điều trị'),
('API_TP_STATUS',         'EMR', 'PATCH',  '/api/treatment-plans/:planId/status',             'Chuyển trạng thái kế hoạch'),
('API_TP_BY_PATIENT',     'EMR', 'GET',    '/api/treatment-plans/by-patient/:patientId',      'DS kế hoạch theo bệnh nhân'),
('API_TP_NOTE_CREATE',    'EMR', 'POST',   '/api/treatment-plans/:planId/notes',              'Thêm ghi nhận diễn tiến'),
('API_TP_NOTE_LIST',      'EMR', 'GET',    '/api/treatment-plans/:planId/notes',              'DS ghi nhận diễn tiến'),
('API_TP_NOTE_UPDATE',    'EMR', 'PATCH',  '/api/treatment-plans/:planId/notes/:noteId',      'Sửa ghi nhận'),
('API_TP_NOTE_DELETE',    'EMR', 'DELETE', '/api/treatment-plans/:planId/notes/:noteId',      'Xóa ghi nhận'),
('API_TP_FOLLOWUP_CREATE','EMR', 'POST',   '/api/treatment-plans/:planId/follow-ups',         'Liên kết encounter tái khám'),
('API_TP_FOLLOWUP_CHAIN', 'EMR', 'GET',    '/api/treatment-plans/:planId/follow-up-chain',    'Xem chuỗi tái khám'),
('API_TP_SUMMARY',        'EMR', 'GET',    '/api/treatment-plans/:planId/summary',            'Tổng hợp lịch sử điều trị')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_TP_CREATE','API_TP_DETAIL','API_TP_UPDATE','API_TP_STATUS','API_TP_BY_PATIENT',
    'API_TP_NOTE_CREATE','API_TP_NOTE_LIST','API_TP_NOTE_UPDATE','API_TP_NOTE_DELETE',
    'API_TP_FOLLOWUP_CREATE','API_TP_FOLLOWUP_CHAIN','API_TP_SUMMARY'
)
ON CONFLICT DO NOTHING;

-- DOCTOR: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TP_CREATE','API_TP_DETAIL','API_TP_UPDATE','API_TP_STATUS','API_TP_BY_PATIENT',
    'API_TP_NOTE_CREATE','API_TP_NOTE_LIST','API_TP_NOTE_UPDATE','API_TP_NOTE_DELETE',
    'API_TP_FOLLOWUP_CREATE','API_TP_FOLLOWUP_CHAIN','API_TP_SUMMARY'
)
ON CONFLICT DO NOTHING;

-- NURSE: xem + ghi nhận
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_TP_DETAIL','API_TP_BY_PATIENT','API_TP_NOTE_CREATE','API_TP_NOTE_LIST',
    'API_TP_FOLLOWUP_CHAIN','API_TP_SUMMARY'
)
ON CONFLICT DO NOTHING;

-- PHARMACIST: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_TP_DETAIL','API_TP_BY_PATIENT','API_TP_NOTE_LIST','API_TP_SUMMARY'
)
ON CONFLICT DO NOTHING;
