import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { VitalSignsService } from '../../services/EHR/vital-signs.service';
import { VS_SUCCESS } from '../../constants/vital-signs.constant';


export class VitalSignsController {

    /** API 1: Lịch sử sinh hiệu */
    static getVitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const filters = {
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await VitalSignsService.getVitals(patientId, filters);
            res.status(200).json({ success: true, message: VS_SUCCESS.VITALS_FETCHED, ...data });
    });

    /** API 2: Sinh hiệu mới nhất */
    static getLatestVitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const data = await VitalSignsService.getLatestVitals(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.LATEST_FETCHED, data });
    });

    /** API 3: Xu hướng */
    static getTrends = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const metricType = req.query.metric_type as string;
            const data = await VitalSignsService.getTrends(patientId, metricType);
            res.status(200).json({ success: true, message: VS_SUCCESS.TRENDS_FETCHED, data });
    });

    /** API 4: Bất thường */
    static getAbnormalVitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const data = await VitalSignsService.getAbnormalVitals(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.ABNORMAL_FETCHED, data, total: data.length });
    });

    /** API 5: Tổng hợp */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const data = await VitalSignsService.getSummary(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.SUMMARY_FETCHED, data });
    });

    /** API 6: DS health metrics */
    static getHealthMetrics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const filters = {
                metric_code: req.query.metric_code as string | undefined,
                source_type: req.query.source_type as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await VitalSignsService.getHealthMetrics(patientId, filters);
            res.status(200).json({ success: true, message: VS_SUCCESS.METRICS_FETCHED, ...data });
    });

    /** API 7: Thêm chỉ số */
    static createHealthMetric = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const data = await VitalSignsService.createHealthMetric(patientId, req.body);
            res.status(201).json({ success: true, message: VS_SUCCESS.METRIC_CREATED, data });
    });

    /** API 8: Timeline */
    static getTimeline = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            await VitalSignsService.validateDoctorPatientAccess((req as any).user?.userId, (req as any).user?.roles || [], patientId);
            const data = await VitalSignsService.getTimeline(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.TIMELINE_FETCHED, data });
    });
}
