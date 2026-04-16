import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ConfigPermissionsService } from '../../services/Core/config-permissions.service';
import { UpdateConfigPermissionsInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class ConfigPermissionsController {
    /** GET /api/system/config-permissions */
    static getConfigPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await ConfigPermissionsService.getConfigPermissions();
            res.status(200).json({ success: true, data });
    });

    /** PUT /api/system/config-permissions */
    static updateConfigPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: UpdateConfigPermissionsInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await ConfigPermissionsService.updateConfigPermissions(input, updatedBy);
            res.status(200).json({ success: true, data });
    });
}
