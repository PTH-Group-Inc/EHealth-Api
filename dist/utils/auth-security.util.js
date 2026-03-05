"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtil = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const auth_token_constant_1 = require("../constants/auth_token.constant");
const token_util_1 = require("./token.util");
class SecurityUtil {
    /*
      * Tạo access token và refresh token
      */
    static generateToken(user, sessionId) {
        const { accessToken, refreshToken, expiresIn } = token_util_1.TokenUtil.generateAuthTokens(user, sessionId);
        const refreshTokenHash = SecurityUtil.hashRefreshToken(refreshToken);
        return {
            accessToken,
            refreshToken,
            refreshTokenHash,
            expiresIn,
        };
    }
    /**
     * Xác thực refresh token
     */
    static verifyRefreshToken(token) {
        return token_util_1.TokenUtil.verifyRefreshToken(token);
    }
    /**
     * Hash refresh token
     */
    static hashRefreshToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    /**
     * Hash password (bcrypt)
     */
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, 10);
    }
    /**
     * Verify password an toàn
     */
    static async verifyPasswordSafe(inputPassword, storedHash) {
        const DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO5Q7GkE1E7dBDEuDfSU/EYEYVplpXCMu';
        return bcrypt_1.default.compare(inputPassword, storedHash ?? DUMMY_HASH);
    }
    /**
     * Lấy thời điểm hết hạn của refresh token
     */
    static getRefreshTokenExpiredAt() {
        return new Date(Date.now() +
            auth_token_constant_1.TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN_SECONDS * 1000);
    }
    /**
     * Sinh token ngẫu nhiên dùng cho reset password
     */
    static generateRandomTokenResetPassword(length = 32) {
        return (0, crypto_1.randomBytes)(length).toString('hex');
    }
    /**
     * Hash token dùng cho reset password
     */
    static hashTokenResetPassword(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    /**
     * Tạo ID cho request reset password
     */
    static generateResetPasswordId(userId) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;
        // Tổng chiều dài sẽ là: 5(PRST_) + 6(Date) + 1(_) + len(userId) + 1(_) + 16(UUID)
        // Tổng chiều dài sẽ là: 5(PRST_) + 6(Date) + 1(_) + len(userId ~ 22) + 1(_) + 8(UUID) ~ 43 chars <= 50
        return `PRST_${datePart}_${userId}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
    }
    /**
     * Sinh ID cho bảng users tự động dựa trên Role
     */
    static async generateUsersId(role) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const rolePrefix = "USR";
        return `${rolePrefix}_${yy}${mm}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
    }
    /**
     * Tạo ID cho record Verification
     */
    static generateVerificationId(userId) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;
        return `VER_${datePart}_${userId}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
    }
    /**
     * Sinh mã OTP ngẫu nhiên (chỉ chứa số)
     */
    static generateOTP(length = 6) {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += (0, crypto_1.randomInt)(0, 10).toString();
        }
        return otp;
    }
    /**
     * Tạo ID cho record User Profile
     */
    static generateUserProfileId(userId) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;
        return `UPRF_${datePart}_${userId}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
    }
}
exports.SecurityUtil = SecurityUtil;
