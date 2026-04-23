import cron from 'node-cron';
import { AppointmentStatusRepository } from '../repository/Appointment Management/appointment-status.repository';
import logger from '../config/logger.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cron job: Tự động quét và chuyển các lịch khám quá hẹn sang NO_SHOW
 */
export const startAppointmentNoShowJob = (): void => {
    // Chạy mỗi 5 phút một lần để check
    cron.schedule('*/5 * * * *', async () => {
        try {
            // Buffer: 10 phút sau khi slot khám kết thúc
            const bufferMinutes = 10;
            const expiredAppointments = await AppointmentStatusRepository.findExpiredForNoShow(bufferMinutes);

            if (expiredAppointments.length > 0) {
                logger.info(`[AppointmentNoShow] Tìm thấy ${expiredAppointments.length} lịch khám quá hạn (chưa check-in). Bắt đầu chuyển NO_SHOW...`);
                
                for (const appt of expiredAppointments) {
                    const auditLog = {
                        appointment_audit_logs_id: uuidv4(),
                        appointment_id: appt.appointments_id,
                        old_status: appt.status,
                        new_status: 'NO_SHOW',
                        action_note: `System Auto: Tự động đánh dấu NO_SHOW vì bệnh nhân không có mặt sau khi ca khám kết thúc ${bufferMinutes} phút.`
                    };
                    
                    await AppointmentStatusRepository.markNoShow(appt.appointments_id, auditLog);
                    logger.info(`[AppointmentNoShow] Lịch hẹn ${appt.appointment_code} đã được chuyển sang NO_SHOW tự động.`);
                }
            }
        } catch (error) {
            logger.error('[AppointmentNoShow] Lỗi khi xử lý quét NO_SHOW tự động:', error);
        }
    });

    logger.info('[AppointmentNoShow] Cron job đã khởi động (chạy mỗi 5 phút). Quét NO_SHOW với buffer 10 phút.');
};
