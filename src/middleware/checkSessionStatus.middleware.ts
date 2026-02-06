import { Request, Response, NextFunction } from "express";
import { UserSessionRepository } from "../repository/auth_user-session.repository";
import { AUTH_ERRORS } from "../constants/auth-error.constant";

export const checkSessionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authPayload = (req as any).auth;

        if (!authPayload || !authPayload.sessionId) {
            return res.status(401).json({
                success: false,
                code: "AUTH_401",
                message: "Không tìm thấy thông tin phiên làm việc."
            });
        }

        const session = await UserSessionRepository.findActiveBySessionId(authPayload.sessionId);

        if (!session || session.account_id !== authPayload.account_id) {
            return res.status(401).json({
                success: false,
                code: "AUTH_SESSION_INVALID",
                message: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi."
            });
        }

        await UserSessionRepository.updateLastUsed(authPayload.sessionId);

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi kiểm tra trạng thái phiên làm việc."
        });
    }
};