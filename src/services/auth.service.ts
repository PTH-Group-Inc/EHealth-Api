import { AccountRepository } from '../repository/auth_account.repository';
import { ValidationLogin } from '../utils/validation-login.util';
import { ClientInfo } from '../models/auth_user-session.model';
import { Account } from '../models/auth_account.model';
import { AuthValidator } from '../utils/auth-validator.util';
import { AuthTokenHelper } from '../utils/auth-token.util';
import { AuthSessionHelper } from '../utils/auth-session.util';

export class AuthService {
  /**
   * Đăng nhập bằng Email
   */
  static async loginByEmail(email: string, password: string, clientInfo: ClientInfo) {
    // xác thực đầu vào
    ValidationLogin.validateLoginInput(email, password, 'EMAIL');

    // Truy vấn tài khoản
    const account = await AccountRepository.findByEmail(email);

    // Xử lý đăng nhập chung
    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Đăng nhập bằng SĐT
   */
  static async loginByPhone(phone: string, password: string, clientInfo: ClientInfo) {
    // Xác thực đầu vào
    ValidationLogin.validateLoginInput(phone, password, 'PHONE');

    // Truy vấn tài khoản
    const account = await AccountRepository.findByPhone(phone);

    // Xử lý đăng nhập chung
    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Xử lý đăng nhập chung
   */
  private static async processLogin( account: Account | null, password: string, clientInfo: ClientInfo) {
    AuthValidator.validateDevice(clientInfo);

    await AuthValidator.validateCredential(account, password);

    const {accessToken, refreshToken, refreshTokenHash, expiresIn,} = await AuthTokenHelper.generate(account!);

    await AuthSessionHelper.upsertSession( account!.account_id, refreshTokenHash, clientInfo);

    await AccountRepository.updateLastLogin(account!.account_id);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        accountId: account!.account_id,
        name: account!.name,
        email: account!.email,
        phone: account!.phone,
        role: account!.role,
      },
    };
  }
}