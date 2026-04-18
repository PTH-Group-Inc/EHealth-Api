import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { FacilityService } from '../../services/Facility Management/facility.service';
import { FacilityController as FacilityDropdownController } from '../../controllers/Facility Management/facility.controller';
import { UpdateFacilityInfoInput } from '../../models/Facility Management/facility.model';

export class SystemFacilityController {
    /**
     * Lấy thông tin chi tiết cơ sở y tế
     */
    static getFacilityInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await FacilityService.getFacilityInfo();
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật thông tin cơ sở y tế (Admin only)
     */
    static updateFacilityInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: UpdateFacilityInfoInput = req.body;
            const data = await FacilityService.updateFacilityInfo(input);
            res.status(200).json({ success: true, data });
    });

    /**
     * Upload logo cơ sở y tế lên Cloudinary (Admin only)
     */
    static uploadLogo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    code: 'SYS_005',
                    message: 'Không tìm thấy file tải lên.',
                });
                return;
            }

            const data = await FacilityService.uploadLogo(req.file);
            res.status(200).json({ success: true, data });
    });
}

// Re-export controller cũ để không break existing route
export { FacilityDropdownController };
