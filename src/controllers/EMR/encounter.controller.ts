// src/controllers/EMR/encounter.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { EncounterService } from '../../services/EMR/encounter.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    ENCOUNTER_ERRORS,
    ENCOUNTER_SUCCESS,
    ENCOUNTER_CONFIG,
} from '../../constants/encounter.constant';


export class EncounterController {

    /**
     * POST /api/encounters — Tạo encounter walk-in / cấp cứu
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, doctor_id, room_id } = req.body;
            if (!patient_id || !doctor_id || !room_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS', ENCOUNTER_ERRORS.MISSING_REQUIRED_FIELDS);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.createEncounter(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: ENCOUNTER_SUCCESS.CREATED,
                data: encounter,
            });
    });

    /**
     * POST /api/encounters/from-appointment/:appointmentId — Tạo encounter từ lịch khám
     */
    static createFromAppointment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const appointmentId = req.params.appointmentId as string;
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.createFromAppointment(appointmentId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: ENCOUNTER_SUCCESS.CREATED_FROM_APPOINTMENT,
                data: encounter,
            });
    });

    /**
     * GET /api/encounters — Danh sách encounter
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filter = {
                patient_id: req.query.patient_id?.toString(),
                doctor_id: req.query.doctor_id?.toString(),
                room_id: req.query.room_id?.toString(),
                encounter_type: req.query.encounter_type?.toString(),
                status: req.query.status?.toString(),
                from_date: req.query.from_date?.toString(),
                to_date: req.query.to_date?.toString(),
                keyword: req.query.keyword?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : ENCOUNTER_CONFIG.DEFAULT_PAGE,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : ENCOUNTER_CONFIG.DEFAULT_LIMIT,
            };
            const result = await EncounterService.getEncounters(filter);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.LIST_FETCHED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
    });

    /**
     * GET /api/encounters/:id — Chi tiết encounter
     */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounter = await EncounterService.getEncounterById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.DETAIL_FETCHED,
                data: encounter,
            });
    });

    /**
     * PATCH /api/encounters/:id — Cập nhật encounter
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounter = await EncounterService.updateEncounter(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.UPDATED,
                data: encounter,
            });
    });

    /**
     * PATCH /api/encounters/:id/assign-doctor — Đổi bác sĩ phụ trách
     */
    static assignDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { doctor_id } = req.body;
            if (!doctor_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', ENCOUNTER_ERRORS.MISSING_DOCTOR_ID);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.assignDoctor(req.params.id as string, doctor_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.DOCTOR_ASSIGNED,
                data: encounter,
            });
    });

    /**
     * PATCH /api/encounters/:id/assign-room — Đổi phòng khám
     */
    static assignRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { room_id } = req.body;
            if (!room_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ROOM_ID', ENCOUNTER_ERRORS.MISSING_ROOM_ID);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.assignRoom(req.params.id as string, room_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.ROOM_ASSIGNED,
                data: encounter,
            });
    });

    /**
     * PATCH /api/encounters/:id/status — Chuyển trạng thái encounter
     */
    static changeStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { new_status } = req.body;
            if (!new_status) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_STATUS', ENCOUNTER_ERRORS.MISSING_STATUS);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.changeStatus(req.params.id as string, new_status, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.STATUS_CHANGED,
                data: encounter,
            });
    });

    /**
     * GET /api/encounters/by-patient/:patientId — DS encounter của 1 bệnh nhân
     */
    static getByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : ENCOUNTER_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : ENCOUNTER_CONFIG.DEFAULT_LIMIT;
            const result = await EncounterService.getByPatientId(patientId, page, limit);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.PATIENT_ENCOUNTERS_FETCHED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
    });

    /**
     * GET /api/encounters/by-appointment/:appointmentId — Lấy encounter từ appointment
     */
    static getByAppointment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounter = await EncounterService.getByAppointmentId(req.params.appointmentId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.APPOINTMENT_ENCOUNTER_FETCHED,
                data: encounter,
            });
    });

    /**
     * GET /api/encounters/active — DS encounter đang diễn ra
     */
    static getActive = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branchId = req.query.branch_id?.toString();
            const encounters = await EncounterService.getActiveEncounters(branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.ACTIVE_FETCHED,
                data: encounters,
            });
    });
}
