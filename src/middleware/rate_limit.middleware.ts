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

/** Global API rate limit */
export const globalApiRateLimiter = rateLimit({
    windowMs: AUTH_CONSTANTS.RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: AUTH_CONSTANTS.RATE_LIMIT.GLOBAL.MAX_REQUESTS,
    message: { success: false, error_code: 'RATE_LIMIT_EXCEEDED', message: 'API rate limit exceeded, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});