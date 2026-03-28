import rateLimit from 'express-rate-limit';
import { AI_CHAT_RATE_LIMIT } from '../constants/ai-health-chat.constant';

/**
 * Tạo phiên mới — nghiêm ngặt nhất (5 req/phút/IP).
 */
export const aiSessionCreateLimiter = rateLimit({
    windowMs: AI_CHAT_RATE_LIMIT.SESSION_CREATE.WINDOW_MS,
    max: AI_CHAT_RATE_LIMIT.SESSION_CREATE.MAX_REQUESTS,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Bạn đang tạo phiên tư vấn quá nhanh. Vui lòng đợi 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {

        return (req as any).auth?.user_id || req.ip || 'unknown';
    },
    validate: false,
});

/**
 * Gửi tin nhắn (JSON + SSE) — mức trung bình (15 req/phút/IP).
 */
export const aiMessageSendLimiter = rateLimit({
    windowMs: AI_CHAT_RATE_LIMIT.MESSAGE_SEND.WINDOW_MS,
    max: AI_CHAT_RATE_LIMIT.MESSAGE_SEND.MAX_REQUESTS,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req as any).auth?.user_id || req.ip || 'unknown';
    },
    validate: false,
});

/**
 * Đọc dữ liệu (list sessions, history, complete) — nhẹ nhất (30 req/phút/IP).
 */
export const aiReadLimiter = rateLimit({
    windowMs: AI_CHAT_RATE_LIMIT.READ_OPERATIONS.WINDOW_MS,
    max: AI_CHAT_RATE_LIMIT.READ_OPERATIONS.MAX_REQUESTS,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req as any).auth?.user_id || req.ip || 'unknown';
    },
    validate: false,
});
