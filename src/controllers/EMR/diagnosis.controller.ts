import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DiagnosisService } from '../../services/EMR/diagnosis.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DIAGNOSIS_SUCCESS, DIAGNOSIS_CONFIG } from '../../constants/diagnosis.constant';



export class DiagnosisController {

    /** POST /api/diagnoses/:encounterId */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const record = await DiagnosisService.create(encounterId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: DIAGNOSIS_SUCCESS.CREATED, data: record });
    });

    /** GET /api/diagnoses/:encounterId */
    static getByEncounterId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DiagnosisService.getByEncounterId(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.LIST_FETCHED, data });
    });

    /** PATCH /api/diagnoses/:diagnosisId */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const record = await DiagnosisService.update(req.params.diagnosisId as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.UPDATED, data: record });
    });

    /** DELETE /api/diagnoses/:diagnosisId */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await DiagnosisService.delete(req.params.diagnosisId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.DELETED });
    });

    /** PATCH /api/diagnoses/:diagnosisId/type */
    static changeType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const record = await DiagnosisService.changeType(req.params.diagnosisId as string, req.body.new_type);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.TYPE_CHANGED, data: record });
    });

    /** PUT /api/diagnoses/:encounterId/conclusion */
    static setConclusion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DiagnosisService.setConclusion(req.params.encounterId as string, req.body.conclusion);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.CONCLUSION_SAVED, data });
    });

    /** GET /api/diagnoses/:encounterId/conclusion */
    static getConclusion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DiagnosisService.getConclusion(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.CONCLUSION_FETCHED, data });
    });

    /** GET /api/diagnoses/by-patient/:patientId */
    static getByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : DIAGNOSIS_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : DIAGNOSIS_CONFIG.DEFAULT_LIMIT;
            const icd10Code = req.query.icd10_code?.toString();
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();

            const result = await DiagnosisService.getByPatientId(patientId, page, limit, icd10Code, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DIAGNOSIS_SUCCESS.HISTORY_FETCHED,
                data: result.data,
                pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
            });
    });

    /** GET /api/diagnoses/search-icd */
    static searchICD = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DiagnosisService.searchICD(req.query.q?.toString() || '');
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.ICD_SEARCH_FETCHED, data });
    });
}
