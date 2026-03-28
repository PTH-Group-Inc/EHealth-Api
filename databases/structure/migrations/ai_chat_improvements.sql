-- *********************************************************************
-- MODULE 7.1 — CẢI THIỆN AI HEALTH CHAT
-- Conversation State Machine + Server-side Symptom Tracking
-- *********************************************************************

-- =====================================================================
-- 1. Thêm cột conversation_state JSONB vào ai_chat_sessions
-- Lưu trữ trạng thái hội thoại (phase, chủ đề đã khóa, triệu chứng
-- đã thu thập phía server) để kiểm soát flow và chống lạc đề.
-- =====================================================================
ALTER TABLE ai_chat_sessions
    ADD COLUMN IF NOT EXISTS conversation_state JSONB DEFAULT '{
        "phase": "GREETING",
        "locked_specialty_group": null,
        "symptoms_collected": [],
        "symptoms_excluded": [],
        "questions_asked": 0,
        "discovery_complete": false,
        "conversation_summary": null
    }';

-- Index cho truy vấn theo phase (debug/thống kê)
CREATE INDEX IF NOT EXISTS idx_acs_phase
    ON ai_chat_sessions ((conversation_state->>'phase'));
