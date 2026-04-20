import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TreatmentProgressService } from '../../services/EMR/treatment-progress.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TREATMENT_SUCCESS } from '../../constants/treatment-progress.constant';



export class TreatmentProgressController {

    /** API 1: POST /api/treatment-plans — Tạo kế hoạch */
    static createPlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.createPlan(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TREATMENT_SUCCESS.PLAN_CREATED, data });
    });

    /** API 2: GET /api/treatment-plans/:planId — Chi tiết */
    static getPlanDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const data = await TreatmentProgressService.getPlanDetail(planId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PLAN_FETCHED, data });
    });

    /** API 3: PATCH /api/treatment-plans/:planId — Cập nhật */
    static updatePlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.updatePlan(planId, req.body, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PLAN_UPDATED, data });
    });

    /** API 4: PATCH /api/treatment-plans/:planId/status — Chuyển trạng thái */
    static changeStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.changeStatus(planId, req.body, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PLAN_STATUS_CHANGED, data });
    });

    /** API 5: GET /api/treatment-plans/by-patient/:patientId — DS theo BN */
    static getPatientPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const { status, page, limit } = req.query;
            const data = await TreatmentProgressService.getPatientPlans(
                patientId, status as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PATIENT_PLANS_FETCHED, data });
    });

    /** API: GET /api/treatment-plans — Lấy danh sách tất cả các kế hoạch (Aggregate list) */
    static getAllPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { status, page, limit } = req.query;
            const data = await TreatmentProgressService.getAllPlans(
                status as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PATIENT_PLANS_FETCHED, data });
    });

    /** API 6: POST /api/treatment-plans/:planId/notes — Thêm ghi nhận */
    static createNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.createNote(planId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TREATMENT_SUCCESS.NOTE_CREATED, data });
    });

    /** API 7: GET /api/treatment-plans/:planId/notes — DS ghi nhận */
    static getNotes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const { note_type, severity, encounter_id, from_date, to_date, page, limit } = req.query;
            const data = await TreatmentProgressService.getNotes(
                planId, note_type as string, severity as string,
                encounter_id as string, from_date as string, to_date as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.NOTES_FETCHED, data });
    });

    /** API 8: PATCH /api/treatment-plans/:planId/notes/:noteId — Sửa ghi nhận */
    static updateNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const noteId = req.params.noteId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.updateNote(planId, noteId, req.body, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.NOTE_UPDATED, data });
    });

    /** API 9: DELETE /api/treatment-plans/:planId/notes/:noteId — Xóa ghi nhận */
    static deleteNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const noteId = req.params.noteId as string;
            const userId = (req as any).auth?.user_id;
            await TreatmentProgressService.deleteNote(planId, noteId, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.NOTE_DELETED });
    });

    /** API 10: POST /api/treatment-plans/:planId/follow-ups — Liên kết tái khám */
    static createFollowUp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.createFollowUp(planId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TREATMENT_SUCCESS.FOLLOWUP_CREATED, data });
    });

    /** API 11: GET /api/treatment-plans/:planId/follow-up-chain — Chuỗi tái khám */
    static getFollowUpChain = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const data = await TreatmentProgressService.getFollowUpChain(planId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.CHAIN_FETCHED, data });
    });

    /** API 12: GET /api/treatment-plans/:planId/summary — Tổng hợp */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const planId = req.params.planId as string;
            const data = await TreatmentProgressService.getSummary(planId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.SUMMARY_FETCHED, data });
    });
}
