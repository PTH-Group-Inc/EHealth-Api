import jwt from 'jsonwebtoken';
import { User } from '../models/Core/auth_account.model';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';
import { env } from '../config/env';

export class TokenUtil {
    /*
     * Tạo access token và refresh token
     */
    static generateAuthTokens(user: User, sessionId: string) {
        // Chỉ nhúng thông tin định danh tối thiểu vào JWT.
        // permissions KHÔNG được embed vào token để giảm kích thước — sẽ được query DB khi cần.
        const payload = {
            sub: user.users_id,
            roles: user.roles,
            sessionId,
        };

        const accessToken = jwt.sign(
            payload,
            env.jwt.accessSecret,
            {
                expiresIn: TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
            }
        );

        const refreshToken = jwt.sign(
            payload,
            env.jwt.refreshSecret,
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
                env.jwt.accessSecret
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
                env.jwt.refreshSecret
            ) as T;
        } catch {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
    }
}