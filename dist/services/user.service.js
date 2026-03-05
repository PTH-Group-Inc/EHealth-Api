"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_repository_1 = require("../repository/user.repository");
const auth_security_util_1 = require("../utils/auth-security.util");
const auth_mail_util_1 = require("../utils/auth-mail.util");
const app_error_util_1 = require("../utils/app-error.util");
const crypto_1 = require("crypto");
class UserService {
    /**
     * Tạo user mới từ Admin
     */
    static async createUser(data) {
        // Validate
        if (!data.email && !data.phone) {
            throw new app_error_util_1.AppError(400, 'USER_MISSING_CONTACT', 'Vui lòng cung cấp ít nhất Email hoặc Số điện thoại.');
        }
        if (!data.roles || data.roles.length === 0) {
            throw new app_error_util_1.AppError(400, 'USER_MISSING_ROLE', 'Vui lòng cung cấp ít nhất một vai trò (Role).');
        }
        if (data.roles.length > 20) {
            throw new app_error_util_1.AppError(400, 'USER_TOO_MANY_ROLES', 'Số lượng vai trò cung cấp cho một tài khoản vượt quá giới hạn.');
        }
        // Lọc trùng lặp Role và chuẩn hóa in hoa (đảm bảo không bị lỗi validation length phía sau)
        data.roles = Array.from(new Set(data.roles.map(r => r.toUpperCase())));
        if (!data.full_name) {
            throw new app_error_util_1.AppError(400, 'USER_MISSING_NAME', 'Vui lòng cung cấp họ tên.');
        }
        // Tự động sinh mật khẩu ngẫu nhiên an toàn nếu không được cung cấp 
        const rawPassword = data.password || (0, crypto_1.randomBytes)(8).toString('hex');
        const hashedPassword = await auth_security_util_1.SecurityUtil.hashPassword(rawPassword);
        const userId = await user_repository_1.UserRepository.createUser({
            ...data,
            hashedPassword
        });
        // Gửi thông báo email cho User nếu account có gắn Email
        if (data.email) {
            auth_mail_util_1.AuthMailUtil.sendNewAccountEmail(data.email, data.password ? undefined : rawPassword).catch(console.error);
        }
        return { userId };
    }
    /**
     * Lấy danh sách users
     */
    static async getUsers(filter) {
        return user_repository_1.UserRepository.getUsers(filter);
    }
    /**
     * Lấy chi tiết một user
     */
    static async getUserById(userId) {
        const user = await user_repository_1.UserRepository.getUserById(userId);
        if (!user) {
            throw new app_error_util_1.AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        return user;
    }
    /**
     * Cập nhật thông tin User (Bởi Admin)
     */
    static async updateUser(userId, data) {
        // Kiểm tra xem User có tồn tại không
        const user = await user_repository_1.UserRepository.getUserById(userId);
        if (!user) {
            throw new app_error_util_1.AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        // Lọc trùng lặp Role trước khi xử lý, chuẩn hóa in hoa. Limit param length
        if (data.roles) {
            if (data.roles.length > 20) {
                throw new app_error_util_1.AppError(400, 'USER_TOO_MANY_ROLES', 'Số lượng vai trò cung cấp cho một tài khoản vượt quá giới hạn.');
            }
            data.roles = Array.from(new Set(data.roles.map(r => r.toUpperCase())));
        }
        await user_repository_1.UserRepository.updateUser(userId, data);
    }
    /**
     * Xóa mềm user (Soft Delete)
     */
    static async deleteUser(userId) {
        const isActiveOrBanned = await user_repository_1.UserRepository.getUserById(userId);
        if (!isActiveOrBanned) {
            throw new app_error_util_1.AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        const success = await user_repository_1.UserRepository.deleteUser(userId);
        if (!success) {
            throw new app_error_util_1.AppError(500, 'USER_DELETE_FAILED', 'Xóa người dùng thất bại.');
        }
    }
    /**
     * Khóa tài khoản
     */
    static async lockUser(userId) {
        const user = await user_repository_1.UserRepository.getUserById(userId);
        if (!user) {
            throw new app_error_util_1.AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        if (user.status === 'BANNED') {
            throw new app_error_util_1.AppError(400, 'USER_ALREADY_LOCKED', 'Tài khoản này đã bị khóa từ trước.');
        }
        const success = await user_repository_1.UserRepository.lockUser(userId);
        if (!success) {
            throw new app_error_util_1.AppError(500, 'USER_LOCK_FAILED', 'Khóa tài khoản thất bại.');
        }
    }
    /**
     * Mở khóa tài khoản
     */
    static async unlockUser(userId) {
        const user = await user_repository_1.UserRepository.getUserById(userId);
        if (!user) {
            throw new app_error_util_1.AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        if (user.status === 'ACTIVE' && user.locked_until === null && user.failed_login_count === 0) {
            throw new app_error_util_1.AppError(400, 'USER_NOT_LOCKED', 'Tài khoản đang hoạt động bình thường, không bị khóa.');
        }
        const success = await user_repository_1.UserRepository.unlockUser(userId);
        if (!success) {
            throw new app_error_util_1.AppError(500, 'USER_UNLOCK_FAILED', 'Mở khóa tài khoản thất bại.');
        }
    }
}
exports.UserService = UserService;
