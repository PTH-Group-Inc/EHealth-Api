export const AI_SESSION_STATUS = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED',
} as const;

export const AI_MESSAGE_ROLE = {
    USER: 'USER',
    ASSISTANT: 'ASSISTANT',
    SYSTEM: 'SYSTEM',
} as const;

export const AI_PRIORITY = {
    NORMAL: 'NORMAL',
    SOON: 'SOON',
    URGENT: 'URGENT',
} as const;

export const AI_PHASE = {
    GREETING: 'GREETING',
    COLLECTING: 'COLLECTING',
    ANALYSIS: 'ANALYSIS',
    BOOKING_SUGGEST: 'BOOKING_SUGGEST',
    DONE: 'DONE',
} as const;

export const AI_ERRORS = {
    SESSION_NOT_FOUND:  { code: 'AI_001', message: 'Không tìm thấy phiên tư vấn.' },
    SESSION_EXPIRED:    { code: 'AI_002', message: 'Phiên tư vấn đã hết hạn hoặc đã hoàn thành.' },
    MESSAGE_EMPTY:      { code: 'AI_003', message: 'Tin nhắn không được để trống.' },
    CLAUDE_ERROR:       { code: 'AI_004', message: 'Dịch vụ AI tạm thời không khả dụng.' },
    SESSION_LIMIT:      { code: 'AI_005', message: 'Đã đạt giới hạn tin nhắn trong phiên.' },
    PATIENT_REQUIRED:   { code: 'AI_006', message: 'Cần đăng nhập với tài khoản bệnh nhân để tiếp tục.' },
    BOOKING_FAILED:     { code: 'AI_007', message: 'Không thể đặt lịch. Vui lòng thử lại.' },
} as const;

export const AI_CONFIG = {
    MAX_MESSAGES_PER_SESSION: 30,
    MODEL: 'claude-sonnet-4-6',
    MAX_TOKENS: 1500,
    MAX_TOOL_ITERATIONS: 6,
    SESSION_EXPIRY_HOURS: 24,
    RAG_TOP_K: 5,
    RAG_SIMILARITY_THRESHOLD: 0.72,
    DISCLAIMER_VI: '⚕️ Lưu ý: Thông tin này chỉ mang tính tham khảo ban đầu, không thay thế chẩn đoán của bác sĩ.',
} as const;

export const RAG_CONFIG = {
    CHUNK_SIZE_CHARS: 800,
    CHUNK_OVERLAP_CHARS: 100,
    EMBEDDING_MODEL: 'text-embedding-3-small',
    EMBEDDING_DIM: 1536,
    BATCH_SIZE: 50,
    TOP_K: 5,
    CATEGORIES: ['GENERAL', 'PRICING', 'SCHEDULE', 'POLICY', 'MEDICAL_INFO', 'FAQ'] as const,
} as const;

export const AI_SUCCESS = {
    SESSION_CREATED: 'Tạo phiên tư vấn thành công.',
    SESSION_COMPLETED: 'Kết thúc phiên tư vấn thành công.',
    SESSION_DELETED: 'Xóa phiên tư vấn thành công.',
    MESSAGE_SENT: 'Gửi tin nhắn thành công.',
    FEEDBACK_SUBMITTED: 'Gửi đánh giá thành công.',
    DOC_UPLOADED: 'Tải tài liệu thành công.',
    DOC_DELETED: 'Xóa tài liệu thành công.',
} as const;
