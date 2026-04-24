import { AppError } from '../../utils/app-error.util';
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentAuditLogRepository } from '../../repository/Appointment Management/appointment-audit-log.repository';
import { NotificationEngineService } from '../Core/notification-engine.service';
import {
    CONFIRMABLE_STATUSES,
    CHECKIN_ALLOWED_STATUSES,
    COMPLETE_ALLOWED_STATUSES,
    CONFIRMATION_ERRORS,
    CONFIRMATION_SUCCESS,
    APPOINTMENT_TEMPLATE_CODES,
} from '../../constants/appointment-confirmation.constant';
import { APPOINTMENT_ERRORS, APPOINTMENT_STATUS } from '../../constants/appointment.constant';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger.config';



export class AppointmentConfirmationService {

    /**
     * Xác nhận 1 lịch khám: PENDING → CONFIRMED
     */
    static async confirmAppointment(appointmentId: string, userId: string): Promise<any> {
        // Lấy thông tin appointment kèm account_id bệnh nhân
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
            throw new AppError(400, 'NOT_PENDING', CONFIRMATION_ERRORS.NOT_PENDING);
        }


        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.PENDING,
            new_status: APPOINTMENT_STATUS.CONFIRMED,
            action_note: 'Xác nhận lịch khám',
        };

        // Cập nhật trạng thái
        const confirmed = await AppointmentRepository.confirmAppointment(appointmentId, userId, auditLog);
        if (!confirmed) {
            throw new AppError(400, 'CONFIRM_FAILED', CONFIRMATION_ERRORS.NOT_PENDING);
        }

        // Gửi thông báo cho bệnh nhân (fire-and-forget, không block response)
        this.sendNotificationSafe(appointment.account_id, APPOINTMENT_TEMPLATE_CODES.CONFIRMED, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
            doctor_name: appointment.doctor_name || 'Chưa chỉ định',
        });

        return confirmed;
    }

    /**
     * Xác nhận hàng loạt nhiều lịch khám
     */
    static async batchConfirm(appointmentIds: string[], userId: string): Promise<{
        succeeded: string[];
        failed: Array<{ id: string; reason: string }>;
    }> {
        if (!appointmentIds || appointmentIds.length === 0) {
            throw new AppError(400, 'MISSING_IDS', CONFIRMATION_ERRORS.MISSING_IDS);
        }

        const succeeded: string[] = [];
        const failed: Array<{ id: string; reason: string }> = [];

        for (const id of appointmentIds) {
            try {
                await this.confirmAppointment(id, userId);
                succeeded.push(id);
            } catch (error: any) {
                failed.push({
                    id,
                    reason: error.message || 'Lỗi không xác định',
                });
            }
        }

        return { succeeded, failed };
    }

    /**
     * Check-in lịch khám: CONFIRMED → CHECKED_IN
     * C1: Delegate sang AppointmentStatusService.checkInAtCounter() — đảm bảo 1 luồng check-in duy nhất
     * với đầy đủ STT, kiểm tra ngày, cảnh báo BS vắng
     */
    static async checkIn(appointmentId: string, userId: string): Promise<any> {
        const { AppointmentStatusService } = require('./appointment-status.service');
        return AppointmentStatusService.checkInAtCounter(appointmentId, userId);
    }

    /**
     * Tự động duyệt các lịch hẹn PENDING (cron job)
     */
    static async autoApprovePending(): Promise<{ total_approved: number }> {
        const { pool } = require('../../config/postgresdb');
        const { AppointmentStatusService } = require('./appointment-status.service');

        // Find pending appointments created at least 2 minutes ago
        const query = `
            SELECT appointments_id 
            FROM appointments 
            WHERE status = $1 
              AND created_at <= NOW() - INTERVAL '2 minutes'
              AND appointment_date >= CURRENT_DATE
        `;
        const { rows } = await pool.query(query, [APPOINTMENT_STATUS.PENDING]);

        let approvedCount = 0;
        for (const row of rows) {
            try {
                // Auto-confirm: dùng null cho changed_by vì 'SYSTEM_CRON' không phải user_id hợp lệ (FK constraint)
                const auditLog = {
                    appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
                    appointment_id: row.appointments_id,
                    changed_by: null as any,
                    old_status: APPOINTMENT_STATUS.PENDING,
                    new_status: APPOINTMENT_STATUS.CONFIRMED,
                    action_note: '[HỆ THỐNG] Tự động duyệt lịch hẹn sau 2 phút',
                };

                // Cập nhật trạng thái trực tiếp (bypass confirmAppointment vì nó dùng userId cho confirmed_by)
                const confirmQuery = `
                    UPDATE appointments
                    SET status = '${APPOINTMENT_STATUS.CONFIRMED}',
                        confirmed_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE appointments_id = $1 AND status = '${APPOINTMENT_STATUS.PENDING}'
                    RETURNING *;
                `;
                const confirmResult = await pool.query(confirmQuery, [row.appointments_id]);
                
                if (confirmResult.rows[0]) {
                    // Ghi audit log với changed_by = null
                    await AppointmentAuditLogRepository.create(auditLog);
                    
                    // Generate QR token automatically
                    try {
                        await AppointmentStatusService.generateQrToken(row.appointments_id);
                    } catch (qrErr: any) {
                        logger.error(`[AUTO_APPROVE] QR generation failed for ${row.appointments_id}:`, qrErr.message);
                    }
                    
                    approvedCount++;
                }
            } catch (err: any) {
                logger.error(`[AUTO_APPROVE] Failed to approve ${row.appointments_id}:`, err.message);
            }
        }

        return { total_approved: approvedCount };
    }

    /**
     * Gửi notification an toàn (fire-and-forget)
     */
    private static async sendNotificationSafe(
        accountId: string | null,
        templateCode: string,
        variables: Record<string, any>
    ): Promise<void> {
        if (!accountId) {
            logger.warn(`[NOTIFICATION] Bệnh nhân chưa có tài khoản, bỏ qua gửi thông báo template: ${templateCode}`);
            return;
        }

        try {
            await NotificationEngineService.triggerEvent({
                template_code: templateCode,
                target_user_id: accountId,
                variables,
            });
        } catch (error: any) {
            logger.error(`[NOTIFICATION] Lỗi gửi thông báo ${templateCode}:`, error.message);
        }
    }

    /**
     * Gửi lại email thông báo cho 1 appointment theo template code
     * Manual trigger từ FE button "Gửi lại email xác nhận"
     */
    static async resendNotification(
        appointmentId: string,
        templateCode?: string
    ): Promise<{ success: boolean; templateCode: string; targetEmail: string | null }> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Không tìm thấy lịch hẹn');
        }
        if (!appointment.account_id) {
            throw new AppError(400, 'NO_ACCOUNT', 'Bệnh nhân chưa có tài khoản — không thể gửi email');
        }

        // Auto-detect template theo status nếu không truyền
        const finalTemplate = templateCode || (() => {
            switch (appointment.status) {
                case APPOINTMENT_STATUS.PENDING: return APPOINTMENT_TEMPLATE_CODES.CREATED;
                case APPOINTMENT_STATUS.CONFIRMED: return APPOINTMENT_TEMPLATE_CODES.CONFIRMED;
                case APPOINTMENT_STATUS.COMPLETED: return APPOINTMENT_TEMPLATE_CODES.COMPLETED;
                case APPOINTMENT_STATUS.CANCELLED: return APPOINTMENT_TEMPLATE_CODES.CANCELLED;
                default: return APPOINTMENT_TEMPLATE_CODES.REMINDER;
            }
        })();

        await NotificationEngineService.triggerEvent({
            template_code: finalTemplate,
            target_user_id: appointment.account_id,
            variables: {
                patient_name: appointment.patient_name || 'Bệnh nhân',
                appointment_code: appointment.appointment_code,
                appointment_date: appointment.appointment_date,
                slot_time: (appointment as any).slot_time || '',
                doctor_name: appointment.doctor_name || 'Chưa chỉ định',
            },
        });

        return {
            success: true,
            templateCode: finalTemplate,
            targetEmail: (appointment as any).account_email || null,
        };
    }
}
