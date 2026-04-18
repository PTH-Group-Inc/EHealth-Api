import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingReconciliationService } from '../../services/Billing/billing-reconciliation.service';
import { RECONCILE_CONFIG, RECONCILE_SUCCESS } from '../../constants/billing-reconciliation.constant';

export class BillingReconciliationController {

    // ═══ NHÓM 1: ĐỐI SOÁT ═══

    /** Chạy đối soát online */
    static runOnlineReconciliation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.runOnlineReconciliation(req.body, userId);
            res.status(201).json({ success: true, message: RECONCILE_SUCCESS.ONLINE_RECONCILED, data });
    });

    /** Chạy đối soát ca */
    static runShiftReconciliation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.runShiftReconciliation(
                String(req.params.shiftId), req.body, userId
            );
            res.status(201).json({ success: true, message: RECONCILE_SUCCESS.SHIFT_RECONCILED, data });
    });

    /** Danh sách phiên đối soát */
    static getSessions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { type, status, facility_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : RECONCILE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : RECONCILE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingReconciliationService.getSessions(
                type as string, status as string, facility_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết phiên */
    static getSessionById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingReconciliationService.getSessionById(String(req.params.id));
            res.json({ success: true, data });
    });

    /** Chênh lệch ca */
    static getShiftDiscrepancy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingReconciliationService.getShiftDiscrepancy(String(req.params.shiftId));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 2: XỬ LÝ CHÊNH LỆCH ═══

    /** Báo cáo chênh lệch */
    static getDiscrepancyReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingReconciliationService.getDiscrepancyReport(req.query.facility_id as string);
            res.json({ success: true, data });
    });

    /** Xử lý chênh lệch */
    static resolveItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.resolveItem(
                String(req.params.itemId), req.body, userId
            );
            res.json({ success: true, message: RECONCILE_SUCCESS.ITEM_RESOLVED, data });
    });

    /** Review phiên */
    static reviewSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.reviewSession(
                String(req.params.id), req.body.notes, userId
            );
            res.json({ success: true, message: RECONCILE_SUCCESS.SESSION_REVIEWED, data });
    });

    /** Phê duyệt phiên */
    static approveSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.approveSession(String(req.params.id), userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SESSION_APPROVED, data });
    });

    /** Từ chối phiên */
    static rejectSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.rejectSession(
                String(req.params.id), req.body.reject_reason, userId
            );
            res.json({ success: true, message: RECONCILE_SUCCESS.SESSION_REJECTED, data });
    });

    // ═══ NHÓM 3: QUYẾT TOÁN ═══

    /** Tạo phiếu quyết toán */
    static createSettlement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.createSettlement(req.body, userId);
            res.status(201).json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_CREATED, data });
    });

    /** Gửi phiếu */
    static submitSettlement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.submitSettlement(String(req.params.id), userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_SUBMITTED, data });
    });

    /** Phê duyệt quyết toán */
    static approveSettlement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.approveSettlement(String(req.params.id), userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_APPROVED, data });
    });

    /** Từ chối quyết toán */
    static rejectSettlement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.rejectSettlement(String(req.params.id), req.body, userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_REJECTED, data });
    });

    /** Danh sách phiếu */
    static getSettlements = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { type, status, facility_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : RECONCILE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : RECONCILE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingReconciliationService.getSettlements(
                type as string, status as string, facility_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết phiếu */
    static getSettlementById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingReconciliationService.getSettlementById(String(req.params.id));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 4: LỊCH SỬ & XUẤT ═══

    /** Lịch sử đối soát */
    static getHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { type, status, facility_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : RECONCILE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : RECONCILE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingReconciliationService.getReconciliationHistory(
                type as string, status as string, facility_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Xuất data quyết toán */
    static exportSettlement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingReconciliationService.exportSettlementData(String(req.params.id));
            res.json({ success: true, data });
    });
}
