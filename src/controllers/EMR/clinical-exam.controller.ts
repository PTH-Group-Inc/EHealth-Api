import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ClinicalExamService } from '../../services/EMR/clinical-exam.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    CLINICAL_EXAM_SUCCESS,
    CLINICAL_EXAM_CONFIG,
} from '../../constants/clinical-exam.constant';


export class ClinicalExamController {

    /**
     * POST /api/clinical-examinations/:encounterId — Tạo phiếu khám lâm sàng
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const record = await ClinicalExamService.create(encounterId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.CREATED,
                data: record,
            });
    });

    /**
     * GET /api/clinical-examinations/:encounterId — Chi tiết phiếu khám
     */
    static getByEncounterId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const record = await ClinicalExamService.getByEncounterId(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.DETAIL_FETCHED,
                data: record,
            });
    });

    /**
     * PATCH /api/clinical-examinations/:encounterId — Cập nhật phiếu khám
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const record = await ClinicalExamService.update(req.params.encounterId as string, req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.UPDATED,
                data: record,
            });
    });

    /**
     * PATCH /api/clinical-examinations/:encounterId/vitals — Cập nhật riêng sinh hiệu
     */
    static updateVitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const record = await ClinicalExamService.updateVitals(req.params.encounterId as string, req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.VITALS_UPDATED,
                data: record,
            });
    });

    /**
     * PATCH /api/clinical-examinations/:encounterId/finalize — Xác nhận phiếu khám
     */
    static finalize = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const record = await ClinicalExamService.finalize(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.FINALIZED,
                data: record,
            });
    });

    /**
     * GET /api/clinical-examinations/by-patient/:patientId — Lịch sử khám theo BN
     */
    static getByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : CLINICAL_EXAM_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : CLINICAL_EXAM_CONFIG.DEFAULT_LIMIT;
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();

            const result = await ClinicalExamService.getByPatientId(patientId, page, limit, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.HISTORY_FETCHED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
    });

    /**
     * GET /api/clinical-examinations/:encounterId/summary — Tóm tắt khám lâm sàng
     */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const summary = await ClinicalExamService.getSummary(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.SUMMARY_FETCHED,
                data: summary,
            });
    });
}
