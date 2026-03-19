-- ==============================================================================
-- MODULE 6.8: ĐỒNG BỘ DỮ LIỆU & TÍCH HỢP BÊN NGOÀI (Health Data Integration)
-- ==============================================================================

-- 1. Quản lý nguồn dữ liệu
CREATE TABLE IF NOT EXISTS ehr_data_sources (
    source_id          VARCHAR(50) PRIMARY KEY,
    source_name        VARCHAR(255) NOT NULL,
    source_type        VARCHAR(50) NOT NULL,
    protocol           VARCHAR(50) DEFAULT 'MANUAL',
    endpoint_url       VARCHAR(500),
    api_key_encrypted  TEXT,
    contact_info       VARCHAR(255),
    description        TEXT,
    is_active          BOOLEAN DEFAULT TRUE,
    created_by         VARCHAR(50),
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_eds_type ON ehr_data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_eds_active ON ehr_data_sources(is_active);

-- 2. Log đồng bộ thiết bị y tế
CREATE TABLE IF NOT EXISTS ehr_device_sync_log (
    sync_log_id        VARCHAR(50) PRIMARY KEY,
    patient_id         VARCHAR(50) NOT NULL,
    source_id          VARCHAR(50),
    device_name        VARCHAR(255) NOT NULL,
    device_type        VARCHAR(50),
    sync_time          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    records_synced     INT DEFAULT 0,
    status             VARCHAR(50) DEFAULT 'SUCCESS',
    error_message      TEXT,
    synced_by          VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES ehr_data_sources(source_id),
    FOREIGN KEY (synced_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_edsl_patient ON ehr_device_sync_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_edsl_time ON ehr_device_sync_log(sync_time DESC);

-- 3. Bổ sung external_health_records
ALTER TABLE external_health_records ADD COLUMN IF NOT EXISTS source_id VARCHAR(50) REFERENCES ehr_data_sources(source_id);
ALTER TABLE external_health_records ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE external_health_records ADD COLUMN IF NOT EXISTS processed_by VARCHAR(50) REFERENCES users(users_id);
ALTER TABLE external_health_records ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE external_health_records ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) REFERENCES users(users_id);

CREATE INDEX IF NOT EXISTS idx_ehr_patient ON external_health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_status ON external_health_records(sync_status);
CREATE INDEX IF NOT EXISTS idx_ehr_type ON external_health_records(data_type);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_INTEGRATION_VIEW',   'EHR_INTEGRATION_VIEW',   'EHR', 'Xem nguồn dữ liệu, hồ sơ bên ngoài, sync log'),
('PERM_EHR_INTEGRATION_MANAGE', 'EHR_INTEGRATION_MANAGE', 'EHR', 'Tạo/sửa nguồn, nhập hồ sơ, cập nhật status, sync')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('ADMIN','DOCTOR') AND p.code IN ('EHR_INTEGRATION_VIEW','EHR_INTEGRATION_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EHR_INTEGRATION_VIEW','EHR_INTEGRATION_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code = 'EHR_INTEGRATION_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EHR_DS_LIST',          'EHR', 'GET',   '/api/ehr/patients/:patientId/data-sources',                        'DS nguồn dữ liệu'),
('API_EHR_DS_CREATE',        'EHR', 'POST',  '/api/ehr/patients/:patientId/data-sources',                        'Thêm nguồn dữ liệu'),
('API_EHR_DS_UPDATE',        'EHR', 'PATCH', '/api/ehr/patients/:patientId/data-sources/:sourceId',              'Cập nhật nguồn'),
('API_EHR_EXT_LIST',         'EHR', 'GET',   '/api/ehr/patients/:patientId/external-records',                    'DS hồ sơ bên ngoài'),
('API_EHR_EXT_CREATE',       'EHR', 'POST',  '/api/ehr/patients/:patientId/external-records',                    'Nhập hồ sơ bên ngoài'),
('API_EHR_EXT_DETAIL',       'EHR', 'GET',   '/api/ehr/patients/:patientId/external-records/:recordId',          'Chi tiết hồ sơ'),
('API_EHR_EXT_STATUS',       'EHR', 'PATCH', '/api/ehr/patients/:patientId/external-records/:recordId/status',   'Cập nhật sync status'),
('API_EHR_DEV_SYNC_CREATE',  'EHR', 'POST',  '/api/ehr/patients/:patientId/device-sync',                         'Log đồng bộ thiết bị'),
('API_EHR_DEV_SYNC_LIST',    'EHR', 'GET',   '/api/ehr/patients/:patientId/device-sync',                         'Lịch sử đồng bộ'),
('API_EHR_INT_SUMMARY',      'EHR', 'GET',   '/api/ehr/patients/:patientId/integration-summary',                 'Dashboard tổng hợp')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN, DOCTOR: full 10 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','DOCTOR') AND a.api_id IN (
    'API_EHR_DS_LIST','API_EHR_DS_CREATE','API_EHR_DS_UPDATE',
    'API_EHR_EXT_LIST','API_EHR_EXT_CREATE','API_EHR_EXT_DETAIL','API_EHR_EXT_STATUS',
    'API_EHR_DEV_SYNC_CREATE','API_EHR_DEV_SYNC_LIST','API_EHR_INT_SUMMARY'
) ON CONFLICT DO NOTHING;

-- NURSE: nhập record, device sync, xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_EHR_DS_LIST','API_EHR_EXT_LIST','API_EHR_EXT_CREATE','API_EHR_EXT_DETAIL',
    'API_EHR_DEV_SYNC_CREATE','API_EHR_DEV_SYNC_LIST','API_EHR_INT_SUMMARY'
) ON CONFLICT DO NOTHING;

-- STAFF: read-only hạn chế
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_EHR_DS_LIST','API_EHR_EXT_LIST','API_EHR_INT_SUMMARY'
) ON CONFLICT DO NOTHING;
