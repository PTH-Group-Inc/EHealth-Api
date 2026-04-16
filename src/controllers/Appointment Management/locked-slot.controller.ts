import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { LockedSlotService } from '../../services/Appointment Management/locked-slot.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { LOCKED_SLOT_SUCCESS } from '../../constants/locked-slot.constant';

/**
 * Controller khoá/mở khoá slot khám bệnh theo ngày.
 * Chỉ parse request → gọi Service → trả response.
 */
export class LockedSlotController {

    /**
     * POST /api/slots/lock — Khoá 1 hoặc nhiều slot theo ngày
     */
    static lockSlots = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await LockedSlotService.lockSlots(req.body, userId);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: LOCKED_SLOT_SUCCESS.LOCKED,
                data: result.locked,
                warning: result.affected_appointments > 0
                    ? `Có ${result.affected_appointments} lịch khám (PENDING/CONFIRMED) bị ảnh hưởng bởi việc khoá slot.`
                    : null,
                affected_appointments: result.affected_appointments,
            });
    });

    /**
     * GET /api/slots/locked — Lấy danh sách slot đã khoá
     */
    static getLockedSlots = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.query.date?.toString() || '';
            const shiftId = req.query.shift_id?.toString();
            const slotId = req.query.slot_id?.toString();

            const data = await LockedSlotService.getLockedSlots(date, shiftId, slotId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: LOCKED_SLOT_SUCCESS.LIST_FETCHED,
                data,
            });
    });

    /**
     * DELETE /api/slots/lock/:lockedSlotId — Mở khoá 1 slot
     */
    static unlockSlot = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const lockedSlotId = req.params.lockedSlotId as string;
            await LockedSlotService.unlockSlot(lockedSlotId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: LOCKED_SLOT_SUCCESS.UNLOCKED,
            });
    });

    /**
     * POST /api/slots/lock-by-shift — Khoá tất cả slot trong 1 ca
     */
    static lockByShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await LockedSlotService.lockByShift(req.body, userId);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: LOCKED_SLOT_SUCCESS.LOCKED_BY_SHIFT,
                data: result.locked,
                total_slots_in_shift: result.total_slots_in_shift,
                warning: result.affected_appointments > 0
                    ? `Có ${result.affected_appointments} lịch khám (PENDING/CONFIRMED) bị ảnh hưởng.`
                    : null,
                affected_appointments: result.affected_appointments,
            });
    });

    /**
     * DELETE /api/locked-slots/unlock-by-shift — Mở khoá tất cả slot trong 1 ca
     */
    static unlockByShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { shift_id, locked_date } = req.body;
            const result = await LockedSlotService.unlockByShift(shift_id, locked_date);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: LOCKED_SLOT_SUCCESS.UNLOCKED_BY_SHIFT,
                unlocked_count: result.unlocked_count,
            });
    });
}
