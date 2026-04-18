import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { UserService } from '../../services/Facility Management/user.service';
import { CreateUserInput, UpdateUserByAdminInput, UpdateUserStatusInput, ResetPasswordAdminInput, ChangePasswordInput, AssignRoleInput } from '../../models/Core/user.model';

export class UserController {
    /**
     * Dành cho Dropdown: Lấy danh sách trạng thái Account
     */
    static getAccountStatuses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const statuses = [
            { code: 'ACTIVE', label: 'Hoạt động' },
            { code: 'INACTIVE', label: 'Vô hiệu hóa (Đã xóa)' },
            { code: 'BANNED', label: 'Bị khóa' },
            { code: 'PENDING', label: 'Chờ xác thực' }
        ];
        res.status(200).json({
            success: true,
            data: statuses
        });
    });

    /**
     * Tạo người dùng mới
     */
    static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = req.body;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            const result = await UserService.createUser(data, adminId, ipAddress, userAgent);

            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản người dùng thành công",
                data: result
            });
    });

    /**
     * Lấy danh sách người dùng
     */
    static getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { page, limit, role, status, search } = req.query;

            const filter = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                role: typeof role === 'string' ? role : undefined,
                status: typeof status === 'string' ? status : undefined,
                search: typeof search === 'string' ? search : undefined
            };

            const data = await UserService.getUsers(filter);

            return res.status(200).json({
                success: true,
                message: "Lấy danh sách người dùng thành công",
                data
            });
    });

    /**
     * Lấy chi tiết người dùng
     */
    static getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;

            const data = await UserService.getUserById(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy thông tin chi tiết người dùng thành công",
                data
            });
    });

    /**
     * Cập nhật thông tin người dùng
     */
    static updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const data = req.body;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.updateUser(userId, data, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Cập nhật tài khoản người dùng thành công"
            });
    });

    /**
     * Xóa / vô hiệu hóa người dùng (Soft Delete)
     */
    static deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.deleteUser(userId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Vô hiệu hóa người dùng thành công"
            });
    });

    /**
     * Tìm kiếm người dùng nhanh (Optional, can alias getUsers)
     */
    static searchUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            // Re-use getUsers logic basically, assuming `search` query param is provided explicitly.
            const { q, role, page, limit } = req.query;

            const filter = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20,
                search: typeof q === 'string' ? q : undefined,
                role: typeof role === 'string' ? role : undefined
            };

            const data = await UserService.getUsers(filter);

            return res.status(200).json({
                success: true,
                message: "Tìm kiếm người dùng thành công",
                data
            });
    });

    /**
     * Khóa tài khoản
     */
    static lockUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.lockUser(userId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Khóa tài khoản thành công"
            });
    });

    /**
     * Mở khóa tài khoản
     */
    static unlockUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.unlockUser(userId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Mở khóa tài khoản thành công"
            });
    });

    /**
     * Thay đổi trạng thái tài khoản
     */
    static updateUserStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const data: UpdateUserStatusInput = req.body;

            // Lấy thông tin user thực hiện (từ middleware config)
            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            if (!data.status) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_INPUT',
                    message: 'Vui lòng cung cấp trạng thái mới (status).'
                });
            }

            await UserService.updateUserStatus(userId, data, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Thay đổi trạng thái tài khoản thành công"
            });
    });

    /**
     * Lấy lịch sử thay đổi trạng thái
     */
    static getStatusHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;

            const history = await UserService.getStatusHistory(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy lịch sử trạng thái thành công",
                data: history
            });
    });

    /**
     * Admin reset mật khẩu cho User
     */
    static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const data: ResetPasswordAdminInput = req.body;

            await UserService.resetPasswordByAdmin(userId, data);

            return res.status(200).json({
                success: true,
                message: "Reset mật khẩu thành công. Mật khẩu điểm được gửi qua Email (nếu hệ thống tự tạo)."
            });
    });

    /**
     * User tự đổi mật khẩu cá nhân
     */
    static changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const data: ChangePasswordInput = req.body;

            // Lấy ID thật của User từ Access Token ở header
            const tokenUserId = (req as any).auth?.user_id;

            if (!tokenUserId) {
                return res.status(401).json({
                    success: false,
                    code: 'UNAUTHORIZED',
                    message: 'Không tìm thấy thông tin xác thực'
                });
            }

            await UserService.changePasswordByUser(userId, data, tokenUserId);

            return res.status(200).json({
                success: true,
                message: "Đổi mật khẩu thành công"
            });
    });

    /**
     * Lấy các role của user
     */
    static getUserRoles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const roles = await UserService.getUserRoles(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy danh sách vai trò thành công",
                data: roles
            });
    });

    /**
     * Gán role cho user
     */
    static assignRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const data: AssignRoleInput = req.body;

            if (!data.role) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_INPUT',
                    message: 'Vui lòng cung cấp mã hoặc ID của vai trò (role).'
                });
            }

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.assignRole(userId, data, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Gán vai trò thành công"
            });
    });

    /**
     * Xoá role của user
     */
    static removeRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.userId as string;
            const roleId = req.params.roleId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.removeRole(userId, roleId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Xoá vai trò thành công"
            });
    });
}
