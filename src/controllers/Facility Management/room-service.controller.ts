import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { RoomServiceService } from '../../services/Facility Management/room-service.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ROOM_SERVICE_SUCCESS } from '../../constants/room-service.constant';

/**
 * Controller quản lý mapping phòng ↔ dịch vụ.
 */
export class RoomServiceController {

    /**
     * POST /api/medical-rooms/:roomId/services — Gán dịch vụ cho phòng
     */
    static assignServices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const roomId = req.params.roomId as string;
            const { facility_service_ids } = req.body;

            const result = await RoomServiceService.assignServices(roomId, facility_service_ids);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_SERVICE_SUCCESS.ASSIGNED,
                data: result,
            });
    });

    /**
     * GET /api/medical-rooms/:roomId/services — Xem dịch vụ đã gán
     */
    static getServicesByRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const roomId = req.params.roomId as string;
            const data = await RoomServiceService.getServicesByRoom(roomId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_SERVICE_SUCCESS.LIST_FETCHED,
                data,
            });
    });

    /**
     * DELETE /api/medical-rooms/:roomId/services/:facilityServiceId — Gỡ dịch vụ
     */
    static removeService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const roomId = req.params.roomId as string;
            const facilityServiceId = req.params.facilityServiceId as string;

            await RoomServiceService.removeService(roomId, facilityServiceId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_SERVICE_SUCCESS.REMOVED,
            });
    });
}
