import { CreateAppointmentInput } from './appointment.model';

/**
 * Trạng thái thanh toán của một lịch khám (Polling status)
 */
export interface PaymentStatusResult {
    appointment_id: string;
    status: string;
    is_paid: boolean;
    qr_code_url: string | null;
    expires_at: Date | null;
}

/**
 * Thông tin trả về sau khi request Pre-Book
 */
export interface PreBookResult {
    appointment_id: string;
    invoice_id: string;
    payment_order_id: string;
    qr_code_url: string;
    expires_at: Date;
    net_amount: number;
}
