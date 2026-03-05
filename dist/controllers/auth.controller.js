"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    /**
     * Đăng nhập bằng Email + mật khẩu
     */
    static async loginByEmail(req, res) {
        try {
            const { email, password, clientInfo } = req.body;
            const data = await auth_service_1.AuthService.loginByEmail(email, password, {
                deviceId: clientInfo?.deviceId,
                deviceName: clientInfo?.deviceName,
                ip: req.ip,
                userAgent: req.headers["user-agent"] ?? clientInfo?.userAgent ?? "",
            });
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
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
    static async loginByPhone(req, res) {
        try {
            const { phone, password, clientInfo } = req.body;
            const data = await auth_service_1.AuthService.loginByPhone(phone, password, {
                deviceId: clientInfo?.deviceId,
                deviceName: clientInfo?.deviceName,
                ip: req.ip,
                userAgent: req.headers["user-agent"] ?? clientInfo?.userAgent ?? "",
            });
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
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
    static async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Refresh Token",
                });
            }
            await auth_service_1.AuthService.logout({ refreshToken });
            return res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công',
            });
        }
        catch (error) {
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
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            // Luôn trả về 200 dù email có tồn tại hay không (theo Docs)
            await auth_service_1.AuthService.forgotPassword({ email });
            return res.status(200).json({
                success: true,
                message: "Nếu tài khoản tồn tại, một liên kết đặt lại mật khẩu đã được gửi",
            });
        }
        catch (error) {
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
    static async resetPassword(req, res) {
        try {
            const { otp, newPassword } = req.body;
            if (!otp || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp mã OTP và mật khẩu mới",
                });
            }
            await auth_service_1.AuthService.resetPassword({ otp, newPassword });
            return res.status(200).json({
                success: true,
                message: "Mật khẩu đã được đặt lại thành công",
            });
        }
        catch (error) {
            // Mapping lỗi từ Service ra HTTP code tương ứng
            const httpCode = error.httpCode || 500;
            return res.status(httpCode).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }
    /**
     * Đăng ký bằng Email
     */
    static async registerByEmail(req, res) {
        try {
            const { email, password, name } = req.body;
            const data = await auth_service_1.AuthService.registerByEmail({ email, password, name });
            return res.status(201).json({
                success: true,
                message: "Register successfully",
                data,
            });
        }
        catch (error) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "AUTH_999",
                message: error.message || "Lỗi máy chủ nội bộ",
            });
        }
    }
    /**
     * Đăng ký bằng SĐT
     */
    static async registerByPhone(req, res) {
        try {
            const { phone, password, name } = req.body;
            const data = await auth_service_1.AuthService.registerByPhone({ phone, password, name });
            return res.status(201).json({
                success: true,
                message: "Register successfully",
                data,
            });
        }
        catch (error) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "AUTH_999",
                message: error.message || "Lỗi máy chủ nội bộ",
            });
        }
    }
    /**
     * Xác thực OTP Email
     */
    static async verifyEmail(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Email và mã OTP",
                });
            }
            // Gọi AuthService dùng property otp: code
            await auth_service_1.AuthService.verifyEmailOTP({ email, otp: code });
            return res.status(200).json({
                success: true,
                message: "Xác thực tài khoản thành công!",
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                code: error.code || "AUTH_VERIFY_FAILED",
                message: error.message || "Xác thực thất bại",
            });
        }
    }
    /**
     * Mở khóa tài khoản (Thường dành cho Admin)
     */
    static async unlockAccount(req, res) {
        try {
            const { accountId } = req.body; // Lấy ID tài khoản cần mở khóa
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp accountId",
                });
            }
            await auth_service_1.AuthService.unlockAccount({ accountId });
            return res.status(200).json({
                success: true,
                message: "Đã mở khóa tài khoản thành công",
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                code: "AUTH_UNLOCK_FAILED",
                message: error.message || "Lỗi mở khóa tài khoản",
            });
        }
    }
    /*
     * Làm mới Token (Refresh Token)
     */
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Refresh Token",
                });
            }
            const data = await auth_service_1.AuthService.refreshToken({ refreshToken });
            return res.status(200).json({
                success: true,
                message: "Làm mới token thành công",
                data,
            });
        }
        catch (error) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }
}
exports.AuthController = AuthController;
