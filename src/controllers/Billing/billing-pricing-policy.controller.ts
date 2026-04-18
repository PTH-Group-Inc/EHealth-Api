import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingPricingPolicyService } from '../../services/Billing/billing-pricing-policy.service';
import { POLICY_CONFIG, POLICY_SUCCESS } from '../../constants/billing-pricing-policy.constant';

export class BillingPricingPolicyController {

    // ═══ NHÓM 1: CHÍNH SÁCH GIẢM GIÁ ═══

    /** Tạo */
    static createDiscount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.createDiscount(req.body, userId);
            res.status(201).json({ success: true, message: POLICY_SUCCESS.DISCOUNT_CREATED, data });
    });

    /** Danh sách */
    static getDiscounts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { discount_type, apply_to, is_active, facility_id } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getDiscounts(
                discount_type as string, apply_to as string, is_active as string,
                facility_id as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết */
    static getDiscountById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.getDiscountById(String(req.params.id));
            res.json({ success: true, data });
    });

    /** Cập nhật */
    static updateDiscount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.updateDiscount(String(req.params.id), req.body);
            res.json({ success: true, message: POLICY_SUCCESS.DISCOUNT_UPDATED, data });
    });

    /** Vô hiệu hóa */
    static deleteDiscount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await BillingPricingPolicyService.deleteDiscount(String(req.params.id));
            res.json({ success: true, message: POLICY_SUCCESS.DISCOUNT_DELETED });
    });

    /** Tính giảm giá */
    static calculateDiscount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { services, patient_type, facility_id } = req.body;
            const data = await BillingPricingPolicyService.calculateDiscount(services, patient_type, facility_id);
            res.json({ success: true, data });
    });

    // ═══ NHÓM 2: VOUCHER ═══

    /** Tạo */
    static createVoucher = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.createVoucher(req.body, userId);
            res.status(201).json({ success: true, message: POLICY_SUCCESS.VOUCHER_CREATED, data });
    });

    /** Danh sách */
    static getVouchers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { is_active, facility_id } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getVouchers(
                is_active as string, facility_id as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết */
    static getVoucherById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.getVoucherById(String(req.params.id));
            res.json({ success: true, data });
    });

    /** Cập nhật */
    static updateVoucher = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.updateVoucher(String(req.params.id), req.body);
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_UPDATED, data });
    });

    /** Vô hiệu hóa */
    static deleteVoucher = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await BillingPricingPolicyService.deleteVoucher(String(req.params.id));
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_DELETED });
    });

    /** Validate voucher code */
    static validateVoucher = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.validateVoucher(req.body);
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_VALID, data });
    });

    /** Redeem voucher */
    static redeemVoucher = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.redeemVoucher(req.body, userId);
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_REDEEMED, data });
    });

    /** Lịch sử sử dụng */
    static getVoucherUsage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.getVoucherUsage(String(req.params.id));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 3: GÓI DỊCH VỤ ═══

    /** Tạo */
    static createBundle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.createBundle(req.body, userId);
            res.status(201).json({ success: true, message: POLICY_SUCCESS.BUNDLE_CREATED, data });
    });

    /** Danh sách */
    static getBundles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { is_active, facility_id } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getBundles(
                is_active as string, facility_id as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    /** Chi tiết + items */
    static getBundleById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.getBundleById(String(req.params.id));
            res.json({ success: true, data });
    });

    /** Cập nhật */
    static updateBundle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.updateBundle(String(req.params.id), req.body);
            res.json({ success: true, message: POLICY_SUCCESS.BUNDLE_UPDATED, data });
    });

    /** Vô hiệu hóa */
    static deleteBundle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await BillingPricingPolicyService.deleteBundle(String(req.params.id));
            res.json({ success: true, message: POLICY_SUCCESS.BUNDLE_DELETED });
    });

    /** Tính giá gói vs giá lẻ */
    static calculateBundle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.calculateBundle(String(req.params.id));
            res.json({ success: true, data });
    });

    // ═══ NHÓM 4: TỔNG QUAN ═══

    /** Ưu đãi đang chạy */
    static getActivePromotions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await BillingPricingPolicyService.getActivePromotions(req.query.facility_id as string);
            res.json({ success: true, data });
    });

    /** Lịch sử thay đổi */
    static getPolicyHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { facility_service_id, change_source } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getPolicyHistory(
                facility_service_id as string, change_source as string, page, limit
            );
            res.json({ success: true, ...data });
    });
}
