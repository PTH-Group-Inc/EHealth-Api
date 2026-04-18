import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { NotificationCategoryService } from '../../services/Core/notification-category.service';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Core/notification.model';

export class NotificationCategoryController {
    /**
     * Lấy danh sách phân trang (Admin)
     */
    static getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await NotificationCategoryService.getCategories(search, page, limit);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách nhóm thông báo thành công.',
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
    });

    /**
     * Lấy danh sách cấu hình Dropdown (Public)
     */
    static getActiveCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const categories = await NotificationCategoryService.getActiveCategories();
            res.status(200).json({
                success: true,
                message: 'Thành công.',
                data: categories
            });
    });

    /**
     * Thêm mới danh mục
     */
    static createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data: CreateCategoryInput = req.body;
            const category = await NotificationCategoryService.createCategory(data);

            res.status(201).json({
                success: true,
                message: 'Tạo loại thông báo thành công.',
                data: category
            });
    });

    /**
     * Cập nhật danh mục
     */
    static updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const data: UpdateCategoryInput = req.body;
            const category = await NotificationCategoryService.updateCategory(id, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật loại thông báo thành công.',
                data: category
            });
    });

    /**
     * Xóa mềm danh mục
     */
    static deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            await NotificationCategoryService.deleteCategory(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa loại thông báo thành công.'
            });
    });
}
