import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AUTH_ERRORS } from "../constants/auth-error.constant";

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
                    ip: req.ip,
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
                    ip: req.ip, 
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
    * Đăng xuất session hiện tại
    */
    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            const { refreshToken } = req.body;

            // authPayload được gắn từ middleware verifyAccessToken
            const authPayload = (req as any).auth;

            const result = await AuthService.logout(
                { refreshToken },
                authPayload
            );

            return res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công',
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }

    /**
     * Yêu cầu quên mật khẩu
     */
    static async forgotPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;
            
            // Luôn trả về 200 dù email có tồn tại hay không (theo Docs)
            await AuthService.forgotPassword({ email });

            return res.status(200).json({
                success: true,
                message: "Nếu tài khoản tồn tại, một liên kết đặt lại mật khẩu đã được gửi",
            });
        } catch (error: any) {
            // Log lỗi hệ thống nếu có, nhưng vẫn trả về thông báo chung hoặc lỗi server
             return res.status(500).json({
                success: false,
                code: 'AUTH_999',
                message: 'Lỗi máy chủ nội bộ',
            });
        }
    }



    /**
     * Đặt lại mật khẩu
     */
    static async resetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { resetToken, newPassword } = req.body;

            await AuthService.resetPassword({ resetToken, newPassword });

            return res.status(200).json({
                success: true,
                message: "Mật khẩu đã được đặt lại thành công",
            });
        } catch (error: any) {
            // Mapping lỗi từ Service ra HTTP code tương ứng
            const httpCode = error.httpCode || 500;
            return res.status(httpCode).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }
}