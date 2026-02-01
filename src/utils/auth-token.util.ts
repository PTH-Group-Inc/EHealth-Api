import { Account } from '../models/auth_account.model';
import { TokenUtil } from './token.util';
import { SecurityUtil } from './security.util';

export class AuthTokenHelper {
  static async generate(account: Account) {
    const { accessToken, refreshToken, expiresIn } =
      TokenUtil.generateAuthTokens(account);

    const refreshTokenHash =
      await SecurityUtil.hashToken(refreshToken);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash,
      expiresIn,
    };
  }
}