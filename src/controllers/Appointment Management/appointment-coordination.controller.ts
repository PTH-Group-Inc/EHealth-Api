// src/controllers/Appointment Management/appointment-coordination.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AppointmentCoordinationService } from '../../services/Appointment Management/appointment-coordination.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { COORDINATION_SUCCESS } from '../../constants/appointment-coordination.constant';


/**
 * Controller cho Module 3.9 — Điều phối & tối ưu lịch khám
 */
export class AppointmentCoordinationController {

    /** GET /api/appointment-coordination/doctor-load */
    static getDoctorLoad = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.query.date?.toString() || '';
            const branchId = req.query.branch_id?.toString();
            const specialtyId = req.query.specialty_id?.toString();
            const data = await AppointmentCoordinationService.getDoctorLoad(date, branchId, specialtyId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.DOCTOR_LOAD_FETCHED,
                data,
            });
    });

    /** GET /api/appointment-coordination/suggest-slots */
    static suggestSlots = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.query.date?.toString() || '';
            const doctorId = req.query.doctor_id?.toString();
            const specialtyId = req.query.specialty_id?.toString();
            const priority = req.query.priority?.toString();
            const data = await AppointmentCoordinationService.suggestSlots(date, doctorId, specialtyId, priority);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.SLOTS_SUGGESTED,
                data,
            });
    });

    /** GET /api/appointment-coordination/balance-overview */
    static getBalanceOverview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.query.date?.toString() || '';
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentCoordinationService.getBalanceOverview(date, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.BALANCE_FETCHED,
                data,
            });
    });

    /** PATCH /api/appointment-coordination/:appointmentId/priority */
    static setPriority = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const appointmentId = req.params.appointmentId?.toString();
            const { priority, reason } = req.body;
            const userId = (req as any).auth?.user_id;
            await AppointmentCoordinationService.setPriority(appointmentId, priority, reason, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.PRIORITY_SET,
            });
    });

    /** PATCH /api/appointment-coordination/:appointmentId/reassign-doctor */
    static reassignDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const appointmentId = req.params.appointmentId?.toString();
            const { new_doctor_id, reason } = req.body;
            const userId = (req as any).auth?.user_id;
            await AppointmentCoordinationService.reassignDoctor(appointmentId, new_doctor_id, reason, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.DOCTOR_REASSIGNED,
            });
    });

    /** POST /api/appointment-coordination/auto-assign */
    static autoAssign = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { date, specialty_id, branch_id } = req.body;
            const userId = (req as any).auth?.user_id;
            const data = await AppointmentCoordinationService.autoAssign(date, specialty_id, branch_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.AUTO_ASSIGNED,
                data,
            });
    });

    /** GET /api/appointment-coordination/ai-dataset */
    static getAIDataset = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const fromDate = req.query.from_date?.toString() || '';
            const toDate = req.query.to_date?.toString() || '';
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentCoordinationService.getAIDataset(fromDate, toDate, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.AI_DATASET_FETCHED,
                data,
            });
    });
}
