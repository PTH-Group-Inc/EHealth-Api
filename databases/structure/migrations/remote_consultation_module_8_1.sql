-- *********************************************************************
-- MODULE 8.1: QUẢN LÝ HÌNH THỨC KHÁM TỪ XA
-- (Teleconsultation Type Management)
-- *********************************************************************

-- =====================================================================
-- 1. tele_consultation_types — Danh mục hình thức khám từ xa
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_consultation_types (
    type_id                VARCHAR(50) PRIMARY KEY,
    code                   VARCHAR(50) UNIQUE NOT NULL,            -- VIDEO, AUDIO, CHAT, HYBRID
    name                   VARCHAR(150) NOT NULL,
    description            TEXT,
    -- Platform & capabilities
    default_platform       VARCHAR(50) DEFAULT 'AGORA',            -- AGORA, ZOOM, STRINGEE, INTERNAL_CHAT
    requires_video         BOOLEAN DEFAULT FALSE,
    requires_audio         BOOLEAN DEFAULT FALSE,
    allows_file_sharing    BOOLEAN DEFAULT FALSE,
    allows_screen_sharing  BOOLEAN DEFAULT FALSE,
    -- Thời lượng mặc định (phút)
    default_duration_minutes INT DEFAULT 30,
    min_duration_minutes     INT DEFAULT 10,
    max_duration_minutes     INT DEFAULT 120,
    -- Hiển thị
    icon_url               TEXT,
    sort_order             INT DEFAULT 0,
    -- Trạng thái
    is_active              BOOLEAN DEFAULT TRUE,
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at             TIMESTAMPTZ,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_tele_type_code ON tele_consultation_types(code);
CREATE INDEX IF NOT EXISTS idx_tele_type_active ON tele_consultation_types(is_active) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tele_type_sort ON tele_consultation_types(sort_order ASC);

-- =====================================================================
-- 2. tele_type_specialty_config — Cấu hình hình thức theo chuyên khoa & cơ sở
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_type_specialty_config (
    config_id              VARCHAR(50) PRIMARY KEY,
    type_id                VARCHAR(50) NOT NULL,
    specialty_id           VARCHAR(50) NOT NULL,
    facility_id            VARCHAR(50) NOT NULL,
    -- Liên kết dịch vụ cơ sở (optional, để tận dụng hệ thống giá Module 9)
    facility_service_id    VARCHAR(50),
    -- Bật/tắt
    is_enabled             BOOLEAN DEFAULT TRUE,
    -- Platform override
    allowed_platforms      JSONB DEFAULT '["AGORA"]',              -- ["AGORA","ZOOM"]
    -- Thời lượng override (nếu null thì dùng default từ type)
    min_duration_minutes   INT,
    max_duration_minutes   INT,
    default_duration_minutes INT,
    -- Giá dịch vụ
    base_price             DECIMAL(12,2) DEFAULT 0,                -- Giá cơ bản (VND)
    insurance_price        DECIMAL(12,2),                          -- Giá BHYT chi trả
    vip_price              DECIMAL(12,2),                          -- Giá VIP
    -- Quy định đặt lịch
    max_patients_per_slot  INT DEFAULT 1,
    advance_booking_days   INT DEFAULT 30,                         -- Đặt trước tối đa N ngày
    cancellation_hours     INT DEFAULT 2,                          -- Hủy trước N giờ
    -- Ghi hình
    auto_record            BOOLEAN DEFAULT FALSE,
    -- Hiển thị
    priority               INT DEFAULT 0,
    notes                  TEXT,
    -- Trạng thái
    is_active              BOOLEAN DEFAULT TRUE,
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at             TIMESTAMPTZ,
    -- FK
    FOREIGN KEY (type_id) REFERENCES tele_consultation_types(type_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    -- 1 loại + 1 CK + 1 CS = 1 config duy nhất
    UNIQUE(type_id, specialty_id, facility_id)
);

CREATE INDEX IF NOT EXISTS idx_tsc_type ON tele_type_specialty_config(type_id);
CREATE INDEX IF NOT EXISTS idx_tsc_specialty ON tele_type_specialty_config(specialty_id);
CREATE INDEX IF NOT EXISTS idx_tsc_facility ON tele_type_specialty_config(facility_id);
CREATE INDEX IF NOT EXISTS idx_tsc_enabled ON tele_type_specialty_config(is_enabled) WHERE is_enabled = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tsc_service ON tele_type_specialty_config(facility_service_id) WHERE facility_service_id IS NOT NULL;

-- =====================================================================
-- 3. ALTER tele_consultations — Bổ sung liên kết loại hình
-- =====================================================================
ALTER TABLE tele_consultations
    ADD COLUMN IF NOT EXISTS consultation_type_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS specialty_config_id  VARCHAR(50);

DO $$ BEGIN
    ALTER TABLE tele_consultations
        ADD CONSTRAINT fk_tele_consultation_type FOREIGN KEY (consultation_type_id) REFERENCES tele_consultation_types(type_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE tele_consultations
        ADD CONSTRAINT fk_tele_specialty_config FOREIGN KEY (specialty_config_id) REFERENCES tele_type_specialty_config(config_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tele_consult_type ON tele_consultations(consultation_type_id) WHERE consultation_type_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tele_consult_config ON tele_consultations(specialty_config_id) WHERE specialty_config_id IS NOT NULL;

-- =====================================================================
-- 4. Seed data — 4 hình thức mặc định
-- =====================================================================
INSERT INTO tele_consultation_types (type_id, code, name, description, default_platform, requires_video, requires_audio, allows_file_sharing, allows_screen_sharing, default_duration_minutes, min_duration_minutes, max_duration_minutes, sort_order, is_active)
VALUES
    ('TCT_VIDEO', 'VIDEO', 'Khám qua Video', 'Khám bệnh trực tuyến qua cuộc gọi video 2 chiều. Bác sĩ có thể quan sát bệnh nhân, đánh giá triệu chứng trực quan.', 'AGORA', TRUE, TRUE, TRUE, TRUE, 30, 15, 60, 1, TRUE),
    ('TCT_AUDIO', 'AUDIO', 'Tư vấn qua Audio', 'Tư vấn y tế qua cuộc gọi thoại. Phù hợp cho tái khám, hỏi thuốc, tư vấn kết quả xét nghiệm.', 'AGORA', FALSE, TRUE, FALSE, FALSE, 20, 10, 45, 2, TRUE),
    ('TCT_CHAT', 'CHAT', 'Tư vấn Chat y tế', 'Tư vấn qua tin nhắn văn bản. Bệnh nhân có thể gửi ảnh triệu chứng, kết quả xét nghiệm đính kèm.', 'INTERNAL_CHAT', FALSE, FALSE, TRUE, FALSE, 15, 5, 60, 3, TRUE),
    ('TCT_HYBRID', 'HYBRID', 'Khám kết hợp (Hybrid)', 'Kết hợp nhiều hình thức trong 1 phiên. VD: Chat trước để mô tả triệu chứng, sau đó nâng cấp lên Video.', 'AGORA', TRUE, TRUE, TRUE, TRUE, 45, 15, 90, 4, TRUE)
ON CONFLICT (code) DO NOTHING;

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELECONSULT_VIEW',       'TELECONSULTATION_VIEW',       'REMOTE_CONSULTATION', 'Xem danh sách loại hình khám từ xa & cấu hình chuyên khoa'),
('PERM_TELECONSULT_MANAGE',     'TELECONSULTATION_MANAGE',     'REMOTE_CONSULTATION', 'Quản lý loại hình khám từ xa, cấu hình chuyên khoa, giá dịch vụ'),
('PERM_TELECONSULT_DASHBOARD',  'TELECONSULTATION_DASHBOARD',  'REMOTE_CONSULTATION', 'Xem thống kê & dashboard khám từ xa')
ON CONFLICT DO NOTHING;

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'TELECONSULTATION_VIEW','TELECONSULTATION_MANAGE','TELECONSULTATION_DASHBOARD'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: xem loại hình & cấu hình
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN (
    'TELECONSULTATION_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem loại hình
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN (
    'TELECONSULTATION_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Quản lý loại hình
('API_TELE_TYPE_CREATE',        'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/types',                          'Tạo loại hình khám từ xa'),
('API_TELE_TYPE_LIST',          'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/types',                          'Danh sách loại hình khám từ xa'),
('API_TELE_TYPE_ACTIVE',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/types/active',                   'Danh sách hình thức đang hoạt động'),
('API_TELE_TYPE_DETAIL',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/types/:typeId',                  'Chi tiết loại hình khám từ xa'),
('API_TELE_TYPE_UPDATE',        'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/types/:typeId',                  'Cập nhật loại hình khám từ xa'),
('API_TELE_TYPE_DELETE',        'REMOTE_CONSULTATION', 'DELETE', '/api/teleconsultation/types/:typeId',                  'Xóa loại hình khám từ xa'),
-- Nhóm 2: Cấu hình chuyên khoa
('API_TELE_CFG_CREATE',         'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/configs',                        'Tạo cấu hình chuyên khoa'),
('API_TELE_CFG_BATCH',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/configs/batch',                  'Tạo hàng loạt cấu hình chuyên khoa'),
('API_TELE_CFG_LIST',           'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/configs',                        'Danh sách cấu hình chuyên khoa'),
('API_TELE_CFG_DETAIL',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/configs/:configId',              'Chi tiết cấu hình chuyên khoa'),
('API_TELE_CFG_UPDATE',         'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/configs/:configId',              'Cập nhật cấu hình chuyên khoa'),
('API_TELE_CFG_DELETE',         'REMOTE_CONSULTATION', 'DELETE', '/api/teleconsultation/configs/:configId',              'Xóa cấu hình chuyên khoa'),
('API_TELE_TYPE_SPECIALTIES',   'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/types/:typeId/specialties',      'DS chuyên khoa theo loại hình'),
('API_TELE_SPECIALTY_TYPES',    'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/specialties/:specialtyId/types', 'DS loại hình theo chuyên khoa'),
-- Nhóm 3: Tra cứu & Thống kê
('API_TELE_AVAILABILITY',       'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/availability',                   'Kiểm tra hình thức khả dụng'),
('API_TELE_STATS',              'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/stats',                          'Thống kê tổng quan khám từ xa')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API: ADMIN (full access)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_TELE_TYPE_CREATE','API_TELE_TYPE_LIST','API_TELE_TYPE_ACTIVE','API_TELE_TYPE_DETAIL',
    'API_TELE_TYPE_UPDATE','API_TELE_TYPE_DELETE',
    'API_TELE_CFG_CREATE','API_TELE_CFG_BATCH','API_TELE_CFG_LIST','API_TELE_CFG_DETAIL',
    'API_TELE_CFG_UPDATE','API_TELE_CFG_DELETE',
    'API_TELE_TYPE_SPECIALTIES','API_TELE_SPECIALTY_TYPES',
    'API_TELE_AVAILABILITY','API_TELE_STATS'
) ON CONFLICT DO NOTHING;

-- ROLE → API: DOCTOR (xem loại hình + cấu hình + availability)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_TYPE_LIST','API_TELE_TYPE_ACTIVE','API_TELE_TYPE_DETAIL',
    'API_TELE_CFG_LIST','API_TELE_CFG_DETAIL',
    'API_TELE_TYPE_SPECIALTIES','API_TELE_SPECIALTY_TYPES',
    'API_TELE_AVAILABILITY'
) ON CONFLICT DO NOTHING;

-- ROLE → API: NURSE (xem danh sách + availability)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_TELE_TYPE_LIST','API_TELE_TYPE_ACTIVE',
    'API_TELE_SPECIALTY_TYPES','API_TELE_AVAILABILITY'
) ON CONFLICT DO NOTHING;
