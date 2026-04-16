// src/controllers/Facility Management/leave.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { LeaveService } from '../../services/Facility Management/leave.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';


export class LeaveController {

    /**
     * Tạo đơn nghỉ phép
     */
    static createLeave = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { start_date, end_date, reason } = req.body;
            const user_id = (req as any).auth?.user_id;

            if (!start_date || !end_date || !reason) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATA', 'Thiếu thông tin bắt buộc: start_date, end_date, reason.');
            }

            const leave = await LeaveService.createLeave({ user_id, start_date, end_date, reason });

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Tạo đơn xin nghỉ phép thành công',
                data: leave
            });
    });

    /**
     * Lấy danh sách đơn nghỉ phép
     */
    static getLeaves = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { user_id, status } = req.query;
            const filters = {
                user_id: user_id?.toString(),
                status: status?.toString()
            };

            const leaves = await LeaveService.getLeaves(filters);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy danh sách đơn nghỉ phép thành công',
                data: leaves
            });
    });

    /**
     * Xem chi tiết 1 đơn
     */
    static getLeaveById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const leave = await LeaveService.getLeaveById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: leave });
    });

    /**
     * Chỉnh sửa đơn (chỉ khi PENDING)
     */
    static updateLeave = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { start_date, end_date, reason } = req.body;
            const updated = await LeaveService.updateLeave(req.params.id as string, { start_date, end_date, reason });
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật đơn nghỉ phép thành công', data: updated });
    });

    /**
     * Hủy / rút đơn
     */
    static deleteLeave = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await LeaveService.deleteLeave(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã hủy đơn nghỉ phép thành công' });
    });

    /**
     * Admin duyệt đơn
     */
    static approveLeave = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const approverId = (req as any).auth?.user_id;
            const approverNote = req.body.approver_note as string | undefined;
            const updated = await LeaveService.approveLeave(req.params.id as string, approverId, approverNote);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã duyệt đơn nghỉ phép thành công', data: updated });
    });

    /**
     * Admin từ chối đơn
     */
    static rejectLeave = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const approverId = (req as any).auth?.user_id;
            const approverNote = req.body.approver_note as string;
            const updated = await LeaveService.rejectLeave(req.params.id as string, approverId, approverNote);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã từ chối đơn nghỉ phép', data: updated });
    });
}
