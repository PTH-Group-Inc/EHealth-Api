-- ==============================================================================
-- MODULE 6.2: DÒNG THỜI GIAN SỨC KHỎE (EHR — Health Timeline)
-- Mục đích: Lưu events thủ công (BS tạo) cho timeline sức khỏe bệnh nhân
-- Events tự động được query real-time bằng UNION ALL từ các bảng EMR
-- ==============================================================================

-- Bảng events thủ công trên timeline
CREATE TABLE IF NOT EXISTS health_timeline_events (
    event_id             VARCHAR(50) PRIMARY KEY,
    patient_id           VARCHAR(50) NOT NULL,
    event_type           VARCHAR(50) NOT NULL,        -- MANUAL_NOTE, EXTERNAL_VISIT, EXTERNAL_LAB, EXTERNAL_PROCEDURE
    event_time           TIMESTAMPTZ NOT NULL,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    metadata             JSONB,                        -- Dữ liệu bổ sung tùy loại event
    created_by           VARCHAR(50) NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMPTZ,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_hte_patient_time ON health_timeline_events(patient_id, event_time);
CREATE INDEX IF NOT EXISTS idx_hte_type ON health_timeline_events(event_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_hte_active ON health_timeline_events(patient_id) WHERE deleted_at IS NULL;

-- ==============================================================================
-- JWT PERMISSIONS (bảng permissions)
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_TIMELINE_VIEW',    'EHR_TIMELINE_VIEW',    'EHR', 'Xem dòng thời gian sức khỏe bệnh nhân'),
('PERM_EHR_TIMELINE_CREATE',  'EHR_TIMELINE_CREATE',  'EHR', 'Thêm sự kiện thủ công vào timeline'),
('PERM_EHR_TIMELINE_DELETE',  'EHR_TIMELINE_DELETE',  'EHR', 'Xóa sự kiện thủ công trên timeline')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS (bảng role_permissions)
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EHR_TIMELINE_VIEW','EHR_TIMELINE_CREATE','EHR_TIMELINE_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EHR_TIMELINE_VIEW','EHR_TIMELINE_CREATE','EHR_TIMELINE_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EHR_TIMELINE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EHR_TIMELINE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS (bảng api_permissions)
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EHR_TIMELINE',           'EHR', 'GET',    '/api/ehr/patients/:patientId/timeline',                          'Dòng thời gian sức khỏe hợp nhất'),
('API_EHR_TIMELINE_SUMMARY',   'EHR', 'GET',    '/api/ehr/patients/:patientId/timeline/summary',                  'Thống kê tổng quan timeline'),
('API_EHR_TIMELINE_ENCOUNTER', 'EHR', 'GET',    '/api/ehr/patients/:patientId/timeline/by-encounter/:encounterId','Events theo 1 encounter'),
('API_EHR_TIMELINE_TRACK',     'EHR', 'GET',    '/api/ehr/patients/:patientId/timeline/track-condition',          'Theo dõi tiến triển bệnh theo ICD-10'),
('API_EHR_TIMELINE_CREATE',    'EHR', 'POST',   '/api/ehr/patients/:patientId/timeline/events',                   'Thêm event thủ công'),
('API_EHR_TIMELINE_DELETE',    'EHR', 'DELETE', '/api/ehr/patients/:patientId/timeline/events/:eventId',          'Xóa event thủ công')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS (bảng role_api_permissions)
-- ==============================================================================

-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_EHR_TIMELINE', 'API_EHR_TIMELINE_SUMMARY', 'API_EHR_TIMELINE_ENCOUNTER',
    'API_EHR_TIMELINE_TRACK', 'API_EHR_TIMELINE_CREATE', 'API_EHR_TIMELINE_DELETE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_EHR_TIMELINE', 'API_EHR_TIMELINE_SUMMARY', 'API_EHR_TIMELINE_ENCOUNTER',
    'API_EHR_TIMELINE_TRACK', 'API_EHR_TIMELINE_CREATE', 'API_EHR_TIMELINE_DELETE'
  )
ON CONFLICT DO NOTHING;

-- NURSE: xem timeline + summary + encounter + track
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN (
    'API_EHR_TIMELINE', 'API_EHR_TIMELINE_SUMMARY',
    'API_EHR_TIMELINE_ENCOUNTER', 'API_EHR_TIMELINE_TRACK'
  )
ON CONFLICT DO NOTHING;

-- STAFF: xem timeline + summary
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN ('API_EHR_TIMELINE', 'API_EHR_TIMELINE_SUMMARY')
ON CONFLICT DO NOTHING;
