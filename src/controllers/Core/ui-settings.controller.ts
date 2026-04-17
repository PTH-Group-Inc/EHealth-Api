import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { UiSettingsService } from '../../services/Core/ui-settings.service';
import { UpdateUiSettingsInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class UiSettingsController {
    /**
     * GET /api/system/ui-settings
     */
    static getUiSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await UiSettingsService.getUiSettings();
            res.status(200).json({ success: true, data });
    });

    /**
     * PUT /api/system/ui-settings (Admin only)
     */
    static updateUiSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: UpdateUiSettingsInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await UiSettingsService.updateUiSettings(input, updatedBy);
            res.status(200).json({ success: true, data });
    });
}
