import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    /**
     * Đăng nhập bằng Email + mật khẩu
     */
    static async loginByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password, clientInfo } = req.body;

            const data = await AuthService.loginByEmail(
                email,
                password,
                {
                    deviceId: clientInfo?.deviceId,
                    deviceName: clientInfo?.deviceName,
                    ip: req.ip, // server tự set
                    userAgent: req.headers["user-agent"] ?? clientInfo?.userAgent ?? "",
                }
            );

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "INTERNAL_ERROR",
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * Đăng nhập bằng SĐT + mật khẩu
     */
    static async loginByPhone(req: Request, res: Response): Promise<Response> {
        try {
            const { phone, password, clientInfo } = req.body;

            const data = await AuthService.loginByPhone(
                phone,
                password,
                {
                    deviceId: clientInfo?.deviceId,
                    deviceName: clientInfo?.deviceName,
                    ip: req.ip, // server tự set
                    userAgent: req.headers["user-agent"] ?? clientInfo?.userAgent ?? "",
                }
            );

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "INTERNAL_ERROR",
                message: error.message || "Internal Server Error",
            });
        }
    }
}