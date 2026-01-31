import jwt from 'jsonwebtoken';
import { Account } from '../models/auth_account.model';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';

export class TokenUtil {
    /**
     * Tạo access token và refresh token
     */
    static generateAuthTokens(account: Account) {
        const payload = {
            sub: account.account_id,
            role: account.role,
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
}