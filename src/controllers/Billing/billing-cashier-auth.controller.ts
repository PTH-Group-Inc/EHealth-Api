import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingCashierAuthService } from '../../services/Billing/billing-cashier-auth.service';
import { CASHIER_AUTH_CONFIG, CASHIER_AUTH_SUCCESS } from '../../constants/billing-cashier-auth.constant';

export class BillingCashierAuthController {

    // ═══ NHÓM 1: HỒ SƠ THU NGÂN ═══

    static createProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingCashierAuthService.createProfile(req.body, userId);
            res.status(201).json({ success: true, message: CASHIER_AUTH_SUCCESS.PROFILE_CREATED, data });
    });

    static getProfiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { branch_id, facility_id, is_active } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : CASHIER_AUTH_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : CASHIER_AUTH_CONFIG.DEFAULT_LIMIT;
            const data = await BillingCashierAuthService.getProfiles(
                branch_id as string, facility_id as string, is_active as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    static getProfileById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getProfileById(String(req.params.id));
            res.json({ success: true, data });
    });

    static updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingCashierAuthService.updateProfile(String(req.params.id), req.body, userId);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.PROFILE_UPDATED, data });
    });

    static deleteProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await BillingCashierAuthService.deleteProfile(String(req.params.id));
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.PROFILE_DELETED });
    });

    static getProfileByUserId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getProfileByUserId(String(req.params.userId));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 2: GIỚI HẠN ═══

    static setLimit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingCashierAuthService.setLimit(req.body, userId);
            res.status(201).json({ success: true, message: CASHIER_AUTH_SUCCESS.LIMIT_SET, data });
    });

    static getLimit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getLimit(String(req.params.profileId));
            res.json({ success: true, data });
    });

    static updateLimit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.updateLimit(String(req.params.profileId), req.body);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.LIMIT_UPDATED, data });
    });

    static checkLimit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.checkLimit(req.body);
            const statusCode = data.allowed ? 200 : 403;
            res.status(statusCode).json({
                success: data.allowed,
                message: data.allowed ? CASHIER_AUTH_SUCCESS.LIMIT_PASSED : 'Thao tác vượt giới hạn.',
                data,
            });
    });

    // ═══ NHÓM 3: KHÓA CA ═══

    static lockShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.lockShift(String(req.params.shiftId), userId, req.body.reason);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_LOCKED });
    });

    static unlockShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.unlockShift(String(req.params.shiftId), userId);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_UNLOCKED });
    });

    static forceCloseShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.forceCloseShift(String(req.params.shiftId), userId);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_FORCE_CLOSED });
    });

    static handoverShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.handoverShift(String(req.params.shiftId), userId, req.body.handover_to);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_HANDOVER });
    });

    // ═══ NHÓM 4: NHẬT KÝ ═══

    static getLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { action_type, user_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : CASHIER_AUTH_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : CASHIER_AUTH_CONFIG.DEFAULT_LIMIT;
            const data = await BillingCashierAuthService.getLogs(
                action_type as string, user_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    static getLogsByProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = req.query.page ? parseInt(String(req.query.page)) : CASHIER_AUTH_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : CASHIER_AUTH_CONFIG.DEFAULT_LIMIT;
            const data = await BillingCashierAuthService.getLogsByProfile(String(req.params.profileId), page, limit);
            res.json({ success: true, ...data });
    });

    static getLogsByShift = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getLogsByShift(String(req.params.shiftId));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 5: DASHBOARD ═══

    static getDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getDashboard();
            res.json({ success: true, data });
    });

    static getCashierStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getCashierStats(String(req.params.profileId));
            res.json({ success: true, data });
    });

    static getActiveShifts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingCashierAuthService.getActiveShifts();
            res.json({ success: true, data });
    });
}
