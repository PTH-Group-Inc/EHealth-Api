import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ClinicalResultsService } from '../../services/EHR/clinical-results.service';
import { CR_SUCCESS } from '../../constants/clinical-results.constant';


export class ClinicalResultsController {

    /** API 1: Danh sách kết quả CLS */
    static getResults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                order_type: req.query.order_type as string | undefined,
                service_code: req.query.service_code as string | undefined,
                status: req.query.status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await ClinicalResultsService.getResults(patientId, filters);
            res.status(200).json({ success: true, message: CR_SUCCESS.RESULTS_FETCHED, ...data });
    });

    /** API 2: Chi tiết kết quả */
    static getResultDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const orderId = req.params.orderId as string;
            const data = await ClinicalResultsService.getResultDetail(patientId, orderId);
            res.status(200).json({ success: true, message: CR_SUCCESS.RESULT_DETAIL_FETCHED, data });
    });

    /** API 3: Kết quả theo encounter */
    static getResultsByEncounter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const encounterId = req.params.encounterId as string;
            const data = await ClinicalResultsService.getResultsByEncounter(patientId, encounterId);
            res.status(200).json({ success: true, message: CR_SUCCESS.ENCOUNTER_RESULTS_FETCHED, data });
    });

    /** API 4: Xu hướng */
    static getTrends = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const serviceCode = req.query.service_code as string;
            const data = await ClinicalResultsService.getTrends(patientId, serviceCode);
            res.status(200).json({ success: true, message: CR_SUCCESS.TRENDS_FETCHED, data });
    });

    /** API 5: Thống kê tổng quan */
    static getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await ClinicalResultsService.getSummary(patientId);
            res.status(200).json({ success: true, message: CR_SUCCESS.SUMMARY_FETCHED, data });
    });

    /** API 6: File đính kèm */
    static getAttachments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await ClinicalResultsService.getAttachments(patientId);
            res.status(200).json({ success: true, message: CR_SUCCESS.ATTACHMENTS_FETCHED, data });
    });

    /** API 7: Kết quả bất thường */
    static getAbnormalResults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await ClinicalResultsService.getAbnormalResults(patientId);
            res.status(200).json({ success: true, message: CR_SUCCESS.ABNORMAL_FETCHED, data });
    });
}
