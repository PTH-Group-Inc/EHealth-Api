import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { PrescriptionService } from '../../services/EMR/prescription.service';
import { AppError } from '../../utils/app-error.util';
import { PRESCRIPTION_SUCCESS, PRESCRIPTION_CONFIG } from '../../constants/prescription.constant';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';


export class PrescriptionController {


    /** API 1: POST /api/prescriptions/:encounterId — Tạo đơn thuốc */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const prescription = await PrescriptionService.create(encounterId, req.body, userId);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CREATED,
                data: prescription,
            });
    });

    /** API 2: GET /api/prescriptions/:encounterId — Lấy đơn thuốc theo encounter */
    static getByEncounterId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const result = await PrescriptionService.getByEncounterId(encounterId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.FETCHED,
                data: result,
            });
    });

    /** API 3: PATCH /api/prescriptions/:prescriptionId/update — Cập nhật header */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const prescriptionId = req.params.prescriptionId as string;
            const prescription = await PrescriptionService.update(prescriptionId, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.UPDATED,
                data: prescription,
            });
    });

    /** API 4: PATCH /api/prescriptions/:prescriptionId/confirm — Xác nhận đơn */
    static confirm = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const prescriptionId = req.params.prescriptionId as string;
            const prescription = await PrescriptionService.confirm(prescriptionId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CONFIRMED,
                data: prescription,
            });
    });

    /** API 5: PATCH /api/prescriptions/:prescriptionId/cancel — Hủy đơn */
    static cancel = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const prescriptionId = req.params.prescriptionId as string;
            const { cancelled_reason } = req.body;
            const prescription = await PrescriptionService.cancel(prescriptionId, cancelled_reason);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CANCELLED,
                data: prescription,
            });
    });

    /** API 6: GET /api/prescriptions/by-patient/:patientId — Lịch sử đơn thuốc */
    static getByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const page = parseInt(req.query.page as string) || PRESCRIPTION_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PRESCRIPTION_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.getByPatientId(patientId, page, limit, status, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.HISTORY_FETCHED,
                data: result,
            });
    });


    /** API 7: POST /api/prescriptions/:prescriptionId/details — Thêm dòng thuốc */
    static addDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const prescriptionId = req.params.prescriptionId as string;
            const detail = await PrescriptionService.addDetail(prescriptionId, req.body);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAIL_ADDED,
                data: detail,
            });
    });

    /** API 8: PATCH /api/prescriptions/details/:detailId — Sửa dòng thuốc */
    static updateDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const detailId = req.params.detailId as string;
            const detail = await PrescriptionService.updateDetail(detailId, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAIL_UPDATED,
                data: detail,
            });
    });

    /** API 9: DELETE /api/prescriptions/details/:detailId — Xóa dòng thuốc */
    static deleteDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const detailId = req.params.detailId as string;
            await PrescriptionService.deleteDetail(detailId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAIL_DELETED,
            });
    });

    /** API 10: GET /api/prescriptions/:prescriptionId/details — Danh sách dòng thuốc */
    static getDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const prescriptionId = req.params.prescriptionId as string;
            const details = await PrescriptionService.getDetails(prescriptionId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAILS_FETCHED,
                data: details,
            });
    });


    /** API 11: GET /api/prescriptions/search-drugs — Tìm kiếm thuốc */
    static searchDrugs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const query = req.query.q as string;
            const categoryId = req.query.category_id as string | undefined;
            const drugs = await PrescriptionService.searchDrugs(query, categoryId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DRUGS_SEARCHED,
                data: drugs,
            });
    });

    /** API 12: GET /api/prescriptions/:encounterId/summary — Tóm tắt đơn thuốc */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const summary = await PrescriptionService.getSummary(encounterId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.SUMMARY_FETCHED,
                data: summary,
            });
    });

    /** API 13: GET /api/prescriptions/by-doctor/:doctorId — Lịch sử đơn thuốc theo bác sĩ */
    static getByDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const doctorId = req.params.doctorId as string;
            const page = parseInt(req.query.page as string) || PRESCRIPTION_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PRESCRIPTION_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.getByDoctorId(doctorId, page, limit, status, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DOCTOR_HISTORY_FETCHED,
                data: result,
            });
    });

    //  SEARCH (Module 5.9) 

    /** API 14: GET /api/prescriptions/search — Tìm kiếm tổng hợp */
    static search = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || PRESCRIPTION_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PRESCRIPTION_CONFIG.DEFAULT_LIMIT;
            const q = req.query.q as string | undefined;
            const status = req.query.status as string | undefined;
            const doctorId = req.query.doctor_id as string | undefined;
            const patientId = req.query.patient_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.search(page, limit, q, status, doctorId, patientId, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.SEARCH_FETCHED,
                data: result,
            });
    });

    /** API 15: GET /api/prescriptions/search/by-code/:code — Tìm theo mã đơn */
    static searchByCode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const code = req.params.code as string;
            const result = await PrescriptionService.findByCode(code);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CODE_FETCHED,
                data: result,
            });
    });

    /** API 16: GET /api/prescriptions/search/stats — Thống kê */
    static getStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const doctorId = req.query.doctor_id as string | undefined;
            const patientId = req.query.patient_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.getStats(doctorId, patientId, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.STATS_FETCHED,
                data: result,
            });
    });
}
