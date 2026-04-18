-- *********************************************************************
-- MODULE 7.1: AI TƯ VẤN SỨC KHỎE BAN ĐẦU
-- (AI Health Consultation Agent)
-- Liên kết: specialties, patients, users, appointments
-- *********************************************************************

-- =====================================================================
-- 1. ai_chat_sessions — Phiên hội thoại AI tư vấn sức khỏe
-- Mỗi phiên là 1 lượt bệnh nhân trao đổi với AI về triệu chứng.
-- AI sẽ hỏi chi tiết, sau đó gợi ý chuyên khoa + mức độ ưu tiên.
-- =====================================================================
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    session_id              VARCHAR(50) PRIMARY KEY,
    session_code            VARCHAR(50) UNIQUE NOT NULL,        -- AIC-YYYYMMDD-XXXX
    patient_id              VARCHAR(50),                        -- Liên kết bệnh nhân (nullable: khách vãng lai)
    user_id                 VARCHAR(50),                        -- User đăng nhập hiện tại

    -- Kết quả phân tích AI
    suggested_specialty_id  VARCHAR(50),                        -- Chuyên khoa AI gợi ý (FK → specialties)
    suggested_specialty_name VARCHAR(150),                      -- Tên chuyên khoa (snapshot)
    suggested_priority      VARCHAR(20),                        -- NORMAL | SOON | URGENT
    symptoms_summary        TEXT,                               -- AI tóm tắt triệu chứng BN
    ai_conclusion           TEXT,                               -- Kết luận/gợi ý cuối cùng của AI

    -- Trạng thái phiên
    status                  VARCHAR(20) DEFAULT 'ACTIVE',       -- ACTIVE | COMPLETED | EXPIRED
    message_count           INT DEFAULT 0,                      -- Tổng số tin nhắn trong phiên

    -- Liên kết đặt lịch (nếu BN quyết định đặt lịch từ gợi ý AI)
    appointment_id          VARCHAR(50),                        -- FK → appointments

    -- Audit
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at            TIMESTAMPTZ,

    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE SET NULL,
    FOREIGN KEY (suggested_specialty_id) REFERENCES specialties(specialties_id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_acs_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_acs_patient ON ai_chat_sessions(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acs_status ON ai_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_acs_created ON ai_chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acs_specialty ON ai_chat_sessions(suggested_specialty_id) WHERE suggested_specialty_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acs_code ON ai_chat_sessions(session_code);

-- =====================================================================
-- 2. ai_chat_messages — Tin nhắn trong phiên hội thoại AI
-- Lưu toàn bộ lịch sử chat giữa BN và AI (multi-turn).
-- Mỗi tin nhắn ASSISTANT có thể kèm analysis_data (JSON) chứa
-- kết quả phân tích triệu chứng, gợi ý chuyên khoa, câu hỏi tiếp.
-- =====================================================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    message_id       VARCHAR(50) PRIMARY KEY,
    session_id       VARCHAR(50) NOT NULL,
    role             VARCHAR(10) NOT NULL,                      -- USER | ASSISTANT | SYSTEM
    content          TEXT NOT NULL,                             -- Nội dung tin nhắn

    -- Metadata AI (chỉ cho role = ASSISTANT)
    model_used       VARCHAR(50),                               -- gemini-2.0-flash, gpt-4o...
    tokens_used      INT DEFAULT 0,                            -- Số token tiêu thụ
    response_time_ms INT DEFAULT 0,                            -- Thời gian phản hồi (ms)

    -- Kết quả phân tích (chỉ cho role = ASSISTANT, dạng JSON)
    -- {is_complete, follow_up_questions, suggested_specialty_code, priority, symptoms_collected, should_suggest_booking}
    analysis_data    JSONB,

    -- Audit
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_acm_session ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_acm_role ON ai_chat_messages(session_id, role);
CREATE INDEX IF NOT EXISTS idx_acm_created ON ai_chat_messages(session_id, created_at ASC);
