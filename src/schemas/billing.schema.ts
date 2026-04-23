import { z } from 'zod';

export const createInvoiceSchema = z.object({
    patient_id: z.string().min(1, 'Patient ID không được để trống'),
    encounter_id: z.string().optional(),
    facility_id: z.string().optional(),
    notes: z.string().optional()
});

export const updateInvoiceSchema = z.object({
    discount_amount: z.number().nonnegative().optional(),
    notes: z.string().optional()
});

export const cancelInvoiceSchema = z.object({
    reason: z.string().min(1, 'Lý do hủy không được để trống')
});

export const processOfflinePaymentSchema = z.object({
    invoice_id: z.string().min(1, 'Invoice ID không được để trống'),
    payment_method: z.enum(['CASH', 'CREDIT_CARD', 'BANK_TRANSFER'], {
        message: 'Phương thức thanh toán không hợp lệ'
    }),
    amount: z.number().positive('Số tiền thanh toán phải lớn hơn 0'),
    terminal_id: z.string().optional(),
    approval_code: z.string().optional(),
    card_last_four: z.string().optional(),
    card_brand: z.enum(['VISA', 'MASTERCARD', 'JCB', 'NAPAS', 'UNKNOWN']).optional(),
    notes: z.string().optional()
});

export const addItemSchema = z.object({
    reference_type: z.enum(['CONSULTATION', 'LAB_ORDER', 'DRUG']),
    reference_id: z.string().min(1, 'Reference ID không được để trống'),
    item_name: z.string().min(1, 'Tên dịch vụ không được để trống'),
    quantity: z.number().int().positive('Số lượng phải lớn hơn 0'),
    unit_price: z.number().nonnegative('Đơn giá không được âm'),
    discount_amount: z.number().nonnegative().optional(),
    insurance_covered: z.number().nonnegative().optional(),
    notes: z.string().optional()
});

export const updateItemSchema = z.object({
    quantity: z.number().int().positive().optional(),
    unit_price: z.number().nonnegative().optional(),
    discount_amount: z.number().nonnegative().optional(),
    insurance_covered: z.number().nonnegative().optional()
});

export const createPaymentSchema = z.object({
    invoice_id: z.string().min(1, 'Invoice ID không được để trống'),
    payment_method: z.enum(['CASH', 'CREDIT_CARD', 'VNPAY', 'MOMO']),
    amount: z.number().positive('Số tiền phải lớn hơn 0'),
    gateway_transaction_id: z.string().optional(),
    notes: z.string().optional()
});

export const refundPaymentSchema = z.object({
    amount: z.number().positive('Số tiền hoàn phải lớn hơn 0'),
    refund_reason: z.string().min(1, 'Lý do hoàn tiền không được để trống'),
    payment_method: z.enum(['CASH', 'CREDIT_CARD', 'VNPAY', 'MOMO']).optional()
});
