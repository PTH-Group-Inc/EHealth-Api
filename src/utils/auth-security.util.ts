// utils/security.util.ts
import bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';
import { TokenUtil } from './token.util';
import { Account } from '../models/auth_account.model';

export class SecurityUtil {
    /*
      * Tạo access token và refresh token
      */
    static generate(account: Account) {
        const { accessToken, refreshToken, expiresIn } = TokenUtil.generateAuthTokens(account);

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
        return createHash('sha256')
            .update(token)
            .digest('hex');
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
        const DUMMY_HASH =
            '$2b$10$C6UzMDM.H6dfI/f/IKcEeO5Q7GkE1E7dBDEuDfSU/EYEYVplpXCMu';

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
        // length = số byte → hex string sẽ gấp đôi
        return randomBytes(length).toString('hex');
    }

    /**
     * Hash token dùng cho reset password
     */
    static hashTokenResetPassword(token: string): string {
        return createHash('sha256')
            .update(token)
            .digest('hex');
    }


    /**
     * Tạo ID cho request reset password
     */
    static generateResetPasswordId(accountId: string): string {
        const now = new Date();

        // Lấy 2 số cuối của năm (26), tháng (02), ngày (01)
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        // Format y hệt Session nhưng đổi tiền tố thành PRST
        return `PRST_${datePart}_${accountId}_${randomUUID()}`;
    }
}