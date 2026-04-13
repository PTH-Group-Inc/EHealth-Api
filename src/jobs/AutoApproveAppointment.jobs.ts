import { AppointmentConfirmationService } from '../services/Appointment Management/appointment-confirmation.service';

/**
 * Cron Job tự động duyệt các lịch hẹn PENDING.
 */
export class AutoApproveAppointmentJob {
    private static intervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Khởi động job duyệt lịch tự động
     */
    static startJob() {
        // Chạy lần đầu sau 15 giây
        setTimeout(() => {
            this.runAutoApprove();
        }, 15000);

        // Chạy lặp lại mỗi 2 phút
        const INTERVAL_MS = 2 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runAutoApprove();
        }, INTERVAL_MS);
    }

    /**
     * Dừng job
     */
    static stopJob() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 [CRON] Auto-Approve Job đã dừng.');
        }
    }

    /**
     * Thực thi quét và duyệt
     */
    private static async runAutoApprove() {
        try {
            const result = await AppointmentConfirmationService.autoApprovePending();
            if (result.total_approved > 0) {
                console.log(`✅ [CRON] Auto-Approve: Đã tự động duyệt ${result.total_approved} lịch hẹn.`);
            }
        } catch (error) {
            console.error('❌ [CRON] Auto-Approve Error:', error);
        }
    }
}
