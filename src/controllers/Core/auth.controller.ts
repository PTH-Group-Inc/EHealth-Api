import { Request, Response, NextFunction } from "express";
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AuthService } from "../../services/Core/auth.service";
import { AUTH_ERRORS } from "../../constants/auth-error.constant";

export class AuthController {
    /**
     * Đăng nhập bằng Email + mật khẩu
     */
    static loginByEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
    });

    /**
     * Đăng nhập bằng SĐT + mật khẩu
     */
    static loginByPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
    });

    /**
    * Đăng xuất session hiện tại
    */
    static logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Refresh Token",
                });
            }

            await AuthService.logout({ refreshToken });

            return res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công',
            });
    });

    /**
     * Yêu cầu quên mật khẩu
     */
    static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { email } = req.body;

            // Luôn trả về 200 dù email có tồn tại hay không (theo Docs)
            await AuthService.forgotPassword({ email });

            return res.status(200).json({
                success: true,
                message: "Nếu tài khoản tồn tại, một liên kết đặt lại mật khẩu đã được gửi",
            });
    });



    /**
     * Đặt lại mật khẩu
     */
    static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { otp, newPassword } = req.body;

            if (!otp || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp mã OTP và mật khẩu mới",
                });
            }

            await AuthService.resetPassword({ otp, newPassword });

            return res.status(200).json({
                success: true,
                message: "Mật khẩu đã được đặt lại thành công",
            });
    });



    /**
     * Đăng ký bằng Email
     */
    static registerByEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { email, password, name } = req.body;

            const data = await AuthService.registerByEmail({ email, password, name });

            return res.status(201).json({
                success: true,
                message: "Register successfully",
                data,
            });
    });

    /**
     * Đăng ký bằng SĐT
     */
    static registerByPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { phone, password, name } = req.body;

            const data = await AuthService.registerByPhone({ phone, password, name });

            return res.status(201).json({
                success: true,
                message: "Register successfully",
                data,
            });
    });

    /**
     * Gửi lại mã OTP xác thực Email
     */
    static resendVerifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Email",
                });
            }

            await AuthService.resendVerifyEmailOTP(email);

            return res.status(200).json({
                success: true,
                message: "Mã OTP mới đã được gửi đến email của bạn",
            });
    });

    /**
     * Xác thực OTP Email
     */
    static verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Email và mã OTP",
                });
            }

            // Gọi AuthService dùng property otp: code
            await AuthService.verifyEmailOTP({ email, otp: code });

            return res.status(200).json({
                success: true,
                message: "Xác thực tài khoản thành công!",
            });

    });


    /**
     * Mở khóa tài khoản (Thường dành cho Admin)
     */
    static unlockAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { accountId } = req.body; // Lấy ID tài khoản cần mở khóa

            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp accountId",
                });
            }

            await AuthService.unlockAccount({ accountId });

            return res.status(200).json({
                success: true,
                message: "Đã mở khóa tài khoản thành công",
            });
    });

    /*
     * Làm mới Token (Refresh Token)
     */
    static refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Refresh Token",
                });
            }

            const data = await AuthService.refreshToken({ refreshToken });

            return res.status(200).json({
                success: true,
                message: "Làm mới token thành công",
                data,
            });
    });

}