import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedicalHistoryService } from '../../services/Patient Management/medical-history.service';
import { MEDICAL_HISTORY_CONFIG, MEDICAL_HISTORY_SUCCESS } from '../../constants/medical-history.constant';

export class MedicalHistoryController {
    /**
     * Lấy danh sách lượt khám
     */
    static getEncounters = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const {
                patient_id, doctor_id, type, status,
                from, to, page, limit
            } = req.query as Record<string, string>;

            const data = await MedicalHistoryService.getEncounters(
                patient_id,
                doctor_id,
                type,
                status,
                from,
                to,
                page ? parseInt(page) : MEDICAL_HISTORY_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : MEDICAL_HISTORY_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy chi tiết đầy đủ lượt khám
     */
    static getEncounterDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { encounterId } = req.params as { encounterId: string };
            const data = await MedicalHistoryService.getEncounterDetail(encounterId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Tra cứu lần khám gần nhất
     */
    static getLatestEncounter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await MedicalHistoryService.getLatestEncounter(patientId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Xem dòng thời gian sức khỏe
     */
    static getTimeline = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const { from, to, limit } = req.query as Record<string, string>;

            const data = await MedicalHistoryService.getTimeline(
                patientId, from, to,
                limit ? parseInt(limit) : MEDICAL_HISTORY_CONFIG.TIMELINE_DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Tổng hợp lịch sử bệnh nhân
     */
    static getPatientSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await MedicalHistoryService.getPatientSummary(patientId);
            res.status(200).json({ success: true, data });
    });

    /**
     * GET /api/medical-history/my-history — Lịch sử khám bệnh của tôi
     */
    static getMyHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const { type, status, from, to, page, limit } = req.query as Record<string, string>;

            const { patientId, result } = await MedicalHistoryService.getMyHistory(
                userId!,
                type,
                status,
                from,
                to,
                page ? parseInt(page) : MEDICAL_HISTORY_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : MEDICAL_HISTORY_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({
                success: true,
                message: MEDICAL_HISTORY_SUCCESS.MY_HISTORY_FETCHED,
                patient_id: patientId,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
    });
}

