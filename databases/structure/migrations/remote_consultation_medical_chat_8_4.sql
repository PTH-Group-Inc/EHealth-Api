-- *********************************************************************
-- MODULE 8.4: TRAO ĐỔI THÔNG TIN Y TẾ TRỰC TUYẾN
-- (Medical Information Exchange — Async Medical Chat)
-- *********************************************************************

-- =====================================================================
-- 1. medical_conversations — Cuộc hội thoại y tế
-- =====================================================================
CREATE TABLE IF NOT EXISTS medical_conversations (
    conversation_id        VARCHAR(50) PRIMARY KEY,
    patient_id             VARCHAR(50) NOT NULL,
    doctor_id              VARCHAR(50) NOT NULL,
    specialty_id           VARCHAR(50),
    appointment_id         VARCHAR(50),
    encounter_id           VARCHAR(50),
    subject                VARCHAR(255),
    status                 VARCHAR(20) DEFAULT 'ACTIVE',           -- ACTIVE, CLOSED, ARCHIVED
    priority               VARCHAR(20) DEFAULT 'NORMAL',           -- NORMAL, URGENT, FOLLOW_UP
    last_message_at        TIMESTAMPTZ,
    last_message_preview   TEXT,
    unread_count_patient   INT DEFAULT 0,
    unread_count_doctor    INT DEFAULT 0,
    is_patient_initiated   BOOLEAN DEFAULT FALSE,
    closed_at              TIMESTAMPTZ,
    closed_by              VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE SET NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE SET NULL,
    FOREIGN KEY (closed_by) REFERENCES users(users_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mc_patient ON medical_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_mc_doctor ON medical_conversations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_mc_status ON medical_conversations(status);
CREATE INDEX IF NOT EXISTS idx_mc_last_msg ON medical_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_priority ON medical_conversations(priority) WHERE priority = 'URGENT';

-- =====================================================================
-- 2. medical_chat_messages — Tin nhắn y tế
-- =====================================================================
CREATE TABLE IF NOT EXISTS medical_chat_messages (
    message_id             VARCHAR(50) PRIMARY KEY,
    conversation_id        VARCHAR(50) NOT NULL,
    sender_id              VARCHAR(50) NOT NULL,
    sender_type            VARCHAR(20) NOT NULL,                   -- DOCTOR, PATIENT, SYSTEM
    message_type           VARCHAR(30) DEFAULT 'TEXT',             -- TEXT, IMAGE, FILE, LAB_RESULT, PRESCRIPTION, SYSTEM_NOTE
    content                TEXT,
    is_read                BOOLEAN DEFAULT FALSE,
    read_at                TIMESTAMPTZ,
    is_pinned              BOOLEAN DEFAULT FALSE,
    is_deleted             BOOLEAN DEFAULT FALSE,
    reply_to_id            VARCHAR(50),
    metadata               JSONB,
    sent_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES medical_conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES medical_chat_messages(message_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mcm_conversation ON medical_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mcm_sent ON medical_chat_messages(conversation_id, sent_at ASC);
CREATE INDEX IF NOT EXISTS idx_mcm_pinned ON medical_chat_messages(conversation_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_mcm_unread ON medical_chat_messages(conversation_id, is_read) WHERE is_read = FALSE AND is_deleted = FALSE;

-- =====================================================================
-- 3. medical_chat_attachments — File đính kèm
-- =====================================================================
CREATE TABLE IF NOT EXISTS medical_chat_attachments (
    attachment_id          VARCHAR(50) PRIMARY KEY,
    message_id             VARCHAR(50) NOT NULL,
    file_name              VARCHAR(255) NOT NULL,
    file_url               TEXT NOT NULL,
    file_type              VARCHAR(50) DEFAULT 'DOCUMENT',         -- IMAGE, PDF, LAB_RESULT, PRESCRIPTION, DOCUMENT
    file_size              INT,
    mime_type              VARCHAR(100),
    thumbnail_url          TEXT,
    is_medical_record      BOOLEAN DEFAULT FALSE,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES medical_chat_messages(message_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mca_message ON medical_chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_mca_medical ON medical_chat_attachments(is_medical_record) WHERE is_medical_record = TRUE;

-- *********************************************************************
-- PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_MED_CHAT_VIEW',     'MED_CHAT_VIEW',     'REMOTE_CONSULTATION', 'Xem cuộc hội thoại y tế'),
('PERM_MED_CHAT_SEND',     'MED_CHAT_SEND',     'REMOTE_CONSULTATION', 'Gửi tin nhắn y tế'),
('PERM_MED_CHAT_MANAGE',   'MED_CHAT_MANAGE',   'REMOTE_CONSULTATION', 'Quản lý hội thoại (đóng/mở/xem tất cả)')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('MED_CHAT_VIEW','MED_CHAT_SEND','MED_CHAT_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('MED_CHAT_VIEW','MED_CHAT_SEND','MED_CHAT_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN ('MED_CHAT_VIEW','MED_CHAT_SEND')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Conversations
('API_MED_CHAT_CONV_CREATE',       'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/medical-chat/conversations',                                   'Tạo cuộc hội thoại'),
('API_MED_CHAT_CONV_LIST',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/conversations',                                   'DS cuộc hội thoại'),
('API_MED_CHAT_CONV_DETAIL',       'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/conversations/:conversationId',                   'Chi tiết hội thoại'),
('API_MED_CHAT_CONV_CLOSE',        'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/medical-chat/conversations/:conversationId/close',             'Đóng hội thoại'),
('API_MED_CHAT_CONV_REOPEN',       'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/medical-chat/conversations/:conversationId/reopen',            'Mở lại hội thoại'),
-- Messages
('API_MED_CHAT_MSG_SEND',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/medical-chat/conversations/:conversationId/messages',          'Gửi tin nhắn'),
('API_MED_CHAT_MSG_LIST',          'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/conversations/:conversationId/messages',          'Lịch sử chat'),
('API_MED_CHAT_MSG_READ',          'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/medical-chat/conversations/:conversationId/messages/read',     'Đánh dấu đã đọc'),
('API_MED_CHAT_MSG_PIN',           'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/medical-chat/conversations/:conversationId/messages/:messageId/pin', 'Ghim/bỏ ghim'),
('API_MED_CHAT_MSG_DELETE',        'REMOTE_CONSULTATION', 'DELETE', '/api/teleconsultation/medical-chat/conversations/:conversationId/messages/:messageId','Xóa tin nhắn'),
('API_MED_CHAT_MSG_PINNED',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/conversations/:conversationId/messages/pinned',   'DS tin ghim'),
-- Attachments
('API_MED_CHAT_ATT_LIST',          'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/conversations/:conversationId/attachments',       'DS file đính kèm'),
('API_MED_CHAT_ATT_MEDICAL',       'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/conversations/:conversationId/attachments/medical','DS file y tế'),
-- Stats
('API_MED_CHAT_UNREAD',            'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/unread-count',                                    'Đếm tin chưa đọc'),
('API_MED_CHAT_MY_PATIENTS',       'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/medical-chat/my-patients',                                     'DS BN đang chat')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN → all
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_MED_CHAT_%'
ON CONFLICT DO NOTHING;

-- DOCTOR
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_MED_CHAT_CONV_CREATE','API_MED_CHAT_CONV_LIST','API_MED_CHAT_CONV_DETAIL',
    'API_MED_CHAT_CONV_CLOSE','API_MED_CHAT_CONV_REOPEN',
    'API_MED_CHAT_MSG_SEND','API_MED_CHAT_MSG_LIST','API_MED_CHAT_MSG_READ',
    'API_MED_CHAT_MSG_PIN','API_MED_CHAT_MSG_DELETE','API_MED_CHAT_MSG_PINNED',
    'API_MED_CHAT_ATT_LIST','API_MED_CHAT_ATT_MEDICAL',
    'API_MED_CHAT_UNREAD','API_MED_CHAT_MY_PATIENTS'
) ON CONFLICT DO NOTHING;

-- PATIENT
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_MED_CHAT_CONV_CREATE','API_MED_CHAT_CONV_LIST','API_MED_CHAT_CONV_DETAIL',
    'API_MED_CHAT_MSG_SEND','API_MED_CHAT_MSG_LIST','API_MED_CHAT_MSG_READ',
    'API_MED_CHAT_MSG_DELETE','API_MED_CHAT_MSG_PINNED',
    'API_MED_CHAT_ATT_LIST','API_MED_CHAT_UNREAD'
) ON CONFLICT DO NOTHING;
