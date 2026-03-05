"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionUtil = void 0;
const crypto_1 = require("crypto");
const auth_user_session_repository_1 = require("../repository/auth_user-session.repository");
const auth_security_util_1 = require("./auth-security.util");
class AuthSessionUtil {
    /*
     * Tạo hoặc cập nhật user session
     */
    static async upsertSession(sessionId, userId, refreshTokenHash, clientInfo) {
        const expiredAt = auth_security_util_1.SecurityUtil.getRefreshTokenExpiredAt();
        // Nếu có deviceId thì tìm session cũ của device
        if (clientInfo.deviceId) {
            const existingSession = await auth_user_session_repository_1.UserSessionRepository.findByAccountAndDevice(userId, clientInfo.deviceId);
            if (existingSession) {
                await auth_user_session_repository_1.UserSessionRepository.updateSessionBySessionId(existingSession.user_sessions_id, {
                    refreshTokenHash,
                    ipAddress: clientInfo.ip,
                    userAgent: clientInfo.userAgent,
                    expiredAt,
                });
                return;
            }
        }
        // Tạo session mới
        await auth_user_session_repository_1.UserSessionRepository.createSession({
            user_sessions_id: sessionId,
            userId,
            refreshTokenHash,
            deviceId: clientInfo.deviceId,
            deviceName: clientInfo.deviceName,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            expiredAt,
        });
    }
    /*
     * Tạo session ID mới
    */
    static generate(userId) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;
        return `SES_${datePart}_${userId}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
    }
}
exports.AuthSessionUtil = AuthSessionUtil;
