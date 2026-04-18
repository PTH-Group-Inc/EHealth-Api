-- Migration: Tạo VIEW thống kê token usage hàng ngày
-- Aggregate từ dữ liệu có sẵn trong ai_chat_messages (không cần table mới)

CREATE OR REPLACE VIEW ai_token_usage_daily AS
SELECT 
    DATE(created_at) AS usage_date,
    model_used,
    COUNT(*) AS total_messages,
    SUM(tokens_used) AS total_tokens,
    AVG(response_time_ms)::INTEGER AS avg_response_ms
FROM ai_chat_messages 
WHERE role = 'ASSISTANT'
GROUP BY DATE(created_at), model_used
ORDER BY usage_date DESC;
