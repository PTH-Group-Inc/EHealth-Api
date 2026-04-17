import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingOfflinePaymentService } from '../../services/Billing/billing-offline-payment.service';
import { OFFLINE_PAYMENT_CONFIG } from '../../constants/billing-offline-payment.constant';


export class BillingOfflinePaymentController {

    // ═══ NHÓM 1: THANH TOÁN TẠI QUẦY ═══

    /** Thanh toán tại quầy */
    static processPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingOfflinePaymentService.processOfflinePayment(req.body, cashierId);
            res.status(201).json({ success: true, message: 'Thanh toán tại quầy thành công.', data });
    });

    /** Hủy giao dịch (VOID) */
    static voidTransaction = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingOfflinePaymentService.voidTransaction(
                String(req.params.transactionId), req.body, cashierId
            );
            res.json({ success: true, message: 'Hủy giao dịch thành công.', data });
    });

    /** Danh sách giao dịch tại quầy */
    static getTransactions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { shift_id, cashier_id, payment_method, terminal_id, status, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_LIMIT;
            const data = await BillingOfflinePaymentService.getOfflineTransactions(
                shift_id as string, cashier_id as string, payment_method as string,
                terminal_id as string, status as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    // ═══ NHÓM 2: POS TERMINALS ═══

    /** Đăng ký thiết bị POS */
    static createTerminal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingOfflinePaymentService.createTerminal(req.body, userId);
            res.status(201).json({ success: true, message: 'Đăng ký thiết bị POS thành công.', data });
    });

    /** Cập nhật thiết bị POS */
    static updateTerminal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.updateTerminal(String(req.params.terminalId), req.body);
            res.json({ success: true, message: 'Cập nhật thiết bị POS thành công.', data });
    });

    /** Danh sách POS */
    static getTerminals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { branch_id, is_active } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_LIMIT;
            const data = await BillingOfflinePaymentService.getTerminals(
                branch_id as string,
                is_active !== undefined ? is_active === 'true' : undefined,
                page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết POS */
    static getTerminalById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.getTerminalById(String(req.params.terminalId));
            res.json({ success: true, data });
    });

    /** Bật/tắt POS */
    static toggleTerminal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.toggleTerminalStatus(String(req.params.terminalId));
            res.json({ success: true, message: 'Cập nhật trạng thái thiết bị POS thành công.', data });
    });

    // ═══ NHÓM 3: BIÊN LAI ═══

    /** Biên lai theo giao dịch */
    static getReceiptByTransaction = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.getReceiptByTransaction(String(req.params.transactionId));
            res.json({ success: true, data });
    });

    /** Chi tiết biên lai */
    static getReceiptById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.getReceiptById(String(req.params.receiptId));
            res.json({ success: true, data });
    });

    /** In lại biên lai */
    static reprintReceipt = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.reprintReceipt(String(req.params.receiptId));
            res.json({ success: true, message: 'In lại biên lai thành công.', data });
    });

    // ═══ NHÓM 4: CA THU NGÂN MỞ RỘNG ═══

    /** Kê khai mệnh giá tiền */
    static submitCashDenomination = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { denominations } = req.body;
            const data = await BillingOfflinePaymentService.submitCashDenomination(
                String(req.params.shiftId), denominations
            );
            res.json({ success: true, message: 'Kê khai mệnh giá tiền thành công.', data });
    });

    /** Giao dịch trong ca */
    static getShiftTransactions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.getShiftTransactions(String(req.params.shiftId));
            res.json({ success: true, data });
    });

    /** Tổng kết ca */
    static getShiftSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingOfflinePaymentService.getShiftSummary(String(req.params.shiftId));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 5: BÁO CÁO ═══

    /** Báo cáo cuối ngày */
    static getDailyReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { report_date, facility_id, branch_id } = req.query;
            const data = await BillingOfflinePaymentService.getDailyReport(
                report_date as string, facility_id as string, branch_id as string
            );
            res.json({ success: true, data });
    });

    /** Hiệu suất thu ngân */
    static getCashierPerformance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { cashier_id, date_from, date_to } = req.query;
            const data = await BillingOfflinePaymentService.getCashierPerformance(
                cashier_id as string, date_from as string, date_to as string
            );
            res.json({ success: true, data });
    });
}
