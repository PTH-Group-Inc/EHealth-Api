// src/controllers/Facility Management/facility-status.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { FacilityStatusService } from '../../services/Facility Management/facility-status.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class FacilityStatusController {

    /**
     * Trạng thái cơ sở hôm nay
     */
    static getToday = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : '';
            const data = await FacilityStatusService.getStatusToday(facilityId);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Trạng thái cơ sở theo ngày
     */
    static getByDate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : '';
            const dateStr = req.params.date as string;
            const data = await FacilityStatusService.getStatusByDate(facilityId, dateStr);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Calendar 1 tháng
     */
    static getCalendar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : '';
            const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
            const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
            const data = await FacilityStatusService.getCalendar(facilityId, month, year);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });
}
