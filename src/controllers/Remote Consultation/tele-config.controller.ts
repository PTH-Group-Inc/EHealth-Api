import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleConfigService } from '../../services/Remote Consultation/tele-config.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_CFG_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.9 — Cấu hình & quản trị hệ thống
 * 13 handler chia 3 nhóm
 */
export class TeleConfigController {

    // ═══ NHÓM 1: Cấu hình ═══

    /** GET /admin/configs */
    static getAllConfigs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const category = req.query.category as string;
            const result = await TeleConfigService.getAllConfigs(category);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /admin/configs/audit-log */
    static getAuditLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const configKey = req.query.config_key as string;
            const result = await TeleConfigService.getAuditLog(page, limit, configKey);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /admin/configs/:configKey */
    static getConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleConfigService.getConfig(String(req.params.configKey));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** PUT /admin/configs/:configKey */
    static updateConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await TeleConfigService.updateConfig(String(req.params.configKey), userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_CFG_SUCCESS.CONFIG_UPDATED });
    });

    /** PUT /admin/configs/batch */
    static batchUpdate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleConfigService.batchUpdate(userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_CFG_SUCCESS.CONFIG_BATCH_UPDATED, data: result });
    });

    /** POST /admin/configs/reset */
    static resetDefaults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await TeleConfigService.resetDefaults(userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_CFG_SUCCESS.CONFIG_RESET });
    });

    // ═══ NHÓM 2: Chi phí ═══

    /** POST /admin/pricing */
    static createPricing = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleConfigService.createPricing(userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_CFG_SUCCESS.PRICING_CREATED, data: result });
    });

    /** PUT /admin/pricing/:pricingId */
    static updatePricing = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await TeleConfigService.updatePricing(String(req.params.pricingId), userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_CFG_SUCCESS.PRICING_UPDATED });
    });

    /** DELETE /admin/pricing/:pricingId */
    static deletePricing = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleConfigService.deletePricing(String(req.params.pricingId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_CFG_SUCCESS.PRICING_DELETED });
    });

    /** GET /admin/pricing */
    static listPricing = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                type_id: req.query.type_id as string,
                specialty_id: req.query.specialty_id as string,
                facility_id: req.query.facility_id as string,
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
                page, limit,
            };
            const result = await TeleConfigService.listPricing(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /admin/pricing/lookup */
    static lookupPrice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleConfigService.lookupPrice(
                req.query.type_id as string,
                req.query.specialty_id as string,
                req.query.facility_id as string,
            );
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 3: SLA ═══

    /** GET /admin/sla/dashboard */
    static getSlaDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleConfigService.getSlaDashboard();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /admin/sla/breaches */
    static getSlaBreaches = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleConfigService.getSlaBreaches(page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });
}
