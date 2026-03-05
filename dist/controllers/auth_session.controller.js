"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const auth_session_service_1 = require("../services/auth_session.service");
const auth_security_util_1 = require("../utils/auth-security.util");
class SessionController {
    /**
     * Lấy danh sách session còn hiệu lực của tài khoản
     */
    static async getSessions(req, res) {
        try {
            const { user_id } = req.auth;
            const currentSessionId = req.auth.sessionId;
            const sessions = await auth_session_service_1.SessionService.getActiveSessions(user_id, currentSessionId);
            return res.status(200).json({
                success: true,
                sessions
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Đăng xuất khỏi session hiện tại
     */
    static async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            // Bổ sung validate input
            if (!refreshToken) {
                return res.status(400).json({ success: false, message: "Refresh token is required" });
            }
            const refreshTokenHash = auth_security_util_1.SecurityUtil.hashRefreshToken(refreshToken);
            await auth_session_service_1.SessionService.logout(refreshTokenHash);
            return res.status(200).json({ success: true, message: "Logged out" });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * Đăng xuất khỏi một session cụ thể
     */
    static async logoutSession(req, res) {
        try {
            const { user_id } = req.auth;
            // FIX LỖI TẠI ĐÂY: Ép kiểu as string
            const sessionId = req.params.sessionId;
            await auth_session_service_1.SessionService.revokeSession(user_id, sessionId);
            return res.status(200).json({
                success: true,
                message: "Session revoked successfully"
            });
        }
        catch (error) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code,
                message: error.message
            });
        }
    }
    /**
     * đăng xuất tất cả session
     */
    static async logoutAll(req, res) {
        try {
            const { user_id } = req.auth;
            await auth_session_service_1.SessionService.logoutAll(user_id);
            return res.status(200).json({
                success: true,
                message: "All sessions revoked"
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.SessionController = SessionController;
