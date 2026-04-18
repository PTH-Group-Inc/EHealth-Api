import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { HealthTimelineService } from '../../services/EHR/health-timeline.service';
import { TIMELINE_SUCCESS, TIMELINE_CONFIG } from '../../constants/health-timeline.constant';

/**
 * Controller cho module Health Timeline (6.2)
 * 6 handler methods tương ứng 6 API endpoints
 */
export class HealthTimelineController {

    /** API 1: Dòng thời gian hợp nhất */
    static getTimeline = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const page = parseInt(req.query.page as string) || TIMELINE_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || TIMELINE_CONFIG.DEFAULT_LIMIT;
            const eventType = req.query.event_type as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await HealthTimelineService.getTimeline(
                patientId, page, limit, eventType, fromDate, toDate
            );
            res.status(200).json({
                success: true,
                message: TIMELINE_SUCCESS.TIMELINE_FETCHED,
                data: result,
            });
    });

    /** API 2: Thống kê timeline */
    static getTimelineSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const summary = await HealthTimelineService.getTimelineSummary(patientId);
            res.status(200).json({
                success: true,
                message: TIMELINE_SUCCESS.SUMMARY_FETCHED,
                data: summary,
            });
    });

    /** API 3: Events theo encounter */
    static getByEncounter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const encounterId = req.params.encounterId as string;
            const events = await HealthTimelineService.getByEncounter(patientId, encounterId);
            res.status(200).json({
                success: true,
                message: TIMELINE_SUCCESS.ENCOUNTER_EVENTS_FETCHED,
                data: events,
            });
    });

    /** API 4: Theo dõi tiến triển bệnh */
    static trackCondition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const icd10Code = req.query.icd10_code as string;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await HealthTimelineService.trackCondition(
                patientId, icd10Code, fromDate, toDate
            );
            res.status(200).json({
                success: true,
                message: TIMELINE_SUCCESS.CONDITION_TRACKED,
                data: result,
            });
    });

    /** API 5: Thêm event thủ công */
    static createManualEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const event = await HealthTimelineService.createManualEvent(patientId, userId, req.body);
            res.status(201).json({
                success: true,
                message: TIMELINE_SUCCESS.EVENT_CREATED,
                data: event,
            });
    });

    /** API 6: Xóa event thủ công */
    static deleteManualEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const eventId = req.params.eventId as string;
            await HealthTimelineService.deleteManualEvent(patientId, eventId);
            res.status(200).json({
                success: true,
                message: TIMELINE_SUCCESS.EVENT_DELETED,
            });
    });
}
