/**
 * Trạng thái hội thoại — State Machine + Server-side Symptom Tracking.
 * Lưu trong cột `conversation_state JSONB` của `ai_chat_sessions`.
 */
export interface ConversationState {
    /** Giai đoạn hiện tại: GREETING | DISCOVERY | ASSESSMENT | RECOMMENDATION | FOLLOW_UP */
    phase: string;
    /** Nhóm chuyên khoa đã khóa (vd: "DA-LIEU") — chống lạc đề */
    locked_specialty_group: string | null;
    /** Tên chuyên khoa đã khóa (vd: "Da liễu") */
    locked_specialty_name: string | null;
    /** Triệu chứng đã thu thập (tích lũy phía server) */
    symptoms_collected: string[];
    /** Triệu chứng đã loại trừ (vd: "không sốt") */
    symptoms_excluded: string[];
    /** Số câu hỏi đã hỏi trong giai đoạn DISCOVERY */
    questions_asked: number;
    /** Đã thu thập đủ thông tin chưa */
    discovery_complete: boolean;
    /** Tóm tắt hội thoại (Rolling Memory) — tạo sau 6 tin nhắn */
    conversation_summary: string | null;
    /** Severity cao nhất đã ghi nhận (monotonicity enforcement) */
    last_severity: string | null;
    /** Priority cao nhất đã ghi nhận (monotonicity enforcement) */
    last_priority: string | null;
    /** needs_doctor đã từng true chưa (không được quay lại false) */
    last_needs_doctor: boolean;
    /** Tracking triệu chứng phía server */
    symptom_tracking: {
        collected: string[];
        excluded: string[];
    } | null;
}

/** Phiên hội thoại AI tư vấn sức khỏe */
export interface AiChatSession {
    session_id: string;
    session_code: string;
    patient_id: string | null;
    user_id: string | null;
    suggested_specialty_id: string | null;
    suggested_specialty_name: string | null;
    suggested_priority: string | null;
    symptoms_summary: string | null;
    ai_conclusion: string | null;
    status: string;
    message_count: number;
    appointment_id: string | null;
    /** Trạng thái hội thoại (State Machine + Symptom Tracking) */
    conversation_state: ConversationState;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
}

/** Tin nhắn trong phiên hội thoại */
export interface AiChatMessage {
    message_id: string;
    session_id: string;
    role: string;
    content: string;
    model_used: string | null;
    tokens_used: number;
    response_time_ms: number;
    analysis_data: AiAnalysisData | null;
    created_at: Date;

    user_feedback: string | null;

    feedback_note: string | null;
}

/**
 * Dữ liệu phân tích triệu chứng từ AI (trả về trong mỗi tin nhắn ASSISTANT).
 */
export interface AiAnalysisData {
    intent_group?: number;
    is_complete: boolean;
    suggested_specialty_code: string | null;
    suggested_specialty_name: string | null;
    priority: string | null;
    symptoms_collected: string[];
    should_suggest_booking: boolean;
    reasoning: string | null;
    severity: string | null;
    can_self_treat: boolean;
    preliminary_assessment: string | null;
    recommended_actions: string[];
    red_flags_detected: string[];
    needs_doctor: boolean;
    /** Dự đoán bước tiếp người dùng muốn làm */
    predicted_next_action?: string;
    /** Gợi ý câu hỏi follow-up cho user */
    suggested_follow_up_questions?: string[];
    /** Độ tự tin 0.0 – 1.0 */
    confidence_score?: number;
}

/** Payload tạo phiên mới — userId lấy từ JWT token, không cần truyền patient_id */
export interface StartSessionPayload {
    message: string;
}

/** Payload gửi tin nhắn */
export interface SendMessagePayload {
    message: string;
}

/** Chuyên khoa dùng cho system prompt */
export interface SpecialtyForPrompt {
    specialties_id: string;
    code: string;
    name: string;
    description: string | null;
}

/** Kết quả trả về khi bắt đầu phiên hoặc gửi tin nhắn */
export interface AiChatResponse {
    session: AiChatSession;
    ai_reply: string;
    analysis: AiAnalysisData | null;
    assistant_message_id: string;
}

/** Kết quả phiên chat kèm danh sách tin nhắn */
export interface AiChatSessionDetail {
    session: AiChatSession;
    messages: AiChatMessage[];
}

/**
 * Schema response từ Gemini Structured Output.
 * Gemini trả về 1 JSON object chứa cả text lẫn analysis.
 */
export interface GeminiStructuredResponse {
    text_reply: string;
    analysis: AiAnalysisData;
}

/** Thống kê token usage theo ngày + model */
export interface AiTokenUsageDaily {
    usage_date: string;
    model_used: string;
    total_messages: number;
    total_tokens: number;
    avg_response_ms: number;
}

/** Tổng hợp thống kê token usage */
export interface AiTokenUsageSummary {
    total_messages: number;
    total_tokens: number;
    avg_response_ms: number;
    total_sessions: number;
    feedback_stats: {
        good: number;
        bad: number;
        no_feedback: number;
    };
}
