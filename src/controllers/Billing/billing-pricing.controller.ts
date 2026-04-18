import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BillingPricingService } from '../../services/Billing/billing-pricing.service';
import {
    CreatePricePolicyInput,
    UpdatePricePolicyInput,
    CreateSpecialtyPriceInput,
    UpdateSpecialtyPriceInput,
    BulkCreatePoliciesInput,
} from '../../models/Billing/billing-pricing.model';

export class BillingPricingController {

    // CATALOG (Danh mục dịch vụ)

    /** Danh mục dịch vụ chuẩn */
    static getServiceCatalog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const serviceGroup = req.query.serviceGroup as string | undefined;
            const serviceType = req.query.serviceType as string | undefined;
            const search = req.query.search as string | undefined;
            let isActive: boolean | undefined;
            if (req.query.isActive !== undefined) isActive = req.query.isActive === 'true';
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getServiceCatalog(serviceGroup, serviceType, search, isActive, page, limit);
            res.status(200).json({ success: true, ...result });
    });

    /** Bảng giá tổng hợp cơ sở */
    static getFacilityPriceCatalog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = String(req.params.facilityId);
            const serviceGroup = req.query.serviceGroup as string | undefined;
            const departmentId = req.query.departmentId as string | undefined;
            const patientType = req.query.patientType as string | undefined;
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getFacilityPriceCatalog(facilityId, serviceGroup, departmentId, patientType, search, page, limit);
            res.status(200).json({ success: true, ...result });
    });

    // PRICE POLICIES (Chính sách giá)

    /** Danh sách chính sách giá */
    static getPolicies = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityServiceId = String(req.params.facilityServiceId);
            const patientType = req.query.patientType as string | undefined;
            let isActive: boolean | undefined;
            if (req.query.isActive !== undefined) isActive = req.query.isActive === 'true';
            const effectiveDate = req.query.effectiveDate as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getPolicies(facilityServiceId, patientType, isActive, effectiveDate, page, limit);
            res.status(200).json({ success: true, ...result });
    });

    /** Tạo chính sách giá */
    static createPolicy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const input: CreatePricePolicyInput = req.body;
            const data = await BillingPricingService.createPolicy(input, userId);
            res.status(201).json({ success: true, data });
    });

    /** Cập nhật chính sách giá */
    static updatePolicy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const policyId = String(req.params.policyId);
            const input: UpdatePricePolicyInput = req.body;
            const data = await BillingPricingService.updatePolicy(policyId, input, userId);
            res.status(200).json({ success: true, data });
    });

    /** Xóa chính sách giá (soft) */
    static deletePolicy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const policyId = String(req.params.policyId);
            const reason = req.body.reason as string;
            const data = await BillingPricingService.deletePolicy(policyId, reason, userId);
            res.status(200).json({ success: true, message: 'Đã vô hiệu hóa chính sách giá thành công.', data });
    });

    /** Tạo hàng loạt chính sách giá */
    static bulkCreatePolicies = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const input: BulkCreatePoliciesInput = req.body;
            const result = await BillingPricingService.bulkCreatePolicies(input, userId);
            res.status(201).json({ success: true, message: `Đã tạo thành công ${result.created} chính sách giá.`, ...result });
    });

    /** Tra cứu giá cuối cùng (Price Resolver) */
    static resolvePrice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityServiceId = req.query.facilityServiceId as string;
            const patientType = req.query.patientType as string;
            const specialtyId = req.query.specialtyId as string | undefined;
            const referenceDate = req.query.referenceDate as string | undefined;

            const data = await BillingPricingService.resolvePrice(facilityServiceId, patientType, specialtyId, referenceDate);
            res.status(200).json({ success: true, data });
    });

    // SPECIALTY PRICES (Giá theo chuyên khoa)

    /** Danh sách giá chuyên khoa */
    static getSpecialtyPrices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityServiceId = String(req.params.facilityServiceId);
            const specialtyId = req.query.specialtyId as string | undefined;
            const patientType = req.query.patientType as string | undefined;
            let isActive: boolean | undefined;
            if (req.query.isActive !== undefined) isActive = req.query.isActive === 'true';

            const data = await BillingPricingService.getSpecialtyPrices(facilityServiceId, specialtyId, patientType, isActive);
            res.status(200).json({ success: true, data });
    });

    /** Tạo giá chuyên khoa */
    static createSpecialtyPrice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const input: CreateSpecialtyPriceInput = req.body;
            const data = await BillingPricingService.createSpecialtyPrice(input, userId);
            res.status(201).json({ success: true, data });
    });

    /** Cập nhật giá chuyên khoa */
    static updateSpecialtyPrice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const specialtyPriceId = String(req.params.specialtyPriceId);
            const input: UpdateSpecialtyPriceInput = req.body;
            const data = await BillingPricingService.updateSpecialtyPrice(specialtyPriceId, input, userId);
            res.status(200).json({ success: true, data });
    });

    /** Xóa giá chuyên khoa (soft) */
    static deleteSpecialtyPrice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const specialtyPriceId = String(req.params.specialtyPriceId);
            const reason = req.body.reason as string;
            const data = await BillingPricingService.deleteSpecialtyPrice(specialtyPriceId, reason, userId);
            res.status(200).json({ success: true, message: 'Đã vô hiệu hóa giá chuyên khoa thành công.', data });
    });

    // HISTORY & STATISTICS

    /** Lịch sử giá 1 dịch vụ cơ sở */
    static getHistoryByService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityServiceId = String(req.params.facilityServiceId);
            const changeType = req.query.changeType as string | undefined;
            const changeSource = req.query.changeSource as string | undefined;
            const dateFrom = req.query.dateFrom as string | undefined;
            const dateTo = req.query.dateTo as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getHistoryByFacilityService(
                facilityServiceId, changeType, changeSource, dateFrom, dateTo, page, limit
            );
            res.status(200).json({ success: true, ...result });
    });

    /** Lịch sử giá toàn cơ sở */
    static getHistoryByFacility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = String(req.params.facilityId);
            const changeType = req.query.changeType as string | undefined;
            const changeSource = req.query.changeSource as string | undefined;
            const dateFrom = req.query.dateFrom as string | undefined;
            const dateTo = req.query.dateTo as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getHistoryByFacility(
                facilityId, changeType, changeSource, dateFrom, dateTo, page, limit
            );
            res.status(200).json({ success: true, ...result });
    });

    /** So sánh giá liên cơ sở */
    static comparePrices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const serviceId = req.query.serviceId as string;
            const patientType = (req.query.patientType as string) || 'STANDARD';
            const data = await BillingPricingService.comparePrices(serviceId, patientType);
            res.status(200).json({ success: true, data });
    });

    /** Thống kê bảng giá cơ sở */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = String(req.params.facilityId);
            const data = await BillingPricingService.getPricingSummary(facilityId);
            res.status(200).json({ success: true, data });
    });

    /** Chính sách sắp hết hạn */
    static getExpiringPolicies = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilityId = String(req.params.facilityId);
            const warningDays = parseInt(req.query.warningDays as string, 10) || 30;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getExpiringPolicies(facilityId, warningDays, page, limit);
            res.status(200).json({ success: true, ...result });
    });
}
