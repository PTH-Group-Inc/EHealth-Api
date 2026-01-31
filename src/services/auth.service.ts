// services/auth.service.ts

import { AccountRepository } from '../repository/auth_account.repository';
import { UserSessionRepository } from '../repository/auth_user-session.repository';

import { ValidationLogin } from '../utils/validation-login.util';
import { SecurityUtil } from '../utils/security.util';
import { TokenUtil } from '../utils/token.util';

import { AUTH_ERRORS } from '../constants/auth-error.constant';

interface ClientInfo {
  deviceId?: string;
  deviceName?: string;
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Đăng nhập bằng Email
   */
  static async loginByEmail(
    email: string,
    password: string,
    clientInfo: ClientInfo
  ) {
    // 1. xác thực đầu vào
    ValidationLogin.validateLoginInput(email, password, 'EMAIL');

    // 2. Truy vấn tài khoản
    const account = await AccountRepository.findByEmail(email);

    // 3. Xử lý đăng nhập chung
    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Đăng nhập bằng SĐT
   */
  static async loginByPhone(
    phone: string,
    password: string,
    clientInfo: ClientInfo
  ) {
    // 1. Xác thực đầu vào
    ValidationLogin.validateLoginInput(phone, password, 'PHONE');

    // 2. Truy vấn tài khoản
    const account = await AccountRepository.findByPhone(phone);

    // 3. Xử lý đăng nhập chung
    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Xử lý đăng nhập chung (Email / Phone)
   */
  private static async processLogin(
    account: any | null,
    password: string,
    clientInfo: ClientInfo
  ) {
    // 1. Kiểm tra credential
    const isPasswordValid = await SecurityUtil.verifyPasswordSafe(
      password,
      account?.password
    );

    if (!account || !isPasswordValid) {
      throw AUTH_ERRORS.INVALID_CREDENTIAL;
    }

    // 2. Kiểm tra trạng thái tài khoản
    if (account.status !== 'ACTIVE') {
      throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
    }

    // 3. Tạo access token & refresh token
    const { accessToken, refreshToken, expiresIn } =
      TokenUtil.generateAuthTokens(account);

    // 4. Hash refresh token
    const refreshTokenHash = await SecurityUtil.hashToken(refreshToken);

    // 5. Tạo user session
    await UserSessionRepository.createSession({
      accountId: account.account_id,
      refreshTokenHash,
      deviceId: clientInfo.deviceId,
      deviceName: clientInfo.deviceName,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      expiredAt: SecurityUtil.getRefreshTokenExpiredAt(),
    });

    // 6. Cập nhật thời gian đăng nhập cuối cùng
    await AccountRepository.updateLastLogin(account.account_id);

    // 7. Trả về kết quả
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        accountId: account.account_id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        role: account.role,
      },
    };
  }
}