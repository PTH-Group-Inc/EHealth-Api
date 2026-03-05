"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_account_repository_1 = require("../repository/auth_account.repository");
const auth_validation_util_1 = require("../utils/auth-validation.util");
const auth_session_util_1 = require("../utils/auth-session.util");
const auth_security_util_1 = require("../utils/auth-security.util");
const auth_user_session_repository_1 = require("../repository/auth_user-session.repository");
const auth_error_constant_1 = require("../constants/auth-error.constant");
const auth_password_reset_repository_1 = require("../repository/auth_password-reset.repository");
const auth_mail_util_1 = require("../utils/auth-mail.util");
const auth_verification_repository_1 = require("../repository/auth_verification.repository");
const auth_constant_1 = require("../constants/auth.constant");
class AuthService {
    /**
     * Đăng nhập bằng Email
     */
    static async loginByEmail(email, password, clientInfo) {
        auth_validation_util_1.AuthValidation.validateLoginInput(email, password, "EMAIL");
        const user = await auth_account_repository_1.AccountRepository.findByEmail(email);
        if (!user)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_CREDENTIAL;
        await this.handleLoginAttempt(user, password);
        return this.processLoginSuccess(user, clientInfo);
    }
    /**
     * Đăng nhập bằng SĐT
     */
    static async loginByPhone(phone, password, clientInfo) {
        auth_validation_util_1.AuthValidation.validateLoginInput(phone, password, "PHONE");
        const user = await auth_account_repository_1.AccountRepository.findByPhone(phone);
        if (!user) {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_CREDENTIAL;
        }
        await this.handleLoginAttempt(user, password);
        return this.processLoginSuccess(user, clientInfo);
    }
    /**
     * Xử lý kiểm tra khóa và xác thực mật khẩu
     */
    static async handleLoginAttempt(user, passwordInput) {
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
            throw auth_error_constant_1.AUTH_ERRORS.ACCOUNT_LOCKED;
        }
        const isPasswordValid = await auth_security_util_1.SecurityUtil.verifyPasswordSafe(passwordInput, user.password_hash);
        if (!isPasswordValid) {
            const newFailedCount = await auth_account_repository_1.AccountRepository.incrementFailedLogin(user.users_id);
            if (newFailedCount >= auth_constant_1.AUTH_CONSTANTS.LOGIN_LIMIT.MAX_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + auth_constant_1.AUTH_CONSTANTS.LOGIN_LIMIT.LOCK_DURATION_MS);
                await auth_account_repository_1.AccountRepository.lockAccount(user.users_id, lockUntil);
            }
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_CREDENTIAL;
        }
        if (user.failed_login_count > 0 || user.locked_until) {
            await auth_account_repository_1.AccountRepository.resetFailedLogin(user.users_id);
        }
        if (user.status !== 'ACTIVE') {
            throw auth_error_constant_1.AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
        }
    }
    /**
     * Xử lý khi đăng nhập thành công
     */
    static async processLoginSuccess(user, clientInfo) {
        let sessionId;
        // Nếu client gửi device info thì check xem có session cũ của device không
        if (clientInfo.deviceId) {
            const existingSession = await auth_user_session_repository_1.UserSessionRepository.findByAccountAndDevice(user.users_id, clientInfo.deviceId);
            // Nếu có session cũ thì dùng lại, không có thì tạo mới
            sessionId = existingSession
                ? existingSession.user_sessions_id
                : auth_session_util_1.AuthSessionUtil.generate(user.users_id);
        }
        else {
            sessionId = auth_session_util_1.AuthSessionUtil.generate(user.users_id);
        }
        const { accessToken, refreshToken, refreshTokenHash, expiresIn } = auth_security_util_1.SecurityUtil.generateToken(user, sessionId);
        await auth_session_util_1.AuthSessionUtil.upsertSession(sessionId, user.users_id, refreshTokenHash, clientInfo);
        await auth_account_repository_1.AccountRepository.updateLastLogin(user.users_id);
        const profile = await auth_account_repository_1.AccountRepository.findProfileById(user.users_id);
        return {
            accessToken,
            refreshToken,
            expiresIn,
            user: {
                userId: user.users_id,
                name: profile?.full_name || "",
                avatar: profile?.avatar_url || null,
                email: user.email,
                phone: user.phone,
                roles: user.roles,
            },
        };
    }
    /**
     * Mở khóa tài khoản thủ công
     */
    static async unlockAccount(input) {
        await auth_account_repository_1.AccountRepository.unlockAccount(input.accountId);
    }
    /**
     * Đăng xuất
     */
    static async logout(input) {
        try {
            auth_security_util_1.SecurityUtil.verifyRefreshToken(input.refreshToken);
        }
        catch {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_REFRESH_TOKEN;
        }
        const refreshTokenHash = auth_security_util_1.SecurityUtil.hashRefreshToken(input.refreshToken);
        const session = await auth_user_session_repository_1.UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);
        if (!session) {
            throw auth_error_constant_1.AUTH_ERRORS.SESSION_NOT_FOUND;
        }
        await auth_user_session_repository_1.UserSessionRepository.logoutCurrentSession(session.user_id, refreshTokenHash);
    }
    /**
     * Quên mật khẩu – gửi OTP
     */
    static async forgotPassword(input) {
        try {
            auth_validation_util_1.AuthValidation.validateEmailOnly(input.email);
            const user = await auth_account_repository_1.AccountRepository.findByEmail(input.email);
            if (!user || user.status !== "ACTIVE")
                return;
            if (!user.email)
                return;
            const resetId = auth_security_util_1.SecurityUtil.generateResetPasswordId(user.users_id);
            const resetToken = auth_security_util_1.SecurityUtil.generateOTP(6);
            const resetTokenHash = auth_security_util_1.SecurityUtil.hashTokenResetPassword(resetToken);
            const expiredAt = new Date(Date.now() + auth_constant_1.AUTH_CONSTANTS.RESET_PASSWORD.EXPIRES_IN_MS);
            await auth_password_reset_repository_1.PasswordResetRepository.createResetToken(resetId, user.users_id, resetTokenHash, expiredAt);
            await auth_mail_util_1.AuthMailUtil.sendResetPasswordOtpEmail(user.email, resetToken);
        }
        catch (error) {
            console.error("Lỗi quên mật khẩu:", error);
        }
    }
    /**
     * Đặt lại mật khẩu
     */
    static async resetPassword(input) {
        const { otp, newPassword } = input;
        auth_validation_util_1.AuthValidation.validatePasswordOnly(newPassword);
        const resetTokenHash = auth_security_util_1.SecurityUtil.hashTokenResetPassword(otp);
        const resetRecord = await auth_password_reset_repository_1.PasswordResetRepository.findValidToken(resetTokenHash);
        if (!resetRecord)
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_RESET_TOKEN;
        const hashedPassword = await auth_security_util_1.SecurityUtil.hashPassword(newPassword);
        await auth_account_repository_1.AccountRepository.updatePassword(resetRecord.userId, hashedPassword);
        await auth_password_reset_repository_1.PasswordResetRepository.markAsUsed(resetRecord.password_resets_id);
        await auth_user_session_repository_1.UserSessionRepository.revokeAllByAccount(resetRecord.userId);
    }
    /**
     * Đăng ký bằng Email
     */
    static async registerByEmail(input) {
        auth_validation_util_1.AuthValidation.validateEmailRegister(input.email, input.password, input.name);
        const existAccount = await auth_account_repository_1.AccountRepository.findByEmail(input.email);
        if (existAccount)
            throw auth_error_constant_1.AUTH_ERRORS.EMAIL_EXISTED;
        const result = await this.processRegister({
            name: input.name,
            password: input.password,
            email: input.email,
            phone: null,
            status: auth_constant_1.AUTH_CONSTANTS.ACCOUNT_STATUS.PENDING,
        });
        try {
            const { userCode } = result;
            await auth_verification_repository_1.AccountVerificationRepository.invalidateOldTokens(userCode);
            const otpCode = auth_security_util_1.SecurityUtil.generateOTP(6);
            const otpHash = auth_security_util_1.SecurityUtil.hashTokenResetPassword(otpCode);
            const verifyId = auth_security_util_1.SecurityUtil.generateVerificationId(userCode);
            const expiredAt = new Date(Date.now() + auth_constant_1.AUTH_CONSTANTS.VERIFY_EMAIL.EXPIRES_IN_MS);
            await auth_verification_repository_1.AccountVerificationRepository.createVerificationToken(verifyId, userCode, otpHash, expiredAt);
            await auth_mail_util_1.AuthMailUtil.sendOtpEmail(input.email, otpCode);
        }
        catch (error) {
            console.error("⚠️ Lỗi gửi OTP:", error);
        }
        return result;
    }
    /**
     * Đăng ký bằng SĐT
     */
    static async registerByPhone(input) {
        auth_validation_util_1.AuthValidation.validatePhoneRegister(input.phone, input.password, input.name);
        const existAccount = await auth_account_repository_1.AccountRepository.findByPhone(input.phone);
        if (existAccount)
            throw auth_error_constant_1.AUTH_ERRORS.PHONE_EXISTED;
        const result = await this.processRegister({
            name: input.name,
            password: input.password,
            email: null,
            phone: input.phone,
            status: auth_constant_1.AUTH_CONSTANTS.ACCOUNT_STATUS.ACTIVE,
        });
        return result;
    }
    /*
     * Xử lý đăng ký chung
     */
    static async processRegister(payload) {
        const hashedPassword = await auth_security_util_1.SecurityUtil.hashPassword(payload.password);
        const userCode = await auth_security_util_1.SecurityUtil.generateUsersId("CUSTOMER");
        const newUser = {
            users_id: userCode,
            email: payload.email,
            phone: payload.phone,
            password_hash: hashedPassword,
            roles: ["CUSTOMER"],
            status: payload.status,
            last_login_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            failed_login_count: 0,
            locked_until: null
        };
        const userProfileId = auth_security_util_1.SecurityUtil.generateUserProfileId(userCode);
        await auth_account_repository_1.AccountRepository.createAccountWithProfileAndRole(newUser, userProfileId, payload.name, "CUSTOMER");
        return {
            userCode: newUser.users_id,
            email: newUser.email,
            phone: newUser.phone,
            status: newUser.status,
        };
    }
    /**
     * Xác thực Email từ Token
     */
    static async verifyEmail(token) {
        const tokenHash = auth_security_util_1.SecurityUtil.hashTokenResetPassword(token);
        const verificationRecord = await auth_verification_repository_1.AccountVerificationRepository.findValidToken(tokenHash);
        if (!verificationRecord)
            throw new Error("Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.");
        await auth_account_repository_1.AccountRepository.activateAccount(verificationRecord.userId);
        await auth_verification_repository_1.AccountVerificationRepository.markAsUsed(verificationRecord.account_verifications_id);
    }
    /**
     * Xác thực Email bằng OTP
     */
    static async verifyEmailOTP(input) {
        const { email, otp } = input;
        const user = await auth_account_repository_1.AccountRepository.findByEmail(email);
        if (!user) {
            throw new Error("Email không tồn tại.");
        }
        const otpHash = auth_security_util_1.SecurityUtil.hashTokenResetPassword(otp);
        const verificationRecord = await auth_verification_repository_1.AccountVerificationRepository.findValidOTP(user.users_id, otpHash);
        if (!verificationRecord)
            throw new Error("Mã xác thực không hợp lệ hoặc đã hết hạn.");
        await auth_account_repository_1.AccountRepository.activateAccount(verificationRecord.userId);
        await auth_verification_repository_1.AccountVerificationRepository.markAsUsed(verificationRecord.account_verifications_id);
    }
    /**
     * Làm mới Access Token & Refresh Token
     */
    static async refreshToken(input) {
        try {
            auth_security_util_1.SecurityUtil.verifyRefreshToken(input.refreshToken);
        }
        catch {
            throw auth_error_constant_1.AUTH_ERRORS.INVALID_REFRESH_TOKEN;
        }
        const refreshTokenHash = auth_security_util_1.SecurityUtil.hashRefreshToken(input.refreshToken);
        const session = await auth_user_session_repository_1.UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);
        if (!session) {
            throw auth_error_constant_1.AUTH_ERRORS.SESSION_EXPIRED;
        }
        const now = new Date().getTime();
        const lastUsed = new Date(session.last_used_at).getTime();
        const idleTime = now - lastUsed;
        if (idleTime > auth_constant_1.AUTH_CONSTANTS.SESSION.IDLE_TIMEOUT_MS) {
            await auth_user_session_repository_1.UserSessionRepository.revokeBySessionId(session.user_sessions_id, session.user_id);
            throw auth_error_constant_1.AUTH_ERRORS.SESSION_EXPIRED;
        }
        const user = await auth_account_repository_1.AccountRepository.findById(session.user_id);
        if (!user || user.status !== 'ACTIVE') {
            throw auth_error_constant_1.AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
        }
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = auth_security_util_1.SecurityUtil.generateToken(user, session.user_sessions_id);
        await auth_user_session_repository_1.UserSessionRepository.updateSessionBySessionId(session.user_sessions_id, {
            refreshTokenHash: auth_security_util_1.SecurityUtil.hashRefreshToken(newRefreshToken),
            expiredAt: auth_security_util_1.SecurityUtil.getRefreshTokenExpiredAt(),
        });
        return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn
        };
    }
}
exports.AuthService = AuthService;
