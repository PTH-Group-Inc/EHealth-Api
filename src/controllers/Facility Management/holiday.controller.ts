// src/controllers/Facility Management/holiday.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { HolidayService } from '../../services/Facility Management/holiday.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class HolidayController {

    /**
     * Tạo mới ngày lễ
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await HolidayService.createHoliday(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Tạo ngày lễ thành công.', data });
    });

    /**
     * Lấy danh sách ngày lễ
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filters = {
                facilityId: req.query.facility_id ? String(req.query.facility_id) : undefined,
                year: req.query.year ? Number(req.query.year) : undefined,
                from: req.query.from ? String(req.query.from) : undefined,
                to: req.query.to ? String(req.query.to) : undefined,
            };
            const data = await HolidayService.getHolidays(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Chi tiết 1 ngày lễ
     */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await HolidayService.getHolidayById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Cập nhật ngày lễ
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await HolidayService.updateHoliday(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật ngày lễ thành công.', data });
    });

    /**
     * Xóa ngày lễ (Soft Delete)
     */
    static remove = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await HolidayService.deleteHoliday(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa ngày lễ thành công.' });
    });
}
