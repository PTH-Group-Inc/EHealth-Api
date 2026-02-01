// utils/security.util.ts
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';

export class SecurityUtil {
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
}