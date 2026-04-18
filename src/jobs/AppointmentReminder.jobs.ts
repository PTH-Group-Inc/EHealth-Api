import { AppointmentReminderService } from '../services/Appointment Management/appointment-reminder.service';
import logger from '../config/logger.config';


/**
 * Cron Job nhắc lịch khám tự động.
 */
export class AppointmentReminderJob {
    private static intervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Khởi động job nhắc lịch tự động
     */
    static startReminderJob() {
        // Chạy ngay lần đầu sau 10 giây để đợi hệ thống khởi động hoàn tất
        setTimeout(() => {
            this.runReminder();
        }, 10000);

        // Sau đó chạy định kỳ mỗi 15 phút
        const INTERVAL_MS = 15 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runReminder();
        }, INTERVAL_MS);

        logger.info('📅 [CRON] Appointment Reminder Job đã khởi động (mỗi 15 phút).');
    }

    /**
     * Dừng job (khi cần restart hoặc shutdown)
     */
    static stopReminderJob() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('🛑 [CRON] Appointment Reminder Job đã dừng.');
        }
    }

    /**
     * Thực thi 1 lần quét nhắc lịch
     */
    private static async runReminder() {
        try {
            const result = await AppointmentReminderService.processAutoReminders();
            if (result.total_sent > 0) {
                logger.info(`✅ [CRON] Reminder Job: Đã gửi ${result.total_sent} nhắc lịch tự động.`);
            }
        } catch (error) {
            logger.error('❌ [CRON] Reminder Job Error:', error);
        }
    }
}
