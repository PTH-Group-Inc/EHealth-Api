// src/controllers/Appointment Management/appointment-status.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AppointmentStatusService } from '../../services/Appointment Management/appointment-status.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { STATUS_SUCCESS } from '../../constants/appointment-status.constant';


export class AppointmentStatusController {

    /** POST /api/appointment-status/:id/check-in — Check-in tại quầy */
    static checkIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.checkInAtCounter(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.CHECKED_IN,
                data: result,
            });
    });

    /** POST /api/appointment-status/:id/check-in-test — Check-in TEST (bỏ qua kiểm tra ngày) */
    static checkInTest = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.checkInTest(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: '[TEST] ' + STATUS_SUCCESS.CHECKED_IN,
                data: result,
            });
    });

    /** POST /api/appointment-status/generate-qr/:id — Sinh QR token */
    static generateQr = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await AppointmentStatusService.generateQrToken(req.params.id.toString());
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QR_GENERATED,
                data: result,
            });
    });

    /** POST /api/appointment-status/check-in-qr — Check-in bằng QR */
    static checkInQr = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { qr_token } = req.body;
            const result = await AppointmentStatusService.checkInByQr(qr_token);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QR_CHECKED_IN,
                data: result,
            });
    });

    /** PATCH /api/appointment-status/:id/start-exam — Bắt đầu khám */
    static startExam = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.startExam(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.EXAM_STARTED,
                data: result,
            });
    });

    /** PATCH /api/appointment-status/:id/complete-exam — Hoàn tất khám */
    static completeExam = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.completeExam(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.EXAM_COMPLETED,
                data: result,
            });
    });

    /** PATCH /api/appointment-status/:id/no-show — Đánh dấu No-Show */
    static markNoShow = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const { note } = req.body;
            const result = await AppointmentStatusService.markNoShow(req.params.id.toString(), userId, note);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.NO_SHOW_MARKED,
                data: result,
            });
    });

    /** GET /api/appointment-status/dashboard/today — Dashboard hôm nay */
    static getDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentStatusService.getDashboardToday(branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.DASHBOARD_FETCHED,
                data,
            });
    });

    /** GET /api/appointment-status/dashboard/:date — Dashboard theo ngày */
    static getDashboardByDate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.params.date?.toString();
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentStatusService.getDashboardByDate(date, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.DASHBOARD_FETCHED,
                data,
            });
    });

    /** GET /api/appointment-status/queue/today — Hàng đợi hôm nay */
    static getQueue = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filters = {
                branch_id: req.query.branch_id?.toString(),
                room_id: req.query.room_id?.toString(),
                status: req.query.status?.toString(),
            };
            const data = await AppointmentStatusService.getQueueToday(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QUEUE_FETCHED,
                data,
            });
    });

    /** GET /api/appointment-status/room-status — Trạng thái phòng khám */
    static getRoomStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentStatusService.getRoomStatus(branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.ROOM_STATUS_FETCHED,
                data,
            });
    });

    /** GET /api/appointment-status/settings — Lấy cấu hình */
    static getSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await AppointmentStatusService.getSettings();
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.SETTINGS_FETCHED,
                data,
            });
    });

    /** PUT /api/appointment-status/settings — Cập nhật cấu hình */
    static updateSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await AppointmentStatusService.updateSettings(req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.SETTINGS_UPDATED,
                data,
            });
    });

    /** PATCH /api/appointment-status/:id/skip — Bỏ qua BN trong hàng đợi */
    static skipPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.skipPatient(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QUEUE_SKIPPED,
                data: result,
            });
    });

    /** PATCH /api/appointment-status/:id/recall — Gọi lại BN đã skip */
    static recallPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.recallPatient(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QUEUE_RECALLED,
                data: result,
            });
    });
}
