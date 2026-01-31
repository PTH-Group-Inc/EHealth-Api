import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    /**
     * Đăng nhập bằng Email + mật khẩu
     */
    static async loginByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;

            const data = await AuthService.loginByEmail(
                email,
                password,
                {
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] ?? "",
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
            const { phone, password } = req.body;

            const data = await AuthService.loginByPhone(
                phone,
                password,
                {
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] ?? "",
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