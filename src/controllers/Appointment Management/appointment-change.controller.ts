// src/controllers/Appointment Management/appointment-change.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AppointmentChangeService } from '../../services/Appointment Management/appointment-change.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { CHANGE_SUCCESS, CHANGE_ERRORS } from '../../constants/appointment-change.constant';


export class AppointmentChangeController {

    /** POST /api/appointment-changes */
    static createAutoApprovedReschedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { appointmentId, newDate, newSlotId, reason } = req.body;
        const requestedBy = (req as any).auth?.user_id;

        const data = await AppointmentChangeService.createAndAutoApproveRescheduleRequest({
            appointmentId,
            newDate,
            newSlotId,
            reason,
            requestedBy,
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: CHANGE_SUCCESS.RESCHEDULE_REQUEST_CREATED,
            data,
        });
    });


    static getHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const appointmentId = req.params.appointmentId?.toString();
            const data = await AppointmentChangeService.getHistory(appointmentId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.HISTORY_FETCHED,
                data,
            });
    });

    /** GET /api/appointment-changes/stats */
    static getStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();
            const branchId = req.query.branch_id?.toString();

            if (!fromDate || !toDate) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', CHANGE_ERRORS.INVALID_DATE_RANGE);
            }

            const data = await AppointmentChangeService.getStats(fromDate, toDate, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.STATS_FETCHED,
                data,
            });
    });

    /** POST /api/appointment-changes/:appointmentId/check-cancel-policy */
    static checkCancelPolicy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const appointmentId = req.params.appointmentId?.toString();
            const data = await AppointmentChangeService.checkCancelPolicy(appointmentId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.POLICY_CHECKED,
                data,
            });
    });

    /** GET /api/appointment-changes/recent */
    static getRecentChanges = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filters = {
                change_type: req.query.change_type?.toString(),
                branch_id: req.query.branch_id?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentChangeService.getRecentChanges(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.RECENT_FETCHED,
                data: result.data,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / filters.limit),
                },
            });
    });

    /** GET /api/appointment-changes/:appointmentId/can-reschedule */
    static canReschedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const appointmentId = req.params.appointmentId?.toString();
            const data = await AppointmentChangeService.canReschedule(appointmentId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.CAN_RESCHEDULE_CHECKED,
                data,
            });
    });
}
