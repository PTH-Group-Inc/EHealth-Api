-- *********************************************************************
-- MODULE 8.9: CẤU HÌNH & QUẢN TRỊ HỆ THỐNG KHÁM TỪ XA
-- (Teleconsultation System Configuration & Administration)
-- *********************************************************************

-- =====================================================================
-- 1. tele_system_configs — Cấu hình hệ thống (key-value)
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_system_configs (
    config_id              VARCHAR(50) PRIMARY KEY,
    config_key             VARCHAR(100) UNIQUE NOT NULL,
    config_value           TEXT NOT NULL,
    config_type            VARCHAR(20) NOT NULL DEFAULT 'STRING',   -- STRING, INTEGER, BOOLEAN, JSON
    category               VARCHAR(50) NOT NULL,                    -- PLATFORM, SECURITY, USAGE_LIMIT, OPERATION, SLA
    description            TEXT,
    is_editable            BOOLEAN DEFAULT TRUE,
    updated_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tsc_key ON tele_system_configs(config_key);
CREATE INDEX IF NOT EXISTS idx_tsc_category ON tele_system_configs(category);

-- =====================================================================
-- 2. tele_service_pricing — Chi phí dịch vụ khám từ xa
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_service_pricing (
    pricing_id             VARCHAR(50) PRIMARY KEY,
    type_id                VARCHAR(50) NOT NULL,
    specialty_id           VARCHAR(50),
    facility_id            VARCHAR(50),
    base_price             DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency               VARCHAR(10) DEFAULT 'VND',
    discount_percent       DECIMAL(5,2) DEFAULT 0,
    effective_from         DATE NOT NULL,
    effective_to           DATE,
    is_active              BOOLEAN DEFAULT TRUE,
    created_by             VARCHAR(50),
    updated_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES tele_consultation_types(type_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE SET NULL,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(users_id) ON DELETE SET NULL,
    UNIQUE (type_id, specialty_id, facility_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_tsp_type ON tele_service_pricing(type_id);
CREATE INDEX IF NOT EXISTS idx_tsp_active ON tele_service_pricing(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tsp_effective ON tele_service_pricing(effective_from, effective_to);

-- =====================================================================
-- 3. tele_config_audit_log — Lịch sử thay đổi config
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_config_audit_log (
    log_id                 VARCHAR(50) PRIMARY KEY,
    config_key             VARCHAR(100) NOT NULL,
    old_value              TEXT,
    new_value              TEXT,
    changed_by             VARCHAR(50),
    changed_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tcal_key ON tele_config_audit_log(config_key);
CREATE INDEX IF NOT EXISTS idx_tcal_time ON tele_config_audit_log(changed_at DESC);

-- *********************************************************************
-- SEED: Default configs
-- *********************************************************************
INSERT INTO tele_system_configs (config_id, config_key, config_value, config_type, category, description, is_editable) VALUES
-- PLATFORM
('TSC_01', 'VIDEO_PROVIDER',                  'AGORA',                              'STRING',  'PLATFORM',    'Nhà cung cấp nền tảng video (AGORA, ZOOM, STRINGEE)',     TRUE),
('TSC_02', 'MAX_SESSION_DURATION_MINUTES',     '120',                                'INTEGER', 'PLATFORM',    'Thời lượng tối đa 1 phiên (phút)',                        TRUE),
('TSC_03', 'AUTO_RECORD_SESSIONS',             'false',                              'BOOLEAN', 'PLATFORM',    'Tự động ghi hình phiên khám',                             TRUE),
('TSC_04', 'ALLOWED_FILE_TYPES',               '["jpg","png","pdf","docx"]',         'JSON',    'PLATFORM',    'Loại file cho phép chia sẻ',                               TRUE),
('TSC_05', 'MAX_FILE_SIZE_MB',                 '10',                                 'INTEGER', 'PLATFORM',    'Dung lượng file tối đa (MB)',                              TRUE),
-- SECURITY
('TSC_06', 'REQUIRE_IDENTITY_VERIFICATION',    'true',                               'BOOLEAN', 'SECURITY',    'Bắt buộc xác minh danh tính BN',                         TRUE),
('TSC_07', 'SESSION_IDLE_TIMEOUT_MINUTES',     '15',                                 'INTEGER', 'SECURITY',    'Tự ngắt kết nối sau khi idle (phút)',                     TRUE),
('TSC_08', 'ENCRYPTION_ENABLED',               'true',                               'BOOLEAN', 'SECURITY',    'Mã hóa kết nối end-to-end',                               FALSE),
('TSC_09', 'MAX_LOGIN_ATTEMPTS_TELE',          '5',                                  'INTEGER', 'SECURITY',    'Giới hạn đăng nhập sai cho teleconsultation',             TRUE),
-- USAGE_LIMIT
('TSC_10', 'MAX_DAILY_CONSULTATIONS_PER_DOCTOR', '20',                               'INTEGER', 'USAGE_LIMIT', 'Giới hạn phiên khám/ngày/BS',                             TRUE),
('TSC_11', 'MAX_DAILY_CONSULTATIONS_PER_PATIENT','3',                                'INTEGER', 'USAGE_LIMIT', 'Giới hạn phiên khám/ngày/BN',                             TRUE),
('TSC_12', 'MAX_CONCURRENT_SESSIONS',           '50',                                'INTEGER', 'USAGE_LIMIT', 'Số phiên đồng thời tối đa',                               TRUE),
('TSC_13', 'BOOKING_ADVANCE_DAYS',              '30',                                'INTEGER', 'USAGE_LIMIT', 'Đặt lịch trước tối đa (ngày)',                            TRUE),
-- OPERATION
('TSC_14', 'AUTO_CANCEL_NO_SHOW_MINUTES',       '15',                                'INTEGER', 'OPERATION',   'Hủy tự động nếu BN không vào phòng sau X phút',          TRUE),
('TSC_15', 'REMINDER_BEFORE_MINUTES',           '30',                                'INTEGER', 'OPERATION',   'Gửi nhắc trước buổi khám (phút)',                        TRUE),
('TSC_16', 'ALLOW_WALK_IN_TELE',                'false',                             'BOOLEAN', 'OPERATION',   'Cho phép khám không đặt lịch trước',                     TRUE),
('TSC_17', 'REQUIRE_PAYMENT_BEFORE',            'true',                              'BOOLEAN', 'OPERATION',   'Bắt buộc thanh toán trước khám',                         TRUE),
-- SLA
('TSC_18', 'TARGET_WAIT_TIME_MINUTES',          '5',                                 'INTEGER', 'SLA',         'Thời gian chờ mục tiêu (phút)',                           TRUE),
('TSC_19', 'TARGET_AVAILABILITY_PERCENT',       '99.5',                              'STRING',  'SLA',         'Uptime mục tiêu (%)',                                     TRUE),
('TSC_20', 'ESCALATION_WAIT_MINUTES',           '10',                                'INTEGER', 'SLA',         'Escalate nếu BN chờ quá X phút',                         TRUE)
ON CONFLICT (config_key) DO NOTHING;

-- *********************************************************************
-- PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_CFG_VIEW',    'TELE_CFG_VIEW',    'REMOTE_CONSULTATION', 'Xem cấu hình teleconsultation'),
('PERM_TELE_CFG_MANAGE',  'TELE_CFG_MANAGE',  'REMOTE_CONSULTATION', 'Quản lý cấu hình teleconsultation'),
('PERM_TELE_PRICE_VIEW',  'TELE_PRICE_VIEW',  'REMOTE_CONSULTATION', 'Xem bảng giá khám từ xa'),
('PERM_TELE_PRICE_MANAGE','TELE_PRICE_MANAGE','REMOTE_CONSULTATION', 'Quản lý bảng giá khám từ xa')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TELE_CFG_VIEW','TELE_CFG_MANAGE','TELE_PRICE_VIEW','TELE_PRICE_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Configs
('API_TELE_CFG_LIST',       'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/configs',                    'DS configs'),
('API_TELE_CFG_GET',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/configs/:configKey',          'Lấy 1 config'),
('API_TELE_CFG_UPDATE',     'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/admin/configs/:configKey',          'Cập nhật config'),
('API_TELE_CFG_BATCH',      'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/admin/configs/batch',               'Batch update'),
('API_TELE_CFG_RESET',      'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/admin/configs/reset',               'Reset default'),
('API_TELE_CFG_AUDIT',      'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/configs/audit-log',           'Audit log'),
-- Pricing
('API_TELE_PRICE_CREATE',   'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/admin/pricing',                    'Tạo giá'),
('API_TELE_PRICE_UPDATE',   'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/admin/pricing/:pricingId',          'Cập nhật giá'),
('API_TELE_PRICE_DELETE',   'REMOTE_CONSULTATION', 'DELETE', '/api/teleconsultation/admin/pricing/:pricingId',          'Xóa giá'),
('API_TELE_PRICE_LIST',     'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/pricing',                    'DS giá'),
('API_TELE_PRICE_LOOKUP',   'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/pricing/lookup',              'Tra cứu giá'),
-- SLA
('API_TELE_SLA_DASHBOARD',  'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/sla/dashboard',               'SLA dashboard'),
('API_TELE_SLA_BREACHES',   'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/admin/sla/breaches',                'DS vi phạm SLA')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN → all
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_CFG_%'
ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_PRICE_%'
ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_SLA_%'
ON CONFLICT DO NOTHING;

-- DOCTOR + PATIENT → lookup price
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR','PATIENT') AND a.api_id = 'API_TELE_PRICE_LOOKUP'
ON CONFLICT DO NOTHING;
