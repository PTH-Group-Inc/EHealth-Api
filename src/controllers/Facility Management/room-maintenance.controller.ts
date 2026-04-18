import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { RoomMaintenanceService } from '../../services/Facility Management/room-maintenance.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ROOM_MAINTENANCE_SUCCESS } from '../../constants/room-maintenance.constant';

/**
 * Controller quản lý lịch bảo trì phòng.
 */
export class RoomMaintenanceController {

    /**
     * POST /api/room-maintenance/:roomId — Tạo lịch bảo trì
     */
    static createMaintenance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const roomId = req.params.roomId as string;
            const createdBy = (req as any).auth?.user_id;
            const { start_date, end_date, reason } = req.body;

            const data = await RoomMaintenanceService.createMaintenance(
                roomId, start_date, end_date, reason || null, createdBy
            );

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.CREATED,
                data,
            });
    });

    /**
     * GET /api/room-maintenance/:roomId — Lịch bảo trì của phòng
     */
    static getMaintenanceByRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const roomId = req.params.roomId as string;
            const data = await RoomMaintenanceService.getMaintenanceByRoom(roomId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.LIST_FETCHED,
                data,
            });
    });

    /**
     * DELETE /api/room-maintenance/schedule/:maintenanceId — Huỷ lịch bảo trì
     */
    static deleteMaintenance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const maintenanceId = req.params.maintenanceId as string;
            await RoomMaintenanceService.deleteMaintenance(maintenanceId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.DELETED,
            });
    });

    /**
     * GET /api/room-maintenance/active — DS phòng đang/sắp bảo trì
     */
    static getActiveMaintenances = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await RoomMaintenanceService.getActiveMaintenances();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.ACTIVE_FETCHED,
                data,
            });
    });
}
