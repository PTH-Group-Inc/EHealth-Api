"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const auth_user_session_repository_1 = require("../repository/auth_user-session.repository");
const auth_error_constant_1 = require("../constants/auth-error.constant");
class SessionService {
    /*
     * Lấy danh sách session còn hiệu lực của một tài khoản
     */
    static async getActiveSessions(userId, currentSessionId) {
        const sessions = await auth_user_session_repository_1.UserSessionRepository.findActiveByAccount(userId);
        return sessions.map(s => ({
            sessionId: s.user_sessions_id,
            device: s.device_name || 'Unknown Device',
            ip: s.ip_address,
            lastActiveAt: s.last_used_at,
            current: s.user_sessions_id === currentSessionId
        }));
    }
    /*
     * Đăng xuất khỏi một session cụ thể
     */
    static async logout(refreshTokenHash) {
        const session = await auth_user_session_repository_1.UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);
        if (!session)
            throw auth_error_constant_1.AUTH_ERRORS.SESSION_NOT_FOUND;
        const success = await auth_user_session_repository_1.UserSessionRepository.logoutCurrentSession(session.user_id, refreshTokenHash);
        if (!success)
            throw auth_error_constant_1.AUTH_ERRORS.SESSION_NOT_FOUND;
    }
    /*
     * Đăng xuất khỏi một session cụ thể theo userId và sessionId
     */
    static async revokeSession(userId, sessionId) {
        const success = await auth_user_session_repository_1.UserSessionRepository.revokeBySessionId(sessionId, userId);
        if (!success)
            throw auth_error_constant_1.AUTH_ERRORS.SESSION_NOT_FOUND;
    }
    /*
     * Đăng xuất khỏi tất cả session của một tài khoản
     */
    static async logoutAll(userId) {
        await auth_user_session_repository_1.UserSessionRepository.revokeAllByAccount(userId);
    }
}
exports.SessionService = SessionService;
