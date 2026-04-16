import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingRefundService } from '../../services/Billing/billing-refund.service';
import { REFUND_CONFIG, REFUND_SUCCESS } from '../../constants/billing-refund.constant';

export class BillingRefundController {

    // ═══ NHÓM 1: YÊU CẦU HOÀN TIỀN ═══

    /** Tạo yêu cầu hoàn tiền */
    static createRefundRequest = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.createRefundRequest(req.body, userId);
            const isAutoApproved = data.status === 'APPROVED';
            res.status(201).json({
                success: true,
                message: isAutoApproved ? REFUND_SUCCESS.REQUEST_AUTO_APPROVED : REFUND_SUCCESS.REQUEST_CREATED,
                data,
            });
    });

    /** Danh sách */
    static getRefundRequests = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { status, refund_type, reason_category, patient_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REFUND_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REFUND_CONFIG.DEFAULT_LIMIT;
            const data = await BillingRefundService.getRefundRequests(
                status as string, refund_type as string, reason_category as string,
                patient_id as string, date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết */
    static getRefundById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingRefundService.getRefundById(String(req.params.id));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 2: PHÊ DUYỆT ═══

    /** Phê duyệt */
    static approveRefund = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.approveRefund(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_APPROVED, data });
    });

    /** Từ chối */
    static rejectRefund = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.rejectRefund(String(req.params.id), req.body, userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_REJECTED, data });
    });

    /** Xử lý hoàn tiền */
    static processRefund = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.processRefund(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_PROCESSED, data });
    });

    /** Hủy */
    static cancelRefund = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.cancelRefund(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_CANCELLED, data });
    });

    // ═══ NHÓM 3: ĐIỀU CHỈNH ═══

    /** Tạo điều chỉnh */
    static createAdjustment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.createAdjustment(req.body, userId);
            res.status(201).json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_CREATED, data });
    });

    /** Danh sách điều chỉnh */
    static getAdjustments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { status, adjustment_type, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REFUND_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REFUND_CONFIG.DEFAULT_LIMIT;
            const data = await BillingRefundService.getAdjustments(
                status as string, adjustment_type as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết */
    static getAdjustmentById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingRefundService.getAdjustmentById(String(req.params.id));
            res.json({ success: true, data });
    });

    /** Phê duyệt điều chỉnh */
    static approveAdjustment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.approveAdjustment(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_APPROVED, data });
    });

    /** Áp dụng điều chỉnh */
    static applyAdjustment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.applyAdjustment(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_APPLIED, data });
    });

    /** Từ chối điều chỉnh */
    static rejectAdjustment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.rejectAdjustment(String(req.params.id), req.body, userId);
            res.json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_REJECTED, data });
    });

    // ═══ NHÓM 4: DASHBOARD & TRACKING ═══

    /** Dashboard */
    static getDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingRefundService.getDashboard();
            res.json({ success: true, data });
    });

    /** Timeline */
    static getRefundTimeline = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingRefundService.getRefundTimeline(String(req.params.id));
            res.json({ success: true, data });
    });

    /** Lịch sử GD */
    static getTransactionHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingRefundService.getTransactionHistory(String(req.params.txnId));
            res.json({ success: true, data });
    });
}
