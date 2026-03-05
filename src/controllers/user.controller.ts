import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {

    /**
     * Tạo người dùng mới
     */
    static async createUser(req: Request, res: Response): Promise<Response> {
        try {
            const data = req.body;

            const result = await UserService.createUser(data);

            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản người dùng thành công",
                data: result
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_CREATE_FAILED',
                message: error.message || 'Lỗi hệ thống khi tạo người dùng'
            });
        }
    }

    /**
     * Lấy danh sách người dùng
     */
    static async getUsers(req: Request, res: Response): Promise<Response> {
        try {
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
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_LIST_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Lấy chi tiết người dùng
     */
    static async getUserById(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            const data = await UserService.getUserById(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy thông tin chi tiết người dùng thành công",
                data
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_DETAIL_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Cập nhật thông tin người dùng
     */
    static async updateUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const data = req.body;

            await UserService.updateUser(userId, data);

            return res.status(200).json({
                success: true,
                message: "Cập nhật tài khoản người dùng thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_UPDATE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Xóa / vô hiệu hóa người dùng (Soft Delete)
     */
    static async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            await UserService.deleteUser(userId);

            return res.status(200).json({
                success: true,
                message: "Vô hiệu hóa người dùng thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_DELETE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Tìm kiếm người dùng nhanh (Optional, can alias getUsers)
     */
    static async searchUsers(req: Request, res: Response): Promise<Response> {
        try {
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
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_SEARCH_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Khóa tài khoản
     */
    static async lockUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            await UserService.lockUser(userId);

            return res.status(200).json({
                success: true,
                message: "Khóa tài khoản thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_LOCK_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Mở khóa tài khoản
     */
    static async unlockUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            await UserService.unlockUser(userId);

            return res.status(200).json({
                success: true,
                message: "Mở khóa tài khoản thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_UNLOCK_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }
}
