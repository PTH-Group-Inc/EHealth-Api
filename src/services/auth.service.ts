import { AccountRepository } from '../repository/auth_account.repository';
import { ValidationLogin } from '../utils/auth-validation-login.util';
import { ClientInfo } from '../models/auth_user-session.model';
import { Account } from '../models/auth_account.model';
import { AuthValidator } from '../utils/auth-validator.util';
import { AuthSessionUtil } from '../utils/auth-session.util';
import { SecurityUtil } from '../utils/auth-security.util';
import { UserSessionRepository } from '../repository/auth_user-session.repository';
import { AUTH_ERRORS } from '../constants/auth-error.constant';
import { PasswordResetRepository } from '../repository/auth_password-reset.repository';
import { AuthMailUtil } from '../utils/auth-mail.util';

export class AuthService {
  /**
   * Đăng nhập bằng Email
   */
  static async loginByEmail(email: string, password: string, clientInfo: ClientInfo) {
    ValidationLogin.validateLoginInput(email, password, 'EMAIL');

    const account = await AccountRepository.findByEmail(email);

    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Đăng nhập bằng SĐT
   */
  static async loginByPhone(phone: string, password: string, clientInfo: ClientInfo) {
    ValidationLogin.validateLoginInput(phone, password, 'PHONE');

    const account = await AccountRepository.findByPhone(phone);

    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Xử lý đăng nhập chung
   */
  private static async processLogin(account: Account | null, password: string, clientInfo: ClientInfo) {
    AuthValidator.validateDevice(clientInfo);

    await AuthValidator.validateCredential(account, password);

    const { accessToken, refreshToken, refreshTokenHash, expiresIn, } = SecurityUtil.generate(account!);

    await AuthSessionUtil.upsertSession(account!.account_id, refreshTokenHash, clientInfo);

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
  /**  
   * Đăng xuất
   */
  static async logout(input: { refreshToken: string }, authPayload: { account_id: string }): Promise<void> {
    const accountId = authPayload.account_id;

    // Xác thực refresh token
    try {
      SecurityUtil.verifyRefreshToken(input.refreshToken);
    } catch {
      throw AUTH_ERRORS.INVALID_REFRESH_TOKEN;
    }

    const refreshTokenHash = SecurityUtil.hashRefreshToken(input.refreshToken);

    // Xác thực session tồn tại
    const session = await UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);
    if (!session || session.account_id !== accountId) {
      throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    await UserSessionRepository.logoutCurrentSession(
      accountId,
      refreshTokenHash
    );
  }


  /**
   * Quên mật khẩu – gửi link reset
   */
  static async forgotPassword(input: { email: string }): Promise<void> {
    try {
      ValidationLogin.validateEmailOnly(input.email);

      const account = await AccountRepository.findByEmail(input.email);

      if (!account || account.status !== 'ACTIVE') {
        return;
      }

      if (!account.email) return;

      const resetId = SecurityUtil.generateResetPasswordId(account.account_id);

      const resetToken = SecurityUtil.generateRandomTokenResetPassword(32);
      const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);
      
      const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

      await PasswordResetRepository.createResetToken(
        resetId,    
        account.account_id,
        resetTokenHash,
        expiredAt
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await AuthMailUtil.sendResetPasswordEmail(account.email, resetLink);

    } catch (error) {
      console.error('Lỗi quên mật khẩu:', error);
    }
  }

  /**
   * Đặt lại mật khẩu
   */
  static async resetPassword(input: {
    resetToken: string;
    newPassword: string;
  }): Promise<void> {
    const { resetToken, newPassword } = input;

    ValidationLogin.validatePasswordOnly(newPassword);

    const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);

    const resetRecord = await PasswordResetRepository.findValidToken(resetTokenHash);

    if (!resetRecord) {
      throw AUTH_ERRORS.INVALID_RESET_TOKEN;
    }

    const hashedPassword = await SecurityUtil.hashPassword(newPassword);

    await AccountRepository.updatePassword(
      resetRecord.accountId,
      hashedPassword
    );

    await PasswordResetRepository.markAsUsed(resetRecord.id);

    await UserSessionRepository.revokeAllByAccount(
      resetRecord.accountId
    );
  }
}