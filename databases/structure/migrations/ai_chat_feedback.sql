-- *********************************************************************
-- MODULE 7.1 — AI CHAT FEEDBACK LOOP
-- Thu thập phản hồi đánh giá chất lượng từ user cho mỗi tin nhắn AI.
-- Dùng để phân tích và cải thiện prompt AI theo thời gian.
-- *********************************************************************

-- Thêm cột feedback vào bảng tin nhắn
ALTER TABLE ai_chat_messages
    ADD COLUMN IF NOT EXISTS user_feedback VARCHAR(10),   -- GOOD | BAD
    ADD COLUMN IF NOT EXISTS feedback_note TEXT;           -- Ghi chú tùy chọn

-- Index hỗ trợ thống kê feedback (chỉ index các tin nhắn đã có feedback)
CREATE INDEX IF NOT EXISTS idx_acm_feedback
    ON ai_chat_messages (user_feedback)
    WHERE user_feedback IS NOT NULL;
