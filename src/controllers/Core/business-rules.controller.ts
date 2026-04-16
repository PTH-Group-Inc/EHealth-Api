import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BusinessRulesService } from '../../services/Core/business-rules.service';
import { UpdateBusinessRuleInput, BulkUpdateBusinessRulesInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class BusinessRulesController {
    /**
     * Lấy tất cả business rules, nhóm theo module
     */
    static getAllBusinessRules = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const module = req.query.module as string | undefined;
            const data = await BusinessRulesService.getAllBusinessRules(module);
            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy 1 business rule theo :ruleKey
     */
    static getBusinessRuleByKey = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { ruleKey } = req.params;
            const data = await BusinessRulesService.getBusinessRuleByKey(String(ruleKey));
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật 1 business rule theo :ruleKey (Admin only)
     */
    static updateBusinessRule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { ruleKey } = req.params;
            const input: UpdateBusinessRuleInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await BusinessRulesService.updateBusinessRule(String(ruleKey), input, updatedBy);
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật nhiều business rules cùng lúc (Admin only)
     */
    static bulkUpdateBusinessRules = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: BulkUpdateBusinessRulesInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await BusinessRulesService.bulkUpdateBusinessRules(input, updatedBy);
            res.status(200).json({ success: true, data });
    });
}
