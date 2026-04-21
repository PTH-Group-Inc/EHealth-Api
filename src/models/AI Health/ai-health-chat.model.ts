// ══════════════════════════════════════════════════════════════════════
// MODULE 7 — AI Health Agent Models (matches existing DB migrations)
// ══════════════════════════════════════════════════════════════════════

// ── Conversation state machine ────────────────────────────────────────

export interface ConversationState {
    phase: 'GREETING' | 'COLLECTING' | 'ANALYSIS' | 'BOOKING_SUGGEST' | 'DONE';
    locked_specialty_group: string | null;
    symptoms_collected: string[];
    symptoms_excluded: string[];
    questions_asked: number;
    discovery_complete: boolean;
    conversation_summary: string | null;
}

export const DEFAULT_CONVERSATION_STATE: ConversationState = {
    phase: 'GREETING',
    locked_specialty_group: null,
    symptoms_collected: [],
    symptoms_excluded: [],
    questions_asked: 0,
    discovery_complete: false,
    conversation_summary: null,
};

// ── Sessions ──────────────────────────────────────────────────────────

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
    conversation_state: ConversationState;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
}

// ── Messages ──────────────────────────────────────────────────────────

export interface AiChatMessage {
    message_id: string;
    session_id: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    model_used: string | null;
    tokens_used: number;
    response_time_ms: number;
    analysis_data: AiAnalysisData | null;
    user_feedback: 'GOOD' | 'BAD' | null;
    feedback_note: string | null;
    created_at: Date;
}

export interface AiAnalysisData {
    is_complete: boolean;
    follow_up_questions: string[];
    suggested_specialty_code: string | null;
    suggested_specialty_name: string | null;
    priority: 'NORMAL' | 'SOON' | 'URGENT' | null;
    symptoms_collected: string[];
    should_suggest_booking: boolean;
    conclusion: string | null;
}

// ── RAG Documents ─────────────────────────────────────────────────────

export interface AiDocument {
    document_id: string;
    file_name: string;
    file_type: string;
    uploaded_by: string | null;
    file_size_bytes: number | null;
    total_chunks: number;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
    document_category: string;
}

export interface AiDocumentChunk {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    metadata: { page_start?: number; page_end?: number; section?: string; source_type?: string };
    created_at: Date;
}

export interface RagSearchResult {
    chunk_id: string;
    document_id: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
    document_name: string;
}

// ── Inputs ────────────────────────────────────────────────────────────

export interface CreateSessionInput {
    message: string;
    user_id?: string;
    patient_id?: string;
}

export interface SendMessageInput {
    session_id: string;
    message: string;
    user_id?: string;
    patient_id?: string;
}

export interface SessionListFilters {
    user_id?: string;
    patient_id?: string;
    status?: string;
    page: number;
    limit: number;
}

export interface FeedbackInput {
    message_id: string;
    feedback: 'GOOD' | 'BAD';
    note?: string;
}

// ── API Responses ─────────────────────────────────────────────────────

export interface SessionMessageResponse {
    session: AiChatSession;
    ai_reply: string;
    analysis: AiAnalysisData | null;
    assistant_message_id: string;
}
