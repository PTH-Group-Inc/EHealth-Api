import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TelePrescriptionService } from '../../services/Remote Consultation/tele-prescription.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_RX_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.6 — Kê đơn & chỉ định từ xa
 * 14 handler chia 4 nhóm
 */
export class TelePrescriptionController {

    // ═══ NHÓM 1: Kê đơn ═══

    /** POST /prescriptions/:consultationId */
    static createPrescription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TelePrescriptionService.createPrescription(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RX_SUCCESS.PRESCRIPTION_CREATED, data: result });
    });

    /** POST /prescriptions/:consultationId/items */
    static addItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TelePrescriptionService.addItem(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RX_SUCCESS.ITEM_ADDED, data: result });
    });

    /** DELETE /prescriptions/:consultationId/items/:detailId */
    static removeItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TelePrescriptionService.removeItem(String(req.params.consultationId), String(req.params.detailId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.ITEM_REMOVED });
    });

    /** PUT /prescriptions/:consultationId/prescribe */
    static prescribe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TelePrescriptionService.prescribe(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.PRESCRIBED });
    });

    /** GET /prescriptions/:consultationId */
    static getDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TelePrescriptionService.getDetail(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 2: Gửi đơn & Kiểm soát ═══

    /** PUT /prescriptions/:consultationId/send */
    static sendToPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TelePrescriptionService.sendToPatient(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.SENT_TO_PATIENT });
    });

    /** GET /prescriptions/:consultationId/stock-check */
    static checkStock = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TelePrescriptionService.checkStock(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.STOCK_CHECKED, data: result });
    });

    /** GET /prescriptions/drug-restrictions */
    static getDrugRestrictions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TelePrescriptionService.getDrugRestrictions();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 3: Chỉ định XN & Tái khám ═══

    /** POST /prescriptions/:consultationId/lab-orders */
    static createLabOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TelePrescriptionService.createLabOrder(String(req.params.consultationId), req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RX_SUCCESS.LAB_ORDER_CREATED, data: result });
    });

    /** GET /prescriptions/:consultationId/lab-orders */
    static getLabOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TelePrescriptionService.getLabOrders(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** PUT /prescriptions/:consultationId/referral */
    static updateReferral = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TelePrescriptionService.updateReferral(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.REFERRAL_UPDATED });
    });

    // ═══ NHÓM 4: Tra cứu ═══

    /** GET /prescriptions */
    static listPrescriptions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                status: req.query.status as string,
                doctor_id: req.query.doctor_id as string,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TelePrescriptionService.listPrescriptions(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /prescriptions/patient/:patientId */
    static getPatientPrescriptions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TelePrescriptionService.getPatientPrescriptions(String(req.params.patientId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /prescriptions/:consultationId/summary */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TelePrescriptionService.getSummary(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });
}
