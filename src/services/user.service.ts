import { UserRepository } from '../repository/user.repository';
import { CreateUserInput, UpdateUserByAdminInput, UserQueryFilter, PaginatedUsers, UserDetail } from '../models/user.model';
import { SecurityUtil } from '../utils/auth-security.util';
import { AuthMailUtil } from '../utils/auth-mail.util';
import { AppError } from '../utils/app-error.util';
import { randomBytes } from 'crypto';

export class UserService {
    /**
     * Tạo user mới từ Admin
     */
    static async createUser(data: CreateUserInput): Promise<{ userId: string }> {
        // Validate
        if (!data.email && !data.phone) {
            throw new AppError(400, 'USER_MISSING_CONTACT', 'Vui lòng cung cấp ít nhất Email hoặc Số điện thoại.');
        }

        if (!data.roles || data.roles.length === 0) {
            throw new AppError(400, 'USER_MISSING_ROLE', 'Vui lòng cung cấp ít nhất một vai trò (Role).');
        }

        if (data.roles.length > 20) {
            throw new AppError(400, 'USER_TOO_MANY_ROLES', 'Số lượng vai trò cung cấp cho một tài khoản vượt quá giới hạn.');
        }

        // Lọc trùng lặp Role
        data.roles = Array.from(new Set(data.roles.map(r => r.toUpperCase())));

        if (!data.full_name) {
            throw new AppError(400, 'USER_MISSING_NAME', 'Vui lòng cung cấp họ tên.');
        }

        // Tự động sinh mật khẩu ngẫu nhiên
        const rawPassword = data.password || randomBytes(8).toString('hex');
        const hashedPassword = await SecurityUtil.hashPassword(rawPassword);

        const userId = await UserRepository.createUser({
            ...data,
            hashedPassword
        });

        // Gửi thông báo email cho User nếu account có gắn Email
        if (data.email) {
            AuthMailUtil.sendNewAccountEmail(data.email, data.password ? undefined : rawPassword).catch(console.error);
        }

        return { userId };
    }

    /**
     * Lấy danh sách users
     */
    static async getUsers(filter: UserQueryFilter): Promise<PaginatedUsers> {
        return UserRepository.getUsers(filter);
    }

    /**
     * Lấy chi tiết một user
     */
    static async getUserById(userId: string): Promise<UserDetail> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        return user;
    }

    /**
     * Cập nhật thông tin User (Bởi Admin)
     */
    static async updateUser(userId: string, data: UpdateUserByAdminInput): Promise<void> {
        // Kiểm tra xem User có tồn tại không
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        // Lọc trùng lặp Role
        if (data.roles) {
            if (data.roles.length > 20) {
                throw new AppError(400, 'USER_TOO_MANY_ROLES', 'Số lượng vai trò cung cấp cho một tài khoản vượt quá giới hạn.');
            }
            data.roles = Array.from(new Set(data.roles.map(r => r.toUpperCase())));
        }

        await UserRepository.updateUser(userId, data);
    }

    /**
     * Xóa mềm user (Soft Delete)
     */
    static async deleteUser(userId: string): Promise<void> {
        const isActiveOrBanned = await UserRepository.getUserById(userId);
        if (!isActiveOrBanned) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        const success = await UserRepository.deleteUser(userId);
        if (!success) {
            throw new AppError(500, 'USER_DELETE_FAILED', 'Xóa người dùng thất bại.');
        }
    }

    /**
     * Khóa tài khoản
     */
    static async lockUser(userId: string): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        if (user.status === 'BANNED') {
            throw new AppError(400, 'USER_ALREADY_LOCKED', 'Tài khoản này đã bị khóa từ trước.');
        }

        const success = await UserRepository.lockUser(userId);
        if (!success) {
            throw new AppError(500, 'USER_LOCK_FAILED', 'Khóa tài khoản thất bại.');
        }
    }

    /**
     * Mở khóa tài khoản
     */
    static async unlockUser(userId: string): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        if (user.status === 'ACTIVE' && user.locked_until === null && user.failed_login_count === 0) {
            throw new AppError(400, 'USER_NOT_LOCKED', 'Tài khoản đang hoạt động bình thường, không bị khóa.');
        }

        const success = await UserRepository.unlockUser(userId);
        if (!success) {
            throw new AppError(500, 'USER_UNLOCK_FAILED', 'Mở khóa tài khoản thất bại.');
        }
    }
}
