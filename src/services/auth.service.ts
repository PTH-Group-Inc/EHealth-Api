import { AccountRepository } from "../repository/auth_account.repository";
import { AuthValidation } from "../utils/auth-validation.util";
import { ClientInfo } from "../models/auth_user-session.model";
import { Account, AccountStatus } from "../models/auth_account.model";
import { AuthSessionUtil } from "../utils/auth-session.util";
import { SecurityUtil } from "../utils/auth-security.util";
import { UserSessionRepository } from "../repository/auth_user-session.repository";
import { AUTH_ERRORS } from "../constants/auth-error.constant";
import { PasswordResetRepository } from "../repository/auth_password-reset.repository";
import { AuthMailUtil } from "../utils/auth-mail.util";
import { AccountVerificationRepository } from "../repository/auth_verification.repository";
import { AUTH_CONSTANTS } from "../constants/auth.constant";

export class AuthService {
  /**
   * Đăng nhập bằng Email
   */
  static async loginByEmail(email: string, password: string, clientInfo: ClientInfo,) {

    AuthValidation.validateLoginInput(email, password, "EMAIL");

    const account = await AccountRepository.findByEmail(email);

    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Đăng nhập bằng SĐT
   */
  static async loginByPhone(phone: string, password: string, clientInfo: ClientInfo,) {

    AuthValidation.validateLoginInput(phone, password, "PHONE");

    const account = await AccountRepository.findByPhone(phone);

    return this.processLogin(account, password, clientInfo);
  }

  /**
   * Xử lý đăng nhập chung
   */
  private static async processLogin(account: Account | null, password: string, clientInfo: ClientInfo,) {

    AuthValidation.validateDevice(clientInfo);

    await AuthValidation.validateCredential(account, password);

    const { accessToken, refreshToken, refreshTokenHash, expiresIn } = SecurityUtil.generateToken(account!);

    await AuthSessionUtil.upsertSession(account!.account_id, refreshTokenHash, clientInfo,);

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
  static async logout(input: { refreshToken: string }, authPayload: { account_id: string },): Promise<void> {
    const accountId = authPayload.account_id;

    // Xác thực refresh token
    try {
      SecurityUtil.verifyRefreshToken(input.refreshToken);
    } catch {
      throw AUTH_ERRORS.INVALID_REFRESH_TOKEN;
    }

    const refreshTokenHash = SecurityUtil.hashRefreshToken(input.refreshToken);

    // Xác thực session tồn tại
    const session = await UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash,);

    if (!session || session.account_id !== accountId) throw AUTH_ERRORS.SESSION_NOT_FOUND;


    await UserSessionRepository.logoutCurrentSession(accountId, refreshTokenHash,);
  }

  /**
   * Quên mật khẩu – gửi link reset
   */
  static async forgotPassword(input: { email: string }): Promise<void> {
    try {
      AuthValidation.validateEmailOnly(input.email);

      const account = await AccountRepository.findByEmail(input.email);

      if (!account || account.status !== "ACTIVE") return;


      if (!account.email) return;

      const resetId = SecurityUtil.generateResetPasswordId(account.account_id);

      const resetToken = SecurityUtil.generateRandomTokenResetPassword( AUTH_CONSTANTS.RESET_PASSWORD.TOKEN_LENGTH,);
      const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);

      const expiredAt = new Date(Date.now() + AUTH_CONSTANTS.RESET_PASSWORD.EXPIRES_IN_MS);

      await PasswordResetRepository.createResetToken(resetId, account.account_id, resetTokenHash, expiredAt,);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await AuthMailUtil.sendResetPasswordEmail(account.email, resetLink);

    } catch (error) {
      console.error("Lỗi quên mật khẩu:", error);
    }
  }

  /**
   * Đặt lại mật khẩu
   */
  static async resetPassword(input: { resetToken: string; newPassword: string; }): Promise<void> {

    const { resetToken, newPassword } = input;

    AuthValidation.validatePasswordOnly(newPassword);

    const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);

    const resetRecord = await PasswordResetRepository.findValidToken(resetTokenHash);

    if (!resetRecord) throw AUTH_ERRORS.INVALID_RESET_TOKEN;

    const hashedPassword = await SecurityUtil.hashPassword(newPassword);

    await AccountRepository.updatePassword(resetRecord.accountId, hashedPassword,);

    await PasswordResetRepository.markAsUsed(resetRecord.id);

    await UserSessionRepository.revokeAllByAccount(resetRecord.accountId);
  }

  /**
   * Đăng ký bằng Email
   */
  static async registerByEmail(input: { email: string; password: string; name: string; }) {

    AuthValidation.validateEmailRegister(input.email, input.password, input.name,);

    const existAccount = await AccountRepository.findByEmail(input.email);

    if (existAccount) throw AUTH_ERRORS.EMAIL_EXISTED;


    const result = await this.processRegister({
      name: input.name,
      password: input.password,
      email: input.email,
      phone: null,
      status: AUTH_CONSTANTS.ACCOUNT_STATUS.PENDING,
    });

    try {
      const accountId = result.userCode;

      await AccountVerificationRepository.invalidateOldTokens(accountId);

      const verifyId = SecurityUtil.generateVerificationId(accountId);

      const verifyToken = SecurityUtil.generateRandomTokenResetPassword(AUTH_CONSTANTS.VERIFY_EMAIL.TOKEN_LENGTH );
      const verifyTokenHash = SecurityUtil.hashTokenResetPassword(verifyToken);

      const expiredAt = new Date(Date.now() + AUTH_CONSTANTS.VERIFY_EMAIL.EXPIRES_IN_MS);

      await AccountVerificationRepository.createVerificationToken(
        verifyId,
        accountId,
        verifyTokenHash,
        expiredAt
      );

      const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

      await AuthMailUtil.sendVerifyEmail(input.email, verifyLink);

    } catch (error) {
      console.error("⚠️ Lỗi quy trình gửi mail verify:", error);
    }

    return result;
  }

  /**
   * Đăng ký bằng SĐT
   */
  static async registerByPhone(input: { phone: string; password: string; name: string; }) {

    AuthValidation.validatePhoneRegister(input.phone, input.password, input.name,);

    const existAccount = await AccountRepository.findByPhone(input.phone);
    if (existAccount) throw AUTH_ERRORS.PHONE_EXISTED;


    const result = await this.processRegister({
      name: input.name,
      password: input.password,
      email: null,
      phone: input.phone,
      status: AUTH_CONSTANTS.ACCOUNT_STATUS.PENDING,
    });

    return result;
  }


  /* 
  * Xử lý đăng ký chung
  */
  private static async processRegister(payload: { name: string; password: string; email: string | null; phone: string | null; status: AccountStatus; }) {
    const hashedPassword = await SecurityUtil.hashPassword(payload.password);

    const userCode = await SecurityUtil.generateUserCode("CUSTOMER");

    // Tạo object Account
    const newAccount: Account = {
      account_id: userCode,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      role: "CUSTOMER",
      status: payload.status,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await AccountRepository.createAccount(newAccount);

    return {
      userCode: newAccount.account_id,
      email: newAccount.email,
      phone: newAccount.phone,
      status: newAccount.status,
    };
  }


  /**
     * Xác thực Email từ Token
     */
    static async verifyEmail(token: string): Promise<void> {
        const tokenHash = SecurityUtil.hashTokenResetPassword(token);

        const verificationRecord = await AccountVerificationRepository.findValidToken(tokenHash);

        if (!verificationRecord) {
            throw new Error("Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.");
        }

        await AccountRepository.activateAccount(verificationRecord.accountId);

        await AccountVerificationRepository.markAsUsed(verificationRecord.id);
    }
}
