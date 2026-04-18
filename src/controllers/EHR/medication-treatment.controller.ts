import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedicationTreatmentService } from '../../services/EHR/medication-treatment.service';
import { MT_SUCCESS } from '../../constants/medication-treatment.constant';


export class MedicationTreatmentController {

    /** API 1: Lịch sử đơn thuốc */
    static getMedicationRecords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                status: req.query.status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await MedicationTreatmentService.getMedicationRecords(patientId, filters);
            res.status(200).json({ success: true, message: MT_SUCCESS.MEDICATIONS_FETCHED, ...data });
    });

    /** API 2: Chi tiết đơn thuốc */
    static getMedicationDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const prescriptionId = req.params.prescriptionId as string;
            const data = await MedicationTreatmentService.getMedicationDetail(patientId, prescriptionId);
            res.status(200).json({ success: true, message: MT_SUCCESS.MEDICATION_DETAIL_FETCHED, data });
    });

    /** API 3: Thuốc đang sử dụng */
    static getCurrentMedications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await MedicationTreatmentService.getCurrentMedications(patientId);
            res.status(200).json({ success: true, message: MT_SUCCESS.CURRENT_MEDS_FETCHED, data });
    });

    /** API 4: Lịch sử điều trị */
    static getTreatmentRecords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                status: req.query.status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await MedicationTreatmentService.getTreatmentRecords(patientId, filters);
            res.status(200).json({ success: true, message: MT_SUCCESS.TREATMENTS_FETCHED, ...data });
    });

    /** API 5: Chi tiết kế hoạch điều trị */
    static getTreatmentDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const planId = req.params.planId as string;
            const data = await MedicationTreatmentService.getTreatmentDetail(patientId, planId);
            res.status(200).json({ success: true, message: MT_SUCCESS.TREATMENT_DETAIL_FETCHED, data });
    });

    /** API 6: Cảnh báo tương tác */
    static checkInteractions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await MedicationTreatmentService.checkInteractions(patientId);
            res.status(200).json({ success: true, message: MT_SUCCESS.INTERACTIONS_FETCHED, data });
    });

    /** API 7: Ghi nhận tuân thủ */
    static createAdherence = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicationTreatmentService.createAdherence(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MT_SUCCESS.ADHERENCE_CREATED, data });
    });

    /** API 8: Lịch sử tuân thủ */
    static getAdherenceRecords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;
            const data = await MedicationTreatmentService.getAdherenceRecords(patientId, fromDate, toDate);
            res.status(200).json({ success: true, message: MT_SUCCESS.ADHERENCE_FETCHED, ...data });
    });

    /** API 9: Timeline */
    static getTimeline = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await MedicationTreatmentService.getTimeline(patientId);
            res.status(200).json({ success: true, message: MT_SUCCESS.TIMELINE_FETCHED, data });
    });
}
