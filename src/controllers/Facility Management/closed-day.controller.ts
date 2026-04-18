// src/controllers/Facility Management/closed-day.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ClosedDayService } from '../../services/Facility Management/closed-day.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class ClosedDayController {

    /**
     * Tạo mới ngày nghỉ cố định
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await ClosedDayService.createClosedDay(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Tạo ngày nghỉ cố định thành công.', data });
    });

    /**
     * Lấy danh sách ngày nghỉ
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : undefined;
            const data = await ClosedDayService.getClosedDays(facilityId);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Xóa ngày nghỉ (Soft Delete)
     */
    static remove = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await ClosedDayService.deleteClosedDay(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa ngày nghỉ thành công.' });
    });
}
