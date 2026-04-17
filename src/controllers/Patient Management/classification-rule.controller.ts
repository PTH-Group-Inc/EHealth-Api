import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ClassificationRuleService } from '../../services/Patient Management/classification-rule.service';
import { RULE_MESSAGES, RULE_PAGINATION } from '../../constants/classification-rule.constant';

export class ClassificationRuleController {

    /** Tạo mới Rule */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await ClassificationRuleService.create(req.body);
            res.status(201).json({ success: true, message: RULE_MESSAGES.CREATE_SUCCESS, data });
    });

    /** Danh sách Rules */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string, 10) || RULE_PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string, 10) || RULE_PAGINATION.DEFAULT_LIMIT;
            const isActive = req.query.is_active !== undefined
                ? req.query.is_active === 'true'
                : undefined;

            const result = await ClassificationRuleService.getAll(page, limit, isActive);
            res.status(200).json({ success: true, ...result });
    });

    /** Chi tiết Rule */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await ClassificationRuleService.getById(id);
            res.status(200).json({ success: true, data });
    });

    /** Cập nhật Rule */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await ClassificationRuleService.update(id, req.body);
            res.status(200).json({ success: true, message: RULE_MESSAGES.UPDATE_SUCCESS, data });
    });

    /** Xóa mềm Rule */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await ClassificationRuleService.delete(id);
            res.status(200).json({ success: true, message: RULE_MESSAGES.DELETE_SUCCESS });
    });
}
