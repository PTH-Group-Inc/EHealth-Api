import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { NotificationTemplateService } from '../../services/Core/notification-template.service';
import { CreateTemplateInput, UpdateTemplateInput } from '../../models/Core/notification.model';

export class NotificationTemplateController {
    /**
     * Lấy danh sách phân trang (Admin)
     */
    static getTemplates = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string;
            const categoryId = req.query.category_id as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await NotificationTemplateService.getTemplates(search, categoryId, page, limit);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách mẫu thông báo thành công.',
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
     * Thêm mới mẫu thông báo
     */
    static createTemplate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data: CreateTemplateInput = req.body;
            const template = await NotificationTemplateService.createTemplate(data);

            res.status(201).json({
                success: true,
                message: 'Tạo mẫu thông báo thành công.',
                data: template
            });
    });

    /**
     * Cập nhật mẫu thông báo
     */
    static updateTemplate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const data: UpdateTemplateInput = req.body;
            const template = await NotificationTemplateService.updateTemplate(id, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật mẫu thông báo thành công.',
                data: template
            });
    });

    /**
     * Xóa mềm mẫu thông báo
     */
    static deleteTemplate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            await NotificationTemplateService.deleteTemplate(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa mẫu thông báo thành công.'
            });
    });
}
