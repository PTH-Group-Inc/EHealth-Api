-- ==============================================================================
-- MODULE 4.6: HỒ SƠ BỆNH ÁN ĐIỆN TỬ (ELECTRONIC MEDICAL RECORD)
-- ==============================================================================

-- 1. Bảng mới: Snapshot bệnh án (lưu JSONB khi finalize)
CREATE TABLE emr_record_snapshots (
    emr_record_snapshots_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE,
    patient_id VARCHAR(50) NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    snapshot_data JSONB NOT NULL,
    finalized_by VARCHAR(50) NOT NULL,
    finalized_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (finalized_by) REFERENCES users(users_id)
);

CREATE INDEX idx_emr_snapshots_patient ON emr_record_snapshots(patient_id);
CREATE INDEX idx_emr_snapshots_type ON emr_record_snapshots(record_type);
CREATE INDEX idx_emr_snapshots_date ON emr_record_snapshots(finalized_at DESC);

-- 2. Bổ sung cột cho encounters
ALTER TABLE encounters
    ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_encounters_finalized ON encounters(is_finalized);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EMR_RECORD_VIEW',     'EMR_RECORD_VIEW',     'EMR', 'Xem bệnh án điện tử, snapshot, timeline, thống kê'),
('PERM_EMR_RECORD_FINALIZE', 'EMR_RECORD_FINALIZE', 'EMR', 'Hoàn tất & khóa bệnh án (tạo snapshot)'),
('PERM_EMR_RECORD_SIGN',     'EMR_RECORD_SIGN',     'EMR', 'Ký số xác nhận bệnh án'),
('PERM_EMR_RECORD_EXPORT',   'EMR_RECORD_EXPORT',   'EMR', 'Xuất / in bệnh án')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EMR_RECORD_VIEW','EMR_RECORD_FINALIZE','EMR_RECORD_SIGN','EMR_RECORD_EXPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EMR_RECORD_VIEW','EMR_RECORD_FINALIZE','EMR_RECORD_SIGN','EMR_RECORD_EXPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem + xuất
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EMR_RECORD_VIEW','EMR_RECORD_EXPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('EMR_RECORD_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EMR_RECORD_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EMR_REC_FULL',        'EMR', 'GET',  '/api/medical-records/:encounterId',                   'Bệnh án đầy đủ theo encounter'),
('API_EMR_REC_COMPLETE',    'EMR', 'GET',  '/api/medical-records/:encounterId/completeness',      'Kiểm tra tính đầy đủ bệnh án'),
('API_EMR_REC_FINALIZE',    'EMR', 'POST', '/api/medical-records/:encounterId/finalize',          'Hoàn tất & khóa bệnh án'),
('API_EMR_REC_SIGN',        'EMR', 'POST', '/api/medical-records/:encounterId/sign',              'Ký số bệnh án'),
('API_EMR_REC_BY_PATIENT',  'EMR', 'GET',  '/api/medical-records/by-patient/:patientId',          'DS bệnh án theo bệnh nhân'),
('API_EMR_REC_TIMELINE',    'EMR', 'GET',  '/api/medical-records/by-patient/:patientId/timeline', 'Dòng thời gian y tế'),
('API_EMR_REC_STATS',       'EMR', 'GET',  '/api/medical-records/by-patient/:patientId/statistics','Thống kê xuyên encounter'),
('API_EMR_REC_SNAPSHOT',    'EMR', 'GET',  '/api/medical-records/snapshot/:encounterId',          'Xem snapshot bệnh án đã khóa'),
('API_EMR_REC_EXPORT',      'EMR', 'GET',  '/api/medical-records/export/:encounterId',            'Xuất bệnh án JSON'),
('API_EMR_REC_SEARCH',      'EMR', 'GET',  '/api/medical-records/search',                         'Tìm kiếm bệnh án nâng cao')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_EMR_REC_FULL','API_EMR_REC_COMPLETE','API_EMR_REC_FINALIZE','API_EMR_REC_SIGN',
    'API_EMR_REC_BY_PATIENT','API_EMR_REC_TIMELINE','API_EMR_REC_STATS',
    'API_EMR_REC_SNAPSHOT','API_EMR_REC_EXPORT','API_EMR_REC_SEARCH'
)
ON CONFLICT DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_EMR_REC_FULL','API_EMR_REC_COMPLETE','API_EMR_REC_FINALIZE','API_EMR_REC_SIGN',
    'API_EMR_REC_BY_PATIENT','API_EMR_REC_TIMELINE','API_EMR_REC_STATS',
    'API_EMR_REC_SNAPSHOT','API_EMR_REC_EXPORT','API_EMR_REC_SEARCH'
)
ON CONFLICT DO NOTHING;

-- NURSE: xem + xuất + timeline + thống kê
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_EMR_REC_FULL','API_EMR_REC_COMPLETE','API_EMR_REC_BY_PATIENT',
    'API_EMR_REC_TIMELINE','API_EMR_REC_STATS','API_EMR_REC_SNAPSHOT','API_EMR_REC_EXPORT','API_EMR_REC_SEARCH'
)
ON CONFLICT DO NOTHING;

-- PHARMACIST: xem cơ bản
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_EMR_REC_FULL','API_EMR_REC_BY_PATIENT','API_EMR_REC_SNAPSHOT'
)
ON CONFLICT DO NOTHING;

-- STAFF: xem cơ bản + search
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_EMR_REC_FULL','API_EMR_REC_BY_PATIENT','API_EMR_REC_SNAPSHOT','API_EMR_REC_SEARCH'
)
ON CONFLICT DO NOTHING;
