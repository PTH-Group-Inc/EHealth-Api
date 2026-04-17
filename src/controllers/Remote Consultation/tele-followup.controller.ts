import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleFollowUpService } from '../../services/Remote Consultation/tele-followup.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_FU_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.7 — Theo dõi sau tư vấn & tái khám từ xa
 * 15 handler chia 4 nhóm
 */
export class TeleFollowUpController {

    // ═══ NHÓM 1: Kế hoạch ═══

    /** POST /follow-ups/plans/:consultationId */
    static createPlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleFollowUpService.createPlan(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_FU_SUCCESS.PLAN_CREATED, data: result });
    });

    /** PUT /follow-ups/plans/:planId */
    static updatePlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleFollowUpService.updatePlan(String(req.params.planId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.PLAN_UPDATED, data: result });
    });

    /** GET /follow-ups/plans/:planId */
    static getPlanDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleFollowUpService.getPlanDetail(String(req.params.planId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** PUT /follow-ups/plans/:planId/complete */
    static completePlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleFollowUpService.completePlan(String(req.params.planId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.PLAN_COMPLETED });
    });

    /** PUT /follow-ups/plans/:planId/convert */
    static convertToPerson = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleFollowUpService.convertToPerson(String(req.params.planId), req.body.converted_reason || '');
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.PLAN_CONVERTED });
    });

    // ═══ NHÓM 2: Diễn biến sức khỏe ═══

    /** POST /follow-ups/plans/:planId/updates */
    static addHealthUpdate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;
            const result = await TeleFollowUpService.addHealthUpdate(String(req.params.planId), userId, role, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_FU_SUCCESS.UPDATE_ADDED, data: result });
    });

    /** GET /follow-ups/plans/:planId/updates */
    static getHealthUpdates = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleFollowUpService.getHealthUpdates(String(req.params.planId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** PUT /follow-ups/updates/:updateId/respond */
    static respondToUpdate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleFollowUpService.respondToUpdate(String(req.params.updateId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.UPDATE_RESPONDED });
    });

    /** GET /follow-ups/updates/attention */
    static getAttentionUpdates = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleFollowUpService.getAttentionUpdates(userId, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    // ═══ NHÓM 3: Nhắc tái khám ═══

    /** POST /follow-ups/plans/:planId/send-reminder */
    static sendReminder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleFollowUpService.sendReminder(String(req.params.planId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.REMINDER_SENT });
    });

    /** GET /follow-ups/plans/upcoming */
    static getUpcomingPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleFollowUpService.getUpcomingPlans(userId);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 4: Tra cứu & Báo cáo ═══

    /** GET /follow-ups/plans */
    static listPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                status: req.query.status as string,
                plan_type: req.query.plan_type as string,
                doctor_id: req.query.doctor_id as string,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TeleFollowUpService.listPlans(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /follow-ups/plans/patient/:patientId */
    static getPatientPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleFollowUpService.getPatientPlans(String(req.params.patientId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /follow-ups/plans/:planId/report */
    static getReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleFollowUpService.getReport(String(req.params.planId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /follow-ups/stats */
    static getStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const doctorId = req.query.doctor_id as string;
            const result = await TeleFollowUpService.getStats(doctorId);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });
}
