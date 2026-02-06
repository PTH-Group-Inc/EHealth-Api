import jwt from 'jsonwebtoken';
import { Account } from '../models/auth_account.model';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';

export class TokenUtil {
    /*
     * Tạo access token và refresh token
     * CẬP NHẬT: Thêm tham số sessionId
     */
    static generateAuthTokens(account: Account, sessionId: string) {
        const payload = {
            sub: account.account_id,
            role: account.role,
            sessionId: sessionId, // Thêm sessionId vào payload
        };

        const accessToken = jwt.sign(
            payload,
            process.env[TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV] as string,
            {
                expiresIn: TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
            }
        );

        const refreshToken = jwt.sign(
            payload,
            process.env[TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV] as string,
            {
                expiresIn: TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN,
            }
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN_SECONDS,
        };
    }

    /*
     * Xác thực chữ ký của access token
     */
    static verifyAccessToken<T = any>(token: string): T {
        try {
            return jwt.verify(
                token,
                process.env[TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV] as string
            ) as T;
        } catch {
            throw new Error('INVALID_ACCESS_TOKEN');
        }
    }

    /*
     * Xác thực chữ ký của refresh token
     */
    static verifyRefreshToken<T = any>(token: string): T {
        try {
            return jwt.verify(
                token,
                process.env[TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV] as string
            ) as T;
        } catch {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
    }
}