-- *********************************************************************
-- MODULE 8.3: PHÒNG KHÁM TRỰC TUYẾN (Virtual Consultation Room)
-- *********************************************************************

-- =====================================================================
-- 1. tele_room_participants — Người tham gia phòng khám
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_room_participants (
    participant_id         VARCHAR(50) PRIMARY KEY,
    tele_consultation_id   VARCHAR(50) NOT NULL,
    user_id                VARCHAR(50) NOT NULL,
    participant_role       VARCHAR(20) DEFAULT 'GUEST',            -- HOST, GUEST, OBSERVER
    join_time              TIMESTAMPTZ,
    leave_time             TIMESTAMPTZ,
    duration_seconds       INT DEFAULT 0,
    is_video_on            BOOLEAN DEFAULT FALSE,
    is_audio_on            BOOLEAN DEFAULT FALSE,
    is_screen_sharing      BOOLEAN DEFAULT FALSE,
    connection_quality     VARCHAR(20) DEFAULT 'GOOD',             -- EXCELLENT, GOOD, FAIR, POOR
    device_info            JSONB,                                  -- {browser, os, ip_hash}
    room_token             VARCHAR(255),
    token_expires_at       TIMESTAMPTZ,
    status                 VARCHAR(20) DEFAULT 'WAITING',          -- WAITING, IN_ROOM, LEFT, KICKED
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trp_consultation ON tele_room_participants(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_trp_user ON tele_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trp_status ON tele_room_participants(status);
CREATE INDEX IF NOT EXISTS idx_trp_token ON tele_room_participants(room_token) WHERE room_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_trp_unique_active ON tele_room_participants(tele_consultation_id, user_id) WHERE status IN ('WAITING','IN_ROOM');

-- =====================================================================
-- 2. tele_room_events — Activity log phòng khám
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_room_events (
    event_id               VARCHAR(50) PRIMARY KEY,
    tele_consultation_id   VARCHAR(50) NOT NULL,
    user_id                VARCHAR(50),
    event_type             VARCHAR(50) NOT NULL,
    -- JOIN, LEAVE, VIDEO_ON, VIDEO_OFF, AUDIO_ON, AUDIO_OFF,
    -- SCREEN_SHARE_START, SCREEN_SHARE_STOP, FILE_SHARED,
    -- ROOM_OPENED, ROOM_CLOSED, NETWORK_ISSUE, RECONNECTED, KICKED
    event_data             JSONB,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tre_consultation ON tele_room_events(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_tre_type ON tele_room_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tre_time ON tele_room_events(tele_consultation_id, created_at ASC);

-- =====================================================================
-- 3. tele_shared_files — Tài liệu chia sẻ trong phiên
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_shared_files (
    file_id                VARCHAR(50) PRIMARY KEY,
    tele_consultation_id   VARCHAR(50) NOT NULL,
    uploaded_by            VARCHAR(50) NOT NULL,
    file_name              VARCHAR(255) NOT NULL,
    file_url               TEXT NOT NULL,
    file_type              VARCHAR(50) DEFAULT 'DOCUMENT',         -- IMAGE, PDF, DOCUMENT, LAB_RESULT, PRESCRIPTION
    file_size              INT,                                    -- bytes
    mime_type              VARCHAR(100),
    thumbnail_url          TEXT,
    description            TEXT,
    is_medical_record      BOOLEAN DEFAULT FALSE,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(users_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tsf_consultation ON tele_shared_files(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_tsf_uploader ON tele_shared_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tsf_type ON tele_shared_files(file_type);

-- =====================================================================
-- 4. ALTER tele_consultations — Bổ sung quản lý phòng
-- =====================================================================
ALTER TABLE tele_consultations
    ADD COLUMN IF NOT EXISTS room_status VARCHAR(30) DEFAULT 'SCHEDULED',
    ADD COLUMN IF NOT EXISTS room_opened_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS room_opened_by VARCHAR(50),
    ADD COLUMN IF NOT EXISTS room_closed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS total_duration_seconds INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS participant_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS has_chat BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS has_file_sharing BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS network_issues_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ended_reason VARCHAR(50);

DO $$ BEGIN
    ALTER TABLE tele_consultations
        ADD CONSTRAINT fk_tele_room_opened_by FOREIGN KEY (room_opened_by) REFERENCES users(users_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tele_room_status ON tele_consultations(room_status);
CREATE INDEX IF NOT EXISTS idx_tele_room_active ON tele_consultations(room_status) WHERE room_status IN ('WAITING','ONGOING');

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_ROOM_VIEW',     'TELE_ROOM_VIEW',     'REMOTE_CONSULTATION', 'Xem phòng khám trực tuyến'),
('PERM_TELE_ROOM_MANAGE',   'TELE_ROOM_MANAGE',   'REMOTE_CONSULTATION', 'Quản lý phòng khám (mở/đóng/kick)'),
('PERM_TELE_ROOM_JOIN',     'TELE_ROOM_JOIN',      'REMOTE_CONSULTATION', 'Tham gia phòng khám trực tuyến')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TELE_ROOM_VIEW','TELE_ROOM_MANAGE','TELE_ROOM_JOIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('TELE_ROOM_VIEW','TELE_ROOM_MANAGE','TELE_ROOM_JOIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN ('TELE_ROOM_VIEW','TELE_ROOM_JOIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Room Management
('API_TELE_ROOM_OPEN',           'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/open',             'Mở phòng khám trực tuyến'),
('API_TELE_ROOM_JOIN',           'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/join',             'Tham gia phòng'),
('API_TELE_ROOM_LEAVE',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/leave',            'Rời phòng'),
('API_TELE_ROOM_CLOSE',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/close',            'Đóng phòng / kết thúc phiên'),
('API_TELE_ROOM_DETAIL',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/:consultationId',                  'Chi tiết phòng'),
-- Nhóm 2: Chat
('API_TELE_ROOM_MSG_SEND',       'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/messages',         'Gửi tin nhắn'),
('API_TELE_ROOM_MSG_LIST',       'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/:consultationId/messages',         'Lịch sử chat'),
('API_TELE_ROOM_MSG_READ',       'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/room/:consultationId/messages/read',    'Đánh dấu đã đọc'),
-- Nhóm 3: File sharing
('API_TELE_ROOM_FILE_UPLOAD',    'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/files',            'Upload file'),
('API_TELE_ROOM_FILE_LIST',      'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/:consultationId/files',            'DS file chia sẻ'),
('API_TELE_ROOM_FILE_DELETE',    'REMOTE_CONSULTATION', 'DELETE', '/api/teleconsultation/room/:consultationId/files/:fileId',     'Xóa file'),
-- Nhóm 4: Media & Participants
('API_TELE_ROOM_MEDIA',          'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/room/:consultationId/media',            'Cập nhật cam/mic/screen'),
('API_TELE_ROOM_PARTICIPANTS',   'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/:consultationId/participants',     'DS người tham gia'),
('API_TELE_ROOM_KICK',           'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/kick/:userId',     'Kick người dùng'),
-- Nhóm 5: Events & Stats
('API_TELE_ROOM_EVENTS',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/:consultationId/events',           'Activity log'),
('API_TELE_ROOM_NETWORK',        'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/room/:consultationId/network-report',   'Report network quality'),
('API_TELE_ROOM_SUMMARY',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/:consultationId/summary',          'Tổng kết phiên'),
('API_TELE_ROOM_ACTIVE',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/room/active',                           'DS phòng đang hoạt động')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API: ADMIN (full)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_ROOM_%'
ON CONFLICT DO NOTHING;

-- ROLE → API: DOCTOR
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_ROOM_OPEN','API_TELE_ROOM_JOIN','API_TELE_ROOM_LEAVE','API_TELE_ROOM_CLOSE','API_TELE_ROOM_DETAIL',
    'API_TELE_ROOM_MSG_SEND','API_TELE_ROOM_MSG_LIST','API_TELE_ROOM_MSG_READ',
    'API_TELE_ROOM_FILE_UPLOAD','API_TELE_ROOM_FILE_LIST','API_TELE_ROOM_FILE_DELETE',
    'API_TELE_ROOM_MEDIA','API_TELE_ROOM_PARTICIPANTS','API_TELE_ROOM_KICK',
    'API_TELE_ROOM_EVENTS','API_TELE_ROOM_NETWORK','API_TELE_ROOM_SUMMARY'
) ON CONFLICT DO NOTHING;

-- ROLE → API: PATIENT
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_TELE_ROOM_JOIN','API_TELE_ROOM_LEAVE','API_TELE_ROOM_DETAIL',
    'API_TELE_ROOM_MSG_SEND','API_TELE_ROOM_MSG_LIST','API_TELE_ROOM_MSG_READ',
    'API_TELE_ROOM_FILE_UPLOAD','API_TELE_ROOM_FILE_LIST',
    'API_TELE_ROOM_MEDIA','API_TELE_ROOM_PARTICIPANTS','API_TELE_ROOM_NETWORK'
) ON CONFLICT DO NOTHING;
