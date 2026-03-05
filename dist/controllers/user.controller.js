"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    /**
     * Tạo người dùng mới
     */
    static async createUser(req, res) {
        try {
            const data = req.body;
            const result = await user_service_1.UserService.createUser(data);
            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản người dùng thành công",
                data: result
            });
        }
        catch (error) {
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
    static async getUsers(req, res) {
        try {
            const { page, limit, role, status, search } = req.query;
            const filter = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
                role: typeof role === 'string' ? role : undefined,
                status: typeof status === 'string' ? status : undefined,
                search: typeof search === 'string' ? search : undefined
            };
            const data = await user_service_1.UserService.getUsers(filter);
            return res.status(200).json({
                success: true,
                message: "Lấy danh sách người dùng thành công",
                data
            });
        }
        catch (error) {
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
    static async getUserById(req, res) {
        try {
            const userId = req.params.userId;
            const data = await user_service_1.UserService.getUserById(userId);
            return res.status(200).json({
                success: true,
                message: "Lấy thông tin chi tiết người dùng thành công",
                data
            });
        }
        catch (error) {
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
    static async updateUser(req, res) {
        try {
            const userId = req.params.userId;
            const data = req.body;
            await user_service_1.UserService.updateUser(userId, data);
            return res.status(200).json({
                success: true,
                message: "Cập nhật tài khoản người dùng thành công"
            });
        }
        catch (error) {
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
    static async deleteUser(req, res) {
        try {
            const userId = req.params.userId;
            await user_service_1.UserService.deleteUser(userId);
            return res.status(200).json({
                success: true,
                message: "Vô hiệu hóa người dùng thành công"
            });
        }
        catch (error) {
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
    static async searchUsers(req, res) {
        try {
            // Re-use getUsers logic basically, assuming `search` query param is provided explicitly.
            const { q, role, page, limit } = req.query;
            const filter = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                search: typeof q === 'string' ? q : undefined,
                role: typeof role === 'string' ? role : undefined
            };
            const data = await user_service_1.UserService.getUsers(filter);
            return res.status(200).json({
                success: true,
                message: "Tìm kiếm người dùng thành công",
                data
            });
        }
        catch (error) {
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
    static async lockUser(req, res) {
        try {
            const userId = req.params.userId;
            await user_service_1.UserService.lockUser(userId);
            return res.status(200).json({
                success: true,
                message: "Khóa tài khoản thành công"
            });
        }
        catch (error) {
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
    static async unlockUser(req, res) {
        try {
            const userId = req.params.userId;
            await user_service_1.UserService.unlockUser(userId);
            return res.status(200).json({
                success: true,
                message: "Mở khóa tài khoản thành công"
            });
        }
        catch (error) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_UNLOCK_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }
}
exports.UserController = UserController;
