import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { SystemSettingsService } from '../../services/Core/system-settings.service';
import { UpdateWorkingHoursInput, UpdateSlotConfigInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class SystemSettingsController {
    /**
     * Lấy cấu hình giờ làm việc 7 ngày trong tuần
     */
    static getWorkingHours = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await SystemSettingsService.getWorkingHours();
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật cấu hình giờ làm việc (Admin only)
     */
    static updateWorkingHours = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: UpdateWorkingHoursInput = req.body;
            const data = await SystemSettingsService.updateWorkingHours(input);
            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy cấu hình slot khám bệnh
     */
    static getSlotConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await SystemSettingsService.getSlotConfig();
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật cấu hình slot khám bệnh (Admin only)
     */
    static updateSlotConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: UpdateSlotConfigInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await SystemSettingsService.updateSlotConfig(input, updatedBy);
            res.status(200).json({ success: true, data });
    });
}
