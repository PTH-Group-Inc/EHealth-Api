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
  static async loginByEmail(email: string, password: string, clientInfo: ClientInfo) {
    AuthValidation.validateLoginInput(email, password, "EMAIL");

    const account = await AccountRepository.findByEmail(email);

    if (!account) throw AUTH_ERRORS.INVALID_CREDENTIAL;

    await this.handleLoginAttempt(account, password);

    return this.processLoginSuccess(account, clientInfo);
  }

  /**
   * Đăng nhập bằng SĐT
   */
  static async loginByPhone(phone: string, password: string, clientInfo: ClientInfo) {
    AuthValidation.validateLoginInput(phone, password, "PHONE");

    const account = await AccountRepository.findByPhone(phone);

    if (!account) {
      throw AUTH_ERRORS.INVALID_CREDENTIAL;
    }

    await this.handleLoginAttempt(account, password);

    return this.processLoginSuccess(account, clientInfo);
  }

  /**
   * Xử lý kiểm tra khóa và xác thực mật khẩu
   */
  private static async handleLoginAttempt(account: Account, passwordInput: string) {

    if (account.locked_until && new Date() < new Date(account.locked_until)) {
      throw AUTH_ERRORS.ACCOUNT_LOCKED;
    }

    const isPasswordValid = await SecurityUtil.verifyPasswordSafe(passwordInput, account.password);

    if (!isPasswordValid) {
      const newFailedCount = await AccountRepository.incrementFailedLogin(account.account_id);

      if (newFailedCount >= AUTH_CONSTANTS.LOGIN_LIMIT.MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + AUTH_CONSTANTS.LOGIN_LIMIT.LOCK_DURATION_MS);
        await AccountRepository.lockAccount(account.account_id, lockUntil);
      }

      throw AUTH_ERRORS.INVALID_CREDENTIAL;
    }

    if (account.failed_login_count > 0 || account.locked_until) {
      await AccountRepository.resetFailedLogin(account.account_id);
    }

    if (account.status !== 'ACTIVE') {
      throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
    }
  }

  /**
   * Xử lý khi đăng nhập thành công (Tạo Token & Session)
   */
  private static async processLoginSuccess(account: Account, clientInfo: ClientInfo) {

    AuthValidation.validateDevice(clientInfo);

    const existingSession = await UserSessionRepository.findByAccountAndDevice(
      account.account_id,
      clientInfo.deviceId!,
    );

    const sessionId = existingSession
      ? existingSession.sessionId
      : AuthSessionUtil.generate(account.account_id);

    const { accessToken, refreshToken, refreshTokenHash, expiresIn } =
      SecurityUtil.generateToken(account, sessionId);

    await AuthSessionUtil.upsertSession(
      sessionId,
      account.account_id,
      refreshTokenHash,
      clientInfo,
    );

    await AccountRepository.updateLastLogin(account.account_id);

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

  /**
   * Mở khóa tài khoản thủ công
   */
  static async unlockAccount(input: { accountId: string }): Promise<void> {
     await AccountRepository.unlockAccount(input.accountId);
  }


  /**
   * Xử lý đăng nhập chung
   */
  /*
  private static async processLogin(
    account: Account | null,
    password: string,
    clientInfo: ClientInfo,
  ) {
    AuthValidation.validateDevice(clientInfo);

    await AuthValidation.validateCredential(account, password);

    const existingSession = await UserSessionRepository.findByAccountAndDevice(
      account!.account_id,
      clientInfo.deviceId!,
    );

    const sessionId = existingSession
      ? existingSession.sessionId
      : AuthSessionUtil.generate(account!.account_id);

    const { accessToken, refreshToken, refreshTokenHash, expiresIn } =
      SecurityUtil.generateToken(account!, sessionId);
    await AuthSessionUtil.upsertSession(
      sessionId,
      account!.account_id,
      refreshTokenHash,
      clientInfo,
    );

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
  */

  /**
   * Đăng xuất
   */
  static async logout(input: { refreshToken: string }): Promise<void> {
    try {
      SecurityUtil.verifyRefreshToken(input.refreshToken);
    } catch {
      throw AUTH_ERRORS.INVALID_REFRESH_TOKEN;
    }

    const refreshTokenHash = SecurityUtil.hashRefreshToken(input.refreshToken);

    const session = await UserSessionRepository.findActiveSessionByRefreshToken(
      refreshTokenHash
    );

    if (!session) {
      throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    await UserSessionRepository.logoutCurrentSession(
      session.account_id,
      refreshTokenHash
    );
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

      const resetToken = SecurityUtil.generateRandomTokenResetPassword(
        AUTH_CONSTANTS.RESET_PASSWORD.TOKEN_LENGTH,
      );
      const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);

      const expiredAt = new Date(
        Date.now() + AUTH_CONSTANTS.RESET_PASSWORD.EXPIRES_IN_MS,
      );

      await PasswordResetRepository.createResetToken(
        resetId,
        account.account_id,
        resetTokenHash,
        expiredAt,
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await AuthMailUtil.sendResetPasswordEmail(account.email, resetLink);
    } catch (error) {
      console.error("Lỗi quên mật khẩu:", error);
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

    AuthValidation.validatePasswordOnly(newPassword);

    const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);

    const resetRecord =
      await PasswordResetRepository.findValidToken(resetTokenHash);

    if (!resetRecord) throw AUTH_ERRORS.INVALID_RESET_TOKEN;

    const hashedPassword = await SecurityUtil.hashPassword(newPassword);

    await AccountRepository.updatePassword(
      resetRecord.accountId,
      hashedPassword,
    );

    await PasswordResetRepository.markAsUsed(resetRecord.id);

    await UserSessionRepository.revokeAllByAccount(resetRecord.accountId);
  }

  /**
   * Đăng ký bằng Email
   */
  static async registerByEmail(input: {
    email: string;
    password: string;
    name: string;
  }) {
    AuthValidation.validateEmailRegister(
      input.email,
      input.password,
      input.name,
    );

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

      const otpCode = SecurityUtil.generateOTP(6);
      const otpHash = SecurityUtil.hashTokenResetPassword(otpCode);

      const verifyId = SecurityUtil.generateVerificationId(accountId);

      const expiredAt = new Date(
        Date.now() + AUTH_CONSTANTS.VERIFY_EMAIL.EXPIRES_IN_MS,
      );

      await AccountVerificationRepository.createVerificationToken(
        verifyId,
        accountId,
        otpHash,
        expiredAt,
      );

      await AuthMailUtil.sendOtpEmail(input.email, otpCode);
    } catch (error) {
      console.error("⚠️ Lỗi gửi OTP:", error);
    }

    return result;
  }

  /**
   * Đăng ký bằng SĐT
   */
  static async registerByPhone(input: {
    phone: string;
    password: string;
    name: string;
  }) {
    AuthValidation.validatePhoneRegister(
      input.phone,
      input.password,
      input.name,
    );

    const existAccount = await AccountRepository.findByPhone(input.phone);
    if (existAccount) throw AUTH_ERRORS.PHONE_EXISTED;

    const result = await this.processRegister({
      name: input.name,
      password: input.password,
      email: null,
      phone: input.phone,
      status: AUTH_CONSTANTS.ACCOUNT_STATUS.ACTIVE,
    });

    return result;
  }

  /*
   * Xử lý đăng ký chung
   */
  private static async processRegister(payload: {
    name: string;
    password: string;
    email: string | null;
    phone: string | null;
    status: AccountStatus;
  }) {
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
      failed_login_count: 0,
      locked_until: null
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

    const verificationRecord =
      await AccountVerificationRepository.findValidToken(tokenHash);

    if (!verificationRecord)
      throw new Error("Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.");

    await AccountRepository.activateAccount(verificationRecord.accountId);

    await AccountVerificationRepository.markAsUsed(verificationRecord.id);
  }

  /**
   * Xác thực Email bằng OTP
   */
  static async verifyEmailOTP(input: {
    email: string;
    otp: string;
  }): Promise<void> {
    const { email, otp } = input;

    const account = await AccountRepository.findByEmail(email);
    if (!account) {
      throw new Error("Email không tồn tại.");
    }

    const otpHash = SecurityUtil.hashTokenResetPassword(otp);

    const verificationRecord = await AccountVerificationRepository.findValidOTP(
      account.account_id,
      otpHash,
    );

    if (!verificationRecord)
      throw new Error("Mã xác thực không hợp lệ hoặc đã hết hạn.");

    await AccountRepository.activateAccount(verificationRecord.accountId);

    await AccountVerificationRepository.markAsUsed(verificationRecord.id);
  }
}
