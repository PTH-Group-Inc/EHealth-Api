import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleResultService } from '../../services/Remote Consultation/tele-result.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_RESULT_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.5 — Ghi nhận kết quả khám từ xa
 * 14 handler chia 4 nhóm
 */
export class TeleResultController {

    // ═══ NHÓM 1: Ghi nhận kết quả ═══

    /** POST /results/:consultationId */
    static createResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleResultService.createResult(String(req.params.consultationId), req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_CREATED, data: result });
    });

    /** PUT /results/:consultationId */
    static updateResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleResultService.updateResult(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_UPDATED, data: result });
    });

    /** GET /results/:consultationId */
    static getResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleResultService.getResult(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** PUT /results/:consultationId/complete */
    static completeResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleResultService.completeResult(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_COMPLETED });
    });

    /** PUT /results/:consultationId/sign */
    static signResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await TeleResultService.signResult(String(req.params.consultationId), userId, req.body?.signature_notes);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_SIGNED });
    });

    // ═══ NHÓM 2: Triệu chứng & Sinh hiệu ═══

    /** PUT /results/:consultationId/symptoms */
    static updateSymptoms = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleResultService.updateSymptoms(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.SYMPTOMS_UPDATED });
    });

    /** PUT /results/:consultationId/vitals */
    static updateVitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleResultService.updateVitals(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.VITALS_UPDATED });
    });

    // ═══ NHÓM 3: Chuyển tuyến & Tái khám ═══

    /** PUT /results/:consultationId/referral */
    static updateReferral = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleResultService.updateReferral(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.REFERRAL_UPDATED });
    });

    /** PUT /results/:consultationId/follow-up */
    static updateFollowUp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleResultService.updateFollowUp(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.FOLLOW_UP_UPDATED });
    });

    // ═══ NHÓM 4: Tra cứu & Thống kê ═══

    /** GET /results */
    static listResults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                status: req.query.status as string,
                doctor_id: req.query.doctor_id as string,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TeleResultService.listResults(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /results/patient/:patientId */
    static getPatientResults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleResultService.getPatientResults(String(req.params.patientId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /results/unsigned */
    static getUnsigned = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleResultService.getUnsigned(userId, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /results/follow-ups */
    static getFollowUps = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleResultService.getFollowUps(userId, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /results/:consultationId/summary */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleResultService.getSummary(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });
}
