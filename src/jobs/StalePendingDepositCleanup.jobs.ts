import cron from 'node-cron';
import { pool } from '../config/postgresdb';
import { AppointmentService } from '../services/Appointment Management/appointment.service';
import logger from '../config/logger.config';
import { PRE_BOOKING_CONFIG } from '../constants/appointment.constant';

/**
 * Cron job: Dọn dẹp các lịch khám PENDING_DEPOSIT đã quá hạn.
 *
 * Threshold = PRE_BOOKING_CONFIG.PAYMENT_TIMEOUT_MINUTES + 5 phút buffer
 *   → Cho PaymentOrderExpiry chạy trước (nó dùng expires_at của QR).
 *   → Job này là safety-net cho các trường hợp PaymentOrderExpiry bỏ sót:
 *     1. QR chưa kịp tạo (generateQR lỗi) → appointment PENDING_DEPOSIT nhưng ko có payment_order
 *     2. PaymentOrderExpiry cancel thất bại (cancel policy block, DB lỗi)
 *     3. Race condition / duplicate request tạo appointment mà ko cleanup
 *
 * Schedule: Mỗi 5 phút
 */

/** Buffer thêm sau PAYMENT_TIMEOUT để PaymentOrderExpiry có cơ hội chạy trước */
const BUFFER_MINUTES = 5;
const STALE_THRESHOLD_MINUTES = PRE_BOOKING_CONFIG.PAYMENT_TIMEOUT_MINUTES + BUFFER_MINUTES;

export const startStalePendingDepositCleanupJob = (): void => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await pool.query(`
                SELECT appointments_id, appointment_code, created_at
                FROM appointments
                WHERE status = 'PENDING_DEPOSIT'
                  AND created_at < NOW() - INTERVAL '${STALE_THRESHOLD_MINUTES} minutes'
                ORDER BY created_at ASC
                LIMIT 50
            `);

            const staleAppointments = result.rows;
            if (staleAppointments.length === 0) return;

            logger.info(`[StalePendingDepositCleanup] Phát hiện ${staleAppointments.length} lịch PENDING_DEPOSIT quá hạn (> ${STALE_THRESHOLD_MINUTES} phút).`);

            let successCount = 0;
            let failCount = 0;

            const results = await Promise.allSettled(
                staleAppointments.map(async (apt: any) => {
                    await AppointmentService.cancelAppointment(
                        apt.appointments_id,
                        `Tự động hủy: Quá hạn đặt cọc ${PRE_BOOKING_CONFIG.PAYMENT_TIMEOUT_MINUTES} phút (${apt.appointment_code})`,
                        'SYSTEM',
                        ['ADMIN']
                    );
                    return apt.appointments_id;
                })
            );

            for (const r of results) {
                if (r.status === 'fulfilled') {
                    successCount++;
                    logger.info(`[StalePendingDepositCleanup] ✓ Đã hủy appointment ${r.value}`);
                } else {
                    failCount++;
                    const reason = r.reason?.message || r.reason;
                    if (String(reason).includes('ALREADY_CANCELLED')) {
                        logger.debug(`[StalePendingDepositCleanup] Appointment đã được hủy trước đó, bỏ qua.`);
                    } else {
                        logger.error(`[StalePendingDepositCleanup] ✗ Lỗi hủy appointment:`, reason);
                    }
                }
            }

            logger.info(`[StalePendingDepositCleanup] Kết quả: ${successCount} thành công, ${failCount} lỗi.`);

        } catch (error) {
            logger.error('[StalePendingDepositCleanup] Lỗi khi chạy cleanup:', error);
        }
    });

    logger.info(`[StalePendingDepositCleanup] Cron job đã khởi động (mỗi 5 phút, threshold ${STALE_THRESHOLD_MINUTES} phút = ${PRE_BOOKING_CONFIG.PAYMENT_TIMEOUT_MINUTES} phút timeout + ${BUFFER_MINUTES} phút buffer).`);
};
