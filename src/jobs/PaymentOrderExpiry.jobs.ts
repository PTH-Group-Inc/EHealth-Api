import cron from 'node-cron';
import { PaymentGatewayRepository } from '../repository/Billing/billing-payment-gateway.repository';
import logger from '../config/logger.config';


/**
 * Cron job: Tự động chuyển các lệnh thanh toán QR đã quá hạn sang EXPIRED
 */
export const startPaymentOrderExpiryJob = (): void => {
    cron.schedule('* * * * *', async () => {
        try {
            const expiredCount = await PaymentGatewayRepository.expirePendingOrders();
            if (expiredCount > 0) {
                logger.info(`[PaymentOrderExpiry] Đã chuyển ${expiredCount} lệnh thanh toán sang EXPIRED.`);
            }
        } catch (error) {
            logger.error('[PaymentOrderExpiry] Lỗi khi xử lý hết hạn:', error);
        }
    });
    logger.info('[PaymentOrderExpiry] Cron job đã khởi động (mỗi 1 phút).');
};
