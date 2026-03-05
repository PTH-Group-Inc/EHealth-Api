"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const auth_error_constant_1 = require("../constants/auth-error.constant");
const auth_security_util_1 = require("./auth-security.util");
class AuthValidation {
    /*
     * Xác thực thiết bị
     */
    static validateDevice(clientInfo) {
        if (!clientInfo.deviceId) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DEVICE;
        }
    }
    /*
     * Xác thực thông tin đăng nhập
     */
    static async validateCredential(user, password) {
        if (!user) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_CREDENTIAL;
        }
        const isPasswordValid = await auth_security_util_1.SecurityUtil.verifyPasswordSafe(password, user.password_hash);
        if (!isPasswordValid) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_CREDENTIAL;
        }
        if (user.status !== 'ACTIVE') {
            throw auth_error_constant_1.AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
        }
    }
    /*
     * Xác thực đầu vào đăng nhập
     */
    static validateLoginInput(identifier, password, type) {
        if (!identifier || !password) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_INPUT;
        }
        if (password.length < 6) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_PASSWORD_FORMAT;
        }
        if (type === 'EMAIL' && !this.isValidEmail(identifier)) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_EMAIL_FORMAT;
        }
        if (type === 'PHONE' && !this.isValidPhone(identifier)) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_PHONE_FORMAT;
        }
    }
    /**
     * Chỉ validate Email (Dùng cho Forgot Password)
     */
    static validateEmailOnly(email) {
        if (!email)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_INPUT;
        if (!this.isValidEmail(email))
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_EMAIL_FORMAT;
    }
    /**
     * Chỉ validate Password (Dùng cho Reset Password)
     */
    static validatePasswordOnly(password) {
        if (!password)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_INPUT;
        if (password.length < 6)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_PASSWORD_FORMAT;
    }
    /*
     * Kiểm tra định dạng email
     */
    static isValidEmail(email) {
        if (!email)
            return false;
        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        return emailRegex.test(normalizedEmail);
    }
    /*
     * Kiểm tra định dạng số điện thoại
     */
    static isValidPhone(phone) {
        if (!phone)
            return false;
        const normalizedPhone = phone
            .replace(/\s+/g, '')
            .replace(/[-()]/g, '');
        const vnPhoneRegex = /^(0\d{9}|(\+84)\d{9})$/;
        const internationalPhoneRegex = /^\+\d{10,15}$/;
        return (vnPhoneRegex.test(normalizedPhone) ||
            internationalPhoneRegex.test(normalizedPhone));
    }
    /**
     * Validate đăng ký bằng Email
     */
    static validateEmailRegister(email, password, name) {
        if (!email || !password || !name)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DATA;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DATA;
        if (password.length < 6)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DATA;
    }
    /**
     * Validate đăng ký bằng SĐT
     */
    static validatePhoneRegister(phone, password, name) {
        if (!phone || !password || !name)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DATA;
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(phone))
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DATA;
        if (password.length < 6)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_DATA;
    }
}
exports.AuthValidation = AuthValidation;
