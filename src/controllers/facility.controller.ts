import { Request, Response, NextFunction } from 'express';
import { FacilityService } from '../services/facility.service';

export class FacilityController {
    /**
     * Get list of facilities for dropdown
     */
    static async getFacilitiesForDropdown(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilities = await FacilityService.getFacilitiesForDropdown();
            res.status(200).json({
                success: true,
                data: facilities
            });
        } catch (error) {
            next(error);
        }
    }
}
