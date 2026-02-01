import { Account } from '../models/auth_account.model';
import { TokenUtil } from './token.util';
import { SecurityUtil } from './security.util';

export class AuthTokenUtil {
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
}