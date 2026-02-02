import { UserSessionRepository } from "../repository/auth_user-session.repository";
import { AUTH_ERRORS } from "../constants/auth-error.constant";

export class SessionService {
    /*
     * Lấy danh sách session còn hiệu lực của một tài khoản
     */
    static async getActiveSessions(accountId: string, currentSessionId?: string) {
        const sessions = await UserSessionRepository.findActiveByAccount(accountId);

        return sessions.map(s => ({
            sessionId: s.sessionId,
            device: s.device_name || 'Unknown Device',
            ip: s.ip_address,
            lastActiveAt: s.last_used_at,
            current: s.sessionId === currentSessionId
        }));
    }

    /*
     * Đăng xuất khỏi một session cụ thể
     */
    static async logout(refreshTokenHash: string) {
        const session = await UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);
       
        if (!session) throw AUTH_ERRORS.SESSION_NOT_FOUND;

        const success = await UserSessionRepository.logoutCurrentSession(session.account_id, refreshTokenHash);
        
        if (!success) throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    /*
     * Đăng xuất khỏi một session cụ thể theo accountId và sessionId
     */
    static async revokeSession(accountId: string, sessionId: string) {
        const success = await UserSessionRepository.revokeBySessionId(sessionId, accountId);
        if (!success) throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    /*
     * Đăng xuất khỏi tất cả session của một tài khoản
     */
    static async logoutAll(accountId: string) {
        await UserSessionRepository.revokeAllByAccount(accountId);
    }
}