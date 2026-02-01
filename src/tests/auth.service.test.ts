import { AuthService } from '../../src/services/auth.service';
import { AccountRepository } from '../../src/repository/auth_account.repository';
import { PasswordResetRepository } from '../../src/repository/auth_password-reset.repository';
import { AuthMailUtil } from '../../src/utils/auth-mail.util';
import { UserSessionRepository } from '../../src/repository/auth_user-session.repository';
import { ValidationLogin } from '../../src/utils/auth-validation-login.util';
import { AUTH_ERRORS } from '../../src/constants/auth-error.constant';
import { SecurityUtil } from '../../src/utils/auth-security.util';

// Mock tất cả các dependency để cô lập AuthService
jest.mock('../../src/repository/auth_account.repository');
jest.mock('../../src/repository/auth_password-reset.repository');
jest.mock('../../src/repository/auth_user-session.repository');
jest.mock('../../src/utils/auth-mail.util');
jest.mock('../../src/utils/auth-validation-login.util');
jest.mock('../../src/utils/auth-security.util');

describe('AuthService', () => {
  // Reset mock trước mỗi test case để tránh dữ liệu rác
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TEST CASE: FORGOT PASSWORD
  // ==========================================
  describe('forgotPassword', () => {
    const mockEmail = 'test@example.com';

    it('should create token and send email if account exists and is ACTIVE', async () => {
      // 1. Setup Mock: Giả lập Account tồn tại
      (AccountRepository.findByEmail as jest.Mock).mockResolvedValue({
        account_id: '123',
        email: mockEmail,
        status: 'ACTIVE',
      });

      // Mock security utils
      (SecurityUtil.generateRandomTokenResetPassword as jest.Mock).mockReturnValue('plain-token');
      (SecurityUtil.hashTokenResetPassword as jest.Mock).mockReturnValue('hashed-token');

      // 2. Chạy hàm cần test
      await AuthService.forgotPassword({ email: mockEmail });

      // 3. Verify (Kiểm tra kết quả)
      // Phải gọi validation
      expect(ValidationLogin.validateEmailOnly).toHaveBeenCalledWith(mockEmail);
      // Phải lưu token xuống DB
      expect(PasswordResetRepository.createResetToken).toHaveBeenCalled();
      // Phải gửi email
      expect(AuthMailUtil.sendResetPasswordEmail).toHaveBeenCalledWith(
        mockEmail,
        expect.stringContaining('plain-token') // Link phải chứa token
      );
    });

    it('should do nothing (silent fail) if account does not exist', async () => {
      // 1. Setup Mock: Không tìm thấy account
      (AccountRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      // 2. Chạy hàm
      await AuthService.forgotPassword({ email: 'nonexist@example.com' });

      // 3. Verify
      expect(PasswordResetRepository.createResetToken).not.toHaveBeenCalled();
      expect(AuthMailUtil.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should do nothing if account is INACTIVE', async () => {
      // 1. Setup Mock: Account bị khóa
      (AccountRepository.findByEmail as jest.Mock).mockResolvedValue({
        account_id: '123',
        status: 'LOCKED',
      });

      // 2. Chạy hàm
      await AuthService.forgotPassword({ email: mockEmail });

      // 3. Verify
      expect(AuthMailUtil.sendResetPasswordEmail).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // TEST CASE: RESET PASSWORD
  // ==========================================
  describe('resetPassword', () => {
    const mockInput = {
      resetToken: 'valid-token',
      newPassword: 'NewPassword123',
    };

    it('should reset password successfully given valid token', async () => {
      // 1. Setup Mock
      // Giả lập tìm thấy token hợp lệ trong DB
      (PasswordResetRepository.findValidToken as jest.Mock).mockResolvedValue({
        id: 1,
        accountId: 'acc-123',
      });
      
      // Giả lập hash password mới
      (SecurityUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-new-pass');

      // 2. Chạy hàm
      await AuthService.resetPassword(mockInput);

      // 3. Verify
      // Cập nhật mật khẩu mới
      expect(AccountRepository.updatePassword).toHaveBeenCalledWith(
        'acc-123',
        'hashed-new-pass'
      );
      // Đánh dấu token đã dùng
      expect(PasswordResetRepository.markAsUsed).toHaveBeenCalledWith(1);
      // Đăng xuất các phiên cũ
      expect(UserSessionRepository.revokeAllByAccount).toHaveBeenCalledWith('acc-123');
    });

    it('should throw INVALID_RESET_TOKEN if token not found or expired', async () => {
      // 1. Setup Mock: Không tìm thấy token
      (PasswordResetRepository.findValidToken as jest.Mock).mockResolvedValue(null);

      // 2. Chạy hàm & Verify Error
      await expect(AuthService.resetPassword(mockInput))
        .rejects
        .toEqual(AUTH_ERRORS.INVALID_RESET_TOKEN); // Kiểm tra đúng lỗi throw ra
        
      // Đảm bảo không update password
      expect(AccountRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
});