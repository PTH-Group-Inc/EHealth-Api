import { Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { SecuritySettingsService } from '../../services/Core/security-settings.service';
import { UpdateSecurityConfigInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class SecuritySettingsController {
    /**
     * Lấy cấu hình bảo mật hiện tại
     */
    static getSecurityConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await SecuritySettingsService.getSecurityConfig();
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật cấu hình bảo mật (partial update)
     */
    static updateSecurityConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: UpdateSecurityConfigInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await SecuritySettingsService.updateSecurityConfig(input, updatedBy);
            res.status(200).json({ success: true, data });
    });
}
