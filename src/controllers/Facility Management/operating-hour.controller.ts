// src/controllers/Facility Management/operating-hour.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { OperatingHourService } from '../../services/Facility Management/operating-hour.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class OperatingHourController {

    /**
     * Tạo mới cấu hình giờ hoạt động
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await OperatingHourService.createOperatingHour(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Tạo giờ hoạt động thành công.', data });
    });

    /**
     * Lấy danh sách giờ hoạt động
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : undefined;
            const data = await OperatingHourService.getOperatingHours(facilityId);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Lấy chi tiết 1 cấu hình
     */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await OperatingHourService.getOperatingHourById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    /**
     * Cập nhật giờ hoạt động
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await OperatingHourService.updateOperatingHour(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật giờ hoạt động thành công.', data });
    });

    /**
     * Xóa cấu hình giờ hoạt động (Soft Delete)
     */
    static remove = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await OperatingHourService.deleteOperatingHour(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa giờ hoạt động thành công.' });
    });
}
