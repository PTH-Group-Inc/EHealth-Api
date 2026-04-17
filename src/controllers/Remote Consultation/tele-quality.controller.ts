import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleQualityService } from '../../services/Remote Consultation/tele-quality.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_QA_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.8 — Quản lý chất lượng & đánh giá
 * 14 handler chia 4 nhóm
 */
export class TeleQualityController {

    // ═══ NHÓM 1: Đánh giá ═══

    /** POST /quality/reviews/:consultationId */
    static createReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleQualityService.createReview(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_QA_SUCCESS.REVIEW_CREATED, data: result });
    });

    /** GET /quality/reviews/:consultationId */
    static getReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getReview(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /quality/reviews */
    static listReviews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                doctor_id: req.query.doctor_id as string,
                min_rating: req.query.min_rating ? parseInt(req.query.min_rating as string) : undefined,
                max_rating: req.query.max_rating ? parseInt(req.query.max_rating as string) : undefined,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TeleQualityService.listReviews(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /quality/reviews/doctor/:doctorId */
    static getDoctorReviews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleQualityService.getDoctorReviews(String(req.params.doctorId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    // ═══ NHÓM 2: Metrics ═══

    /** GET /quality/metrics/doctor/:doctorId */
    static getDoctorMetrics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getDoctorMetrics(String(req.params.doctorId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /quality/metrics/overview */
    static getOverview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getSystemOverview();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /quality/metrics/connection */
    static getConnectionStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getConnectionStats();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /quality/metrics/trends */
    static getTrends = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getTrends();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 3: Cảnh báo ═══

    /** GET /quality/alerts */
    static listAlerts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleQualityService.listAlerts(req.query.status as string, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** POST /quality/alerts */
    static createAlert = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.createAlert(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_QA_SUCCESS.ALERT_CREATED, data: result });
    });

    /** PUT /quality/alerts/:alertId/resolve */
    static resolveAlert = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await TeleQualityService.resolveAlert(String(req.params.alertId), userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_QA_SUCCESS.ALERT_RESOLVED });
    });

    /** GET /quality/alerts/stats */
    static getAlertStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getAlertStats();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 4: Báo cáo ═══

    /** GET /quality/reports/doctor/:doctorId */
    static getDoctorReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getDoctorReport(String(req.params.doctorId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /quality/reports/summary */
    static getSystemReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleQualityService.getSystemReport();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });
}
