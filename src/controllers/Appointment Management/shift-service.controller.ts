import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ShiftServiceService } from '../../services/Appointment Management/shift-service.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SHIFT_SERVICE_SUCCESS, SHIFT_SERVICE_ERRORS } from '../../constants/shift-service.constant';

/**
 * Controller quản lý liên kết ca khám – dịch vụ.
 * Chỉ parse request → gọi Service → trả response.
 */
export class ShiftServiceController {

    /**
     * POST /api/shift-services — Gán dịch vụ cho ca khám (đơn hoặc hàng loạt)
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { shift_id, facility_service_id, facility_service_ids } = req.body;

            // Hỗ trợ bulk: nếu truyền facility_service_ids (mảng)
            if (facility_service_ids && Array.isArray(facility_service_ids)) {
                const result = await ShiftServiceService.bulkCreate(shift_id, facility_service_ids);
                res.status(HTTP_STATUS.CREATED).json({
                    success: true,
                    message: SHIFT_SERVICE_SUCCESS.BULK_CREATED,
                    data: result.created,
                    total_requested: result.total_requested,
                });
                return;
            }

            // Tạo đơn
            if (!shift_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', SHIFT_SERVICE_ERRORS.MISSING_SHIFT_ID);
            }
            if (!facility_service_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_ID', SHIFT_SERVICE_ERRORS.MISSING_SERVICE_ID);
            }

            const data = await ShiftServiceService.create(shift_id, facility_service_id);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.CREATED,
                data,
            });
    });

    /**
     * GET /api/shift-services — Danh sách liên kết (filter)
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const shiftId = req.query.shift_id?.toString();
            const facilityServiceId = req.query.facility_service_id?.toString();

            const data = await ShiftServiceService.getAll(shiftId, facilityServiceId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.LIST_FETCHED,
                data,
            });
    });

    /**
     * GET /api/shift-services/by-shift/:shiftId
     */
    static getByShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const shiftId = req.params.shiftId as string;
            const data = await ShiftServiceService.getByShift(shiftId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.BY_SHIFT_FETCHED,
                data,
            });
    });

    /**
     * GET /api/shift-services/by-service/:facilityServiceId
     */
    static getByService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityServiceId = req.params.facilityServiceId as string;
            const data = await ShiftServiceService.getByService(facilityServiceId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.BY_SERVICE_FETCHED,
                data,
            });
    });

    /**
     * DELETE /api/shift-services/:id
     */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await ShiftServiceService.delete(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.DELETED,
            });
    });

    /**
     * PATCH /api/shift-services/:id/toggle
     */
    static toggle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { is_active } = req.body;
            if (is_active === undefined) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_IS_ACTIVE', 'Thiếu trạng thái is_active.');
            }
            const data = await ShiftServiceService.toggle(req.params.id as string, is_active);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.TOGGLED,
                data,
            });
    });
}
