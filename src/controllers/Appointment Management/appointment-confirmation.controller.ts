import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AppointmentConfirmationService } from '../../services/Appointment Management/appointment-confirmation.service';
import { AppointmentReminderService } from '../../services/Appointment Management/appointment-reminder.service';
import { CONFIRMATION_SUCCESS, CONFIRMATION_ERRORS } from '../../constants/appointment-confirmation.constant';
import { APPOINTMENT_ERRORS } from '../../constants/appointment.constant';

/**
 * Controller cho Module 3.6 – Xác nhận & Nhắc lịch khám
 * Chỉ xử lý HTTP Request/Response, delegate business logic cho Service
 */
export class AppointmentConfirmationController {

    // ======================= XÁC NHẬN LỊCH KHÁM =======================

    /**
     * Gửi lại email/notification cho appointment
     * POST /api/appointment-confirmations/:id/resend
     * Body (optional): { template_code: 'APPOINTMENT_CREATED' | 'APPOINTMENT_CONFIRMED' | ... }
     * Nếu không truyền template_code, BE auto-detect theo status
     */
    static resendNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const { template_code } = req.body || {};
            const result = await AppointmentConfirmationService.resendNotification(id, template_code);
            res.status(200).json({
                success: true,
                message: 'Đã gửi lại email/notification thành công',
                data: result,
            });
    });

    /** Xác nhận 1 lịch khám (PENDING → CONFIRMED) */
    static confirm = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const userId = (req as any).auth?.user_id;

            const result = await AppointmentConfirmationService.confirmAppointment(id, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.CONFIRMED,
                data: result,
            });
    });

    /** Xác nhận hàng loạt */
    static batchConfirm = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { appointment_ids } = req.body;
            const userId = (req as any).auth?.user_id;

            if (!appointment_ids || !Array.isArray(appointment_ids) || appointment_ids.length === 0) {
                res.status(400).json({
                    success: false,
                    code: 'MISSING_IDS',
                    message: CONFIRMATION_ERRORS.MISSING_IDS,
                });
                return;
            }

            const result = await AppointmentConfirmationService.batchConfirm(appointment_ids, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.BATCH_CONFIRMED,
                data: result,
            });
    });

    // ======================= CHECK-IN =======================

    /** Check-in lịch khám (CONFIRMED → CHECKED_IN) */
    static checkIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const userId = (req as any).auth?.user_id;

            const result = await AppointmentConfirmationService.checkIn(id, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.CHECKED_IN,
                data: result,
            });
    });

    // ======================= NHẮC LỊCH =======================

    /** Gửi nhắc lịch thủ công cho 1 lịch khám */
    static sendReminder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const userId = (req as any).auth?.user_id;

            const result = await AppointmentReminderService.sendManualReminder(id, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_SENT,
                data: result,
            });
    });

    /** Gửi nhắc lịch thủ công hàng loạt */
    static batchSendReminder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { appointment_ids } = req.body;
            const userId = (req as any).auth?.user_id;

            if (!appointment_ids || !Array.isArray(appointment_ids) || appointment_ids.length === 0) {
                res.status(400).json({
                    success: false,
                    code: 'MISSING_IDS',
                    message: CONFIRMATION_ERRORS.MISSING_IDS,
                });
                return;
            }

            const result = await AppointmentReminderService.batchSendReminder(appointment_ids, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.BATCH_REMINDER_SENT,
                data: result,
            });
    });

    /** Lấy lịch sử nhắc lịch của 1 appointment */
    static getReminderHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;

            const result = await AppointmentReminderService.getReminders(id);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_HISTORY_FETCHED,
                data: result,
            });
    });

    // ======================= CẤU HÌNH NHẮC LỊCH =======================

    /** Lấy cấu hình nhắc lịch hiện tại */
    static getReminderSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await AppointmentReminderService.getReminderSettings();
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_SETTINGS_FETCHED,
                data: result,
            });
    });

    /** Cập nhật cấu hình nhắc lịch */
    static updateReminderSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await AppointmentReminderService.updateReminderSettings(req.body);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_SETTINGS_UPDATED,
                data: result,
            });
    });
}
