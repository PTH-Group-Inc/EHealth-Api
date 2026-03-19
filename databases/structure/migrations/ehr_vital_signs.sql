-- ==============================================================================
-- MODULE 6.6: CHỈ SỐ SỨC KHỎE & SINH HIỆU (Vital Signs & Health Metrics)
-- ==============================================================================

-- 1. Bảng mới: Ngưỡng tham chiếu chuẩn hóa
CREATE TABLE IF NOT EXISTS vital_reference_ranges (
    range_id         VARCHAR(50) PRIMARY KEY,
    metric_code      VARCHAR(50) NOT NULL,
    metric_name      VARCHAR(100) NOT NULL,
    unit             VARCHAR(20) NOT NULL,
    normal_min       DECIMAL(10,2),
    normal_max       DECIMAL(10,2),
    warning_min      DECIMAL(10,2),
    warning_max      DECIMAL(10,2),
    critical_min     DECIMAL(10,2),
    critical_max     DECIMAL(10,2),
    age_group        VARCHAR(20) DEFAULT 'ADULT',
    gender           VARCHAR(10) DEFAULT 'ALL',
    is_active        BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_vrr_code ON vital_reference_ranges(metric_code) WHERE is_active = TRUE;

-- 2. Seed data: ngưỡng sinh hiệu người lớn
INSERT INTO vital_reference_ranges (range_id, metric_code, metric_name, unit, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, age_group, gender) VALUES
('VRR_PULSE',       'pulse',                     'Mạch',                  'bpm',    60,    100,   50,    110,   40,    130,   'ADULT', 'ALL'),
('VRR_BP_SYS',      'blood_pressure_systolic',   'Huyết áp tâm thu',     'mmHg',   90,    120,   80,    140,   70,    180,   'ADULT', 'ALL'),
('VRR_BP_DIA',      'blood_pressure_diastolic',  'Huyết áp tâm trương',  'mmHg',   60,    80,    50,    90,    40,    110,   'ADULT', 'ALL'),
('VRR_TEMP',        'temperature',               'Nhiệt độ',             '°C',     36.1,  37.2,  35.5,  38.0,  35.0,  39.5,  'ADULT', 'ALL'),
('VRR_RESP',        'respiratory_rate',           'Nhịp thở',             'lần/phút', 12,  20,    10,    25,    8,     30,    'ADULT', 'ALL'),
('VRR_SPO2',        'spo2',                      'SpO2',                  '%',      95,    100,   90,    100,   85,    100,   'ADULT', 'ALL'),
('VRR_WEIGHT',      'weight',                    'Cân nặng',             'kg',     40,    120,   30,    150,   20,    200,   'ADULT', 'ALL'),
('VRR_HEIGHT',      'height',                    'Chiều cao',            'cm',     140,   200,   130,   210,   120,   220,   'ADULT', 'ALL'),
('VRR_BMI',         'bmi',                       'Chỉ số BMI',           'kg/m²',  18.5,  24.9,  16,    30,    14,    40,    'ADULT', 'ALL'),
('VRR_GLUCOSE',     'blood_glucose',             'Đường huyết',          'mg/dL',  70,    100,   60,    126,   50,    200,   'ADULT', 'ALL'),
('VRR_HEART_RATE',  'HEART_RATE',                'Nhịp tim',             'bpm',    60,    100,   50,    110,   40,    130,   'ADULT', 'ALL'),
('VRR_BLOOD_SUGAR', 'BLOOD_SUGAR',               'Đường huyết (metric)', 'mg/dL',  70,    100,   60,    126,   50,    200,   'ADULT', 'ALL'),
('VRR_BP_METRIC',   'BLOOD_PRESSURE',            'Huyết áp (metric)',    'mmHg',   90,    120,   80,    140,   70,    180,   'ADULT', 'ALL')
ON CONFLICT DO NOTHING;

-- 3. Bổ sung foreign key + index cho patient_health_metrics (bảng đã có sẵn)
CREATE INDEX IF NOT EXISTS idx_phm_patient ON patient_health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_phm_code ON patient_health_metrics(metric_code);
CREATE INDEX IF NOT EXISTS idx_phm_measured ON patient_health_metrics(measured_at DESC);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_VITALS_VIEW', 'EHR_VITALS_VIEW', 'EHR', 'Xem sinh hiệu & chỉ số sức khỏe (EHR)'),
('PERM_EHR_VITALS_EDIT', 'EHR_VITALS_EDIT', 'EHR', 'Thêm chỉ số từ thiết bị/tự báo cáo (EHR)')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('ADMIN','DOCTOR','NURSE') AND p.code IN ('EHR_VITALS_VIEW','EHR_VITALS_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code = 'EHR_VITALS_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EHR_VITALS_LIST',       'EHR', 'GET',  '/api/ehr/patients/:patientId/vitals',                  'Lịch sử sinh hiệu'),
('API_EHR_VITALS_LATEST',     'EHR', 'GET',  '/api/ehr/patients/:patientId/vitals/latest',           'Sinh hiệu mới nhất'),
('API_EHR_VITALS_TRENDS',     'EHR', 'GET',  '/api/ehr/patients/:patientId/vitals/trends',           'Xu hướng sinh hiệu'),
('API_EHR_VITALS_ABNORMAL',   'EHR', 'GET',  '/api/ehr/patients/:patientId/vitals/abnormal',         'Sinh hiệu bất thường'),
('API_EHR_VITALS_SUMMARY',    'EHR', 'GET',  '/api/ehr/patients/:patientId/vitals/summary',          'Tổng hợp sinh hiệu'),
('API_EHR_METRICS_LIST',      'EHR', 'GET',  '/api/ehr/patients/:patientId/health-metrics',          'DS chỉ số sức khỏe'),
('API_EHR_METRICS_CREATE',    'EHR', 'POST', '/api/ehr/patients/:patientId/health-metrics',          'Thêm chỉ số sức khỏe'),
('API_EHR_METRICS_TIMELINE',  'EHR', 'GET',  '/api/ehr/patients/:patientId/health-metrics/timeline', 'Timeline hợp nhất')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN, DOCTOR, NURSE: full 8 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','DOCTOR','NURSE') AND a.api_id IN (
    'API_EHR_VITALS_LIST','API_EHR_VITALS_LATEST','API_EHR_VITALS_TRENDS',
    'API_EHR_VITALS_ABNORMAL','API_EHR_VITALS_SUMMARY',
    'API_EHR_METRICS_LIST','API_EHR_METRICS_CREATE','API_EHR_METRICS_TIMELINE'
) ON CONFLICT DO NOTHING;

-- STAFF: read-only hạn chế
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_EHR_VITALS_LIST','API_EHR_VITALS_LATEST','API_EHR_VITALS_SUMMARY'
) ON CONFLICT DO NOTHING;
