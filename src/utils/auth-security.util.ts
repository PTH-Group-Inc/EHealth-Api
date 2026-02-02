// utils/security.util.ts
import bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';
import { TokenUtil } from './token.util';
import { Account, AccountRole } from '../models/auth_account.model';
import { pool } from '../config/postgresdb';
import { ROLE_CONFIG } from '../constants/role-config.constant';

export class SecurityUtil {
    /*
      * Tạo access token và refresh token
      */
    static generateToken(account: Account, sessionId: string) {
        const { accessToken, refreshToken, expiresIn } = TokenUtil.generateAuthTokens(account, sessionId);

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
    static verifyRefreshToken(token: string) {
        return TokenUtil.verifyRefreshToken(token);
    }

    /**
     * Hash refresh token
     */
    static hashRefreshToken(token: string): string {
        return createHash('sha256') .update(token) .digest('hex');
    }

    /**
     * Hash password (bcrypt)
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    /**
     * Verify password an toàn
     */
    static async verifyPasswordSafe(inputPassword: string, storedHash: string | null | undefined,): Promise<boolean> {
       
        const DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO5Q7GkE1E7dBDEuDfSU/EYEYVplpXCMu';

        return bcrypt.compare(inputPassword, storedHash ?? DUMMY_HASH);
    }

    /**
     * Lấy thời điểm hết hạn của refresh token
     */
    static getRefreshTokenExpiredAt(): Date {
        return new Date(
            Date.now() +
            TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN_SECONDS * 1000
        );
    }

    /**
     * Sinh token ngẫu nhiên dùng cho reset password
     */
    static generateRandomTokenResetPassword(length = 32): string {
        return randomBytes(length).toString('hex');
    }

    /**
     * Hash token dùng cho reset password
     */
    static hashTokenResetPassword(token: string): string {
        return createHash('sha256') .update(token) .digest('hex');
    }

    /**
     * Tạo ID cho request reset password
     */
    static generateResetPasswordId(accountId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `PRST_${datePart}_${accountId}_${randomUUID()}`;
    }

    /**
     * Sinh UserCode tự động dựa trên Role
     */
    static async generateUserCode(role: AccountRole): Promise<string> {
        const config = ROLE_CONFIG[role];
        
        if (!config) {
            throw new Error(`Không tìm thấy cấu hình sinh mã cho role: ${role}`);
        }

        const result = await pool.query(
            `SELECT nextval($1) as next_val`, 
            [config.sequence]
        );

        const nextVal = result.rows[0].next_val;

        const paddedNumber = nextVal.toString().padStart(5, '0');

        return `${config.prefix}${paddedNumber}`;
    }

    /**
     * Tạo ID cho record Verification
     */
    static generateVerificationId(accountId: string): string {

        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `VER_${datePart}_${accountId}_${randomUUID()}`;
    }

    /**
     * Sinh mã OTP ngẫu nhiên (chỉ chứa số)
     */
    static generateOTP(length: number = 6): string {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += randomInt(0, 10).toString(); // An toàn hơn Math.random()
        }
        return otp;
    }

}