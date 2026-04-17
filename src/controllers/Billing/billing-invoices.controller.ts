import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingInvoiceService } from '../../services/Billing/billing-invoices.service';
import {
    BILLING_INVOICE_CONFIG,
} from '../../constants/billing-invoices.constant';

export class BillingInvoiceController {

    // INVOICES

    /** Tạo hóa đơn mới */
    static createInvoice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.createInvoice(req.body, userId);
            res.status(201).json({ success: true, message: 'Tạo hóa đơn thành công.', data });
    });

    /** Tạo HĐ tự động từ encounter */
    static generateInvoice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const encounterId = String(req.params.encounterId);
            const data = await BillingInvoiceService.generateInvoiceFromEncounter(encounterId, userId);
            res.status(201).json({ success: true, message: 'Tạo hóa đơn tự động thành công.', data });
    });

    /** Danh sách hóa đơn */
    static getInvoices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { facility_id, patient_id, status, date_from, date_to, search } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_INVOICE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_INVOICE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingInvoiceService.getInvoices(
                facility_id as string, patient_id as string, status as string,
                date_from as string, date_to as string, search as string,
                page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết hóa đơn */
    static getInvoiceById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getInvoiceById(String(req.params.invoiceId));
            res.json({ success: true, data });
    });

    /** Cập nhật hóa đơn */
    static updateInvoice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.updateInvoice(String(req.params.invoiceId), req.body, userId);
            res.json({ success: true, message: 'Cập nhật hóa đơn thành công.', data });
    });

    /** Hủy hóa đơn */
    static cancelInvoice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const { reason } = req.body;
            const data = await BillingInvoiceService.cancelInvoice(String(req.params.invoiceId), reason, userId);
            res.json({ success: true, message: 'Hủy hóa đơn thành công.', data });
    });

    /** Lấy HĐ theo encounter */
    static getByEncounter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getInvoiceByEncounter(String(req.params.encounterId));
            res.json({ success: true, data });
    });

    /** Lịch sử HĐ bệnh nhân */
    static getByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_INVOICE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_INVOICE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingInvoiceService.getInvoicesByPatient(String(req.params.patientId), page, limit);
            res.json({ success: true, ...data });
    });

    // INVOICE DETAILS

    /** Thêm dòng chi tiết */
    static addItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.addInvoiceItem(String(req.params.invoiceId), req.body, userId);
            res.status(201).json({ success: true, message: 'Thêm dòng chi tiết thành công.', data });
    });

    /** Sửa dòng chi tiết */
    static updateItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.updateInvoiceItem(
                String(req.params.invoiceId), String(req.params.itemId), req.body, userId
            );
            res.json({ success: true, message: 'Cập nhật dòng chi tiết thành công.', data });
    });

    /** Xóa dòng chi tiết */
    static deleteItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            await BillingInvoiceService.deleteInvoiceItem(String(req.params.invoiceId), String(req.params.itemId), userId);
            res.json({ success: true, message: 'Xóa dòng chi tiết thành công.' });
    });

    /** Tính lại tổng tiền */
    static recalculate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.recalculateInvoice(String(req.params.invoiceId));
            res.json({ success: true, message: 'Tính lại tổng tiền thành công.', data });
    });

    // PAYMENTS

    /** Ghi nhận thanh toán */
    static createPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.processPayment(req.body, cashierId);
            res.status(201).json({ success: true, message: 'Ghi nhận thanh toán thành công.', data });
    });

    /** Chi tiết giao dịch */
    static getPaymentDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getPaymentById(String(req.params.paymentId));
            res.json({ success: true, data });
    });

    /** Giao dịch theo HĐ */
    static getPaymentsByInvoice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getPaymentsByInvoice(String(req.params.invoiceId));
            res.json({ success: true, data });
    });

    /** Hoàn tiền */
    static refund = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.processRefund(String(req.params.paymentId), req.body, cashierId);
            res.status(201).json({ success: true, message: 'Hoàn tiền thành công.', data });
    });

    // CASHIER SHIFTS

    /** Mở ca thu ngân */
    static openShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.openShift(req.body, cashierId);
            res.status(201).json({ success: true, message: 'Mở ca thu ngân thành công.', data });
    });

    /** Đóng ca thu ngân */
    static closeShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.closeShift(String(req.params.shiftId), req.body, cashierId);
            res.json({ success: true, message: 'Đóng ca thu ngân thành công.', data });
    });

    /** Chi tiết ca */
    static getShiftDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getShiftById(String(req.params.shiftId));
            res.json({ success: true, data });
    });

    /** Danh sách ca */
    static getShifts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { cashier_id, status, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_INVOICE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_INVOICE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingInvoiceService.getShifts(
                cashier_id as string, status as string, date_from as string, date_to as string,
                page, limit
            );
            res.json({ success: true, ...data });
    });

    // STATISTICS & INSURANCE

    /** Thống kê doanh thu */
    static getRevenueSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getRevenueSummary(
                String(req.params.facilityId),
                req.query.date_from as string,
                req.query.date_to as string
            );
            res.json({ success: true, data });
    });

    /** Thông tin claim BHYT */
    static getInsuranceClaim = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingInvoiceService.getInsuranceClaim(String(req.params.invoiceId));
            res.json({ success: true, data });
    });
}
