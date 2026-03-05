"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSessionStatus = void 0;
const auth_user_session_repository_1 = require("../repository/auth_user-session.repository");
const checkSessionStatus = async (req, res, next) => {
    try {
        const authPayload = req.auth;
        if (!authPayload || !authPayload.sessionId) {
            return res.status(401).json({
                success: false,
                code: "AUTH_401",
                message: "Không tìm thấy thông tin phiên làm việc."
            });
        }
        // Kiểm tra xem session có tồn tại không
        const session = await auth_user_session_repository_1.UserSessionRepository.findActiveBySessionId(authPayload.sessionId);
        // check 
        if (!session || session.user_id !== authPayload.user_id) {
            return res.status(401).json({
                success: false,
                code: "AUTH_SESSION_INVALID",
                message: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi."
            });
        }
        await auth_user_session_repository_1.UserSessionRepository.updateLastUsed(authPayload.sessionId);
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi kiểm tra trạng thái phiên làm việc."
        });
    }
};
exports.checkSessionStatus = checkSessionStatus;
