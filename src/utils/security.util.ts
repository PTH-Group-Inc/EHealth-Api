import bcrypt from "bcrypt";
import { TOKEN_CONFIG } from "../constants/auth_token.constant";

export class SecurityUtil {
    /**
     * Hash refresh token trước khi lưu DB
     */
    static async hashToken(token: string): Promise<string> {
        return bcrypt.hash(token, 10);
    }

    /**
     * So sánh mật khẩu an toàn (chống timing attack)
     */
    static async verifyPasswordSafe(
        inputPassword: string,
        storedHash: string | null | undefined,
    ): Promise<boolean> {
        // Hash giả dùng để so sánh khi user không tồn tại
        const DUMMY_HASH =
            "$2b$10$C6UzMDM.H6dfI/f/IKcEeO5Q7GkE1E7dBDEuDfSU/EYEYVplpXCMu";

        const hashToCompare = storedHash ?? DUMMY_HASH;

        return bcrypt.compare(inputPassword, hashToCompare);
    }

    /**
   * Lấy thời điểm hết hạn của refresh token
   */
    static getRefreshTokenExpiredAt(): Date {
        return new Date(
            Date.now() + TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN_SECONDS * 1000
        );
    } 
}
