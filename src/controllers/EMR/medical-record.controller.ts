import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedicalRecordService } from '../../services/EMR/medical-record.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { MEDICAL_RECORD_SUCCESS } from '../../constants/medical-record.constant';
import { pool } from '../../config/postgresdb';


/**
 * Helper: Nếu patientId là user_id (VD: USR_PAT_004), tự động resolve sang patients_id
 * từ bảng patient_profiles. Nếu đã là patients_id thì trả về nguyên.
 */
async function resolvePatientId(patientId: string): Promise<string> {
    if (patientId.startsWith('USR_')) {
        const result = await pool.query(
            `SELECT id FROM patients WHERE account_id = $1 LIMIT 1`,
            [patientId]
        );
        if (result.rows.length > 0) {
            return result.rows[0].id;
        }
    }
    return patientId;
}


export class MedicalRecordController {

    /** API 1: GET /api/medical-records/:encounterId — Bệnh án đầy đủ */
    static getFullRecord = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.getFullRecord(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.RECORD_FETCHED, data });
    });

    /** API 2: GET /api/medical-records/:encounterId/completeness — Tính đầy đủ */
    static getCompleteness = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.getCompleteness(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.COMPLETENESS_FETCHED, data });
    });

    /** API 3: POST /api/medical-records/:encounterId/finalize — Hoàn tất & khóa */
    static finalize = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalRecordService.finalize(encounterId, userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.FINALIZED, data });
    });

    /** API 4: POST /api/medical-records/:encounterId/sign — Ký số */
    static sign = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await MedicalRecordService.sign(encounterId, userId, req.body, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.SIGNED, data });
    });

    /** API 5: GET /api/medical-records/by-patient/:patientId — DS bệnh án theo BN */
    static getPatientRecords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const rawId = req.params.patientId as string;
            const patientId = await resolvePatientId(rawId);
            const { page, limit, record_type, is_finalized, from_date, to_date } = req.query;
            const data = await MedicalRecordService.getPatientRecords(
                patientId,
                Number(page) || 1,
                Number(limit) || 20,
                record_type as string,
                is_finalized !== undefined ? is_finalized === 'true' : undefined,
                from_date as string,
                to_date as string
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.PATIENT_RECORDS_FETCHED, data });
    });

    /** API 6: GET /api/medical-records/by-patient/:patientId/timeline — Dòng thời gian */
    static getTimeline = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const rawId = req.params.patientId as string;
            const patientId = await resolvePatientId(rawId);
            const { from, to, event_type, limit } = req.query;
            const data = await MedicalRecordService.getTimeline(
                patientId, from as string, to as string,
                event_type as string, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.TIMELINE_FETCHED, data });
    });

    /** API 7: GET /api/medical-records/by-patient/:patientId/statistics — Thống kê */
    static getStatistics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const rawId = req.params.patientId as string;
            const patientId = await resolvePatientId(rawId);
            const data = await MedicalRecordService.getStatistics(patientId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.STATISTICS_FETCHED, data });
    });

    /** API 8: GET /api/medical-records/snapshot/:encounterId — Xem snapshot */
    static getSnapshot = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.getSnapshot(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.SNAPSHOT_FETCHED, data });
    });

    /** API 9: GET /api/medical-records/export/:encounterId — Xuất bệnh án */
    static exportRecord = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.exportRecord(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.EXPORT_FETCHED, data });
    });

    /** API 10: GET /api/medical-records/search — Tìm kiếm nâng cao */
    static searchRecords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { keyword, icd10_code, doctor_id, record_type, is_finalized, from_date, to_date, page, limit } = req.query;
            const data = await MedicalRecordService.searchRecords(
                keyword as string, icd10_code as string, doctor_id as string,
                record_type as string,
                is_finalized !== undefined ? is_finalized === 'true' : undefined,
                from_date as string, to_date as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.SEARCH_FETCHED, data });
    });
}
