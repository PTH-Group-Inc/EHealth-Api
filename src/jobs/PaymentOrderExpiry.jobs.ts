import cron from 'node-cron';
import { PaymentGatewayRepository } from '../repository/Billing/billing-payment-gateway.repository';
import { BillingInvoiceRepository } from '../repository/Billing/billing-invoices.repository';
import { AppointmentService } from '../services/Appointment Management/appointment.service';
import logger from '../config/logger.config';


/**
 * Cron job: Tự động chuyển các lệnh thanh toán QR đã quá hạn sang EXPIRED
 */
export const startPaymentOrderExpiryJob = (): void => {
    cron.schedule('* * * * *', async () => {
        try {
            const expiredOrders = await PaymentGatewayRepository.expirePendingOrders();
            if (expiredOrders.length > 0) {
                logger.info(`[PaymentOrderExpiry] Đã chuyển ${expiredOrders.length} lệnh thanh toán sang EXPIRED.`);
                
                // Xử lý auto-cancel appointment cho pre-book
                const results = await Promise.allSettled(expiredOrders.map(async (order) => {
                    const invoice = await BillingInvoiceRepository.getInvoiceById(order.invoice_id);
                    if (invoice && invoice.items && invoice.items.length > 0) {
                        const appointmentItem = invoice.items.find(item => item.reference_type === 'APPOINTMENT');
                        if (appointmentItem && appointmentItem.reference_id) {
                            await AppointmentService.cancelAppointment(
                                appointmentItem.reference_id,
                                'Quá hạn thanh toán (Auto-cancel)',
                                'SYSTEM'
                            );
                            logger.info(`[PaymentOrderExpiry] Đã hủy appointment ${appointmentItem.reference_id} do quá hạn thanh toán.`);
                        }
                    }
                }));

                const failed = results.filter(r => r.status === 'rejected');
                if (failed.length > 0) {
                    logger.error(`[PaymentOrderExpiry] Lỗi khi xử lý hủy appointment cho các order hết hạn:`, failed.map(f => (f as PromiseRejectedResult).reason));
                }
            }
        } catch (error) {
            logger.error('[PaymentOrderExpiry] Lỗi khi xử lý hết hạn:', error);
        }
    });
    logger.info('[PaymentOrderExpiry] Cron job đã khởi động (mỗi 1 phút).');
};
