import rateLimit from 'express-rate-limit';
import { AUTH_CONSTANTS } from '../constants/auth.constant';

/**
 * Khóa IP nếu gọi API Liên kết quá 5 lần trong 15 phút
 */
export const linkPatientRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error_code: 'TOO_MANY_REQUESTS',
        message: 'Bạn đã thử liên kết quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true, 
    legacyHeaders: false,
});

/** Chống brute-force login */
export const loginRateLimiter = rateLimit({
    windowMs: AUTH_CONSTANTS.RATE_LIMIT.LOGIN.WINDOW_MS,
    max: AUTH_CONSTANTS.RATE_LIMIT.LOGIN.MAX_REQUESTS,
    message: { success: false, error_code: 'TOO_MANY_LOGIN_ATTEMPTS', message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Chống spam register/forgot-password */
export const authSensitiveRateLimiter = rateLimit({
    windowMs: AUTH_CONSTANTS.RATE_LIMIT.SENSITIVE.WINDOW_MS,
    max: AUTH_CONSTANTS.RATE_LIMIT.SENSITIVE.MAX_REQUESTS,
    message: { success: false, error_code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter riêng cho các endpoint polling (payment-status, v.v.)
 * Tách riêng để không chiếm budget global.
 */
export const pollingRateLimiter = rateLimit({
    windowMs: AUTH_CONSTANTS.RATE_LIMIT.POLLING.WINDOW_MS,
    max: AUTH_CONSTANTS.RATE_LIMIT.POLLING.MAX_REQUESTS,
    message: { success: false, error_code: 'POLLING_RATE_LIMIT', message: 'Polling too frequently, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Global API rate limit */
export const globalApiRateLimiter = rateLimit({
    windowMs: AUTH_CONSTANTS.RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: AUTH_CONSTANTS.RATE_LIMIT.GLOBAL.MAX_REQUESTS,
    message: { success: false, error_code: 'RATE_LIMIT_EXCEEDED', message: 'API rate limit exceeded, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip các auth routes đã có rate limiter riêng → tránh double counting
    // Skip polling routes (payment-status) → có rate limiter riêng
    skip: (req) => {
        const skipPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/resend-verify'];
        if (skipPaths.some(p => req.path.startsWith(p))) return true;
        // Skip polling endpoints — đã có pollingRateLimiter riêng
        if (/\/appointments\/[^/]+\/payment-status/.test(req.path)) return true;
        return false;
    },
});