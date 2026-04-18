import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedicalHistoryEhrService } from '../../services/EHR/medical-history-ehr.service';
import { MH_EHR_SUCCESS } from '../../constants/medical-history-ehr.constant';


export class MedicalHistoryEhrController {

    //  NHÓM A: TIỀN SỬ BỆNH 

    static getHistories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                history_type: req.query.history_type as string | undefined,
                status: req.query.status as string | undefined,
                keyword: req.query.keyword as string | undefined,
            };
            const data = await MedicalHistoryEhrService.getHistories(patientId, filters);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORIES_FETCHED, data });
    });

    static getHistoryById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            const data = await MedicalHistoryEhrService.getHistoryById(patientId, historyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_FETCHED, data });
    });

    static createHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createHistory(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_CREATED, data });
    });

    static updateHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            const data = await MedicalHistoryEhrService.updateHistory(patientId, historyId, req.body);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_UPDATED, data });
    });

    static updateHistoryStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            const { status } = req.body;
            const data = await MedicalHistoryEhrService.updateHistoryStatus(patientId, historyId, status);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_STATUS_UPDATED, data });
    });

    static deleteHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            await MedicalHistoryEhrService.deleteHistory(patientId, historyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_DELETED });
    });

    //  NHÓM B: DỊ ỨNG 

    static getAllergies = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                allergen_type: req.query.allergen_type as string | undefined,
                severity: req.query.severity as string | undefined,
            };
            const data = await MedicalHistoryEhrService.getAllergies(patientId, filters);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGIES_FETCHED, data });
    });

    static getAllergyById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const allergyId = req.params.allergyId as string;
            const data = await MedicalHistoryEhrService.getAllergyById(patientId, allergyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_FETCHED, data });
    });

    static createAllergy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createAllergy(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_CREATED, data });
    });

    static updateAllergy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const allergyId = req.params.allergyId as string;
            const data = await MedicalHistoryEhrService.updateAllergy(patientId, allergyId, req.body);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_UPDATED, data });
    });

    static deleteAllergy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const allergyId = req.params.allergyId as string;
            await MedicalHistoryEhrService.deleteAllergy(patientId, allergyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_DELETED });
    });

    //  NHÓM C: YẾU TỐ NGUY CƠ 

    static getRiskFactors = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await MedicalHistoryEhrService.getRiskFactors(patientId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.RISKS_FETCHED, data });
    });

    static createRiskFactor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createRiskFactor(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.RISK_CREATED, data });
    });

    static updateRiskFactor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const factorId = req.params.factorId as string;
            const data = await MedicalHistoryEhrService.updateRiskFactor(patientId, factorId, req.body);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.RISK_UPDATED, data });
    });

    static deleteRiskFactor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const factorId = req.params.factorId as string;
            await MedicalHistoryEhrService.deleteRiskFactor(patientId, factorId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.RISK_DELETED });
    });

    //  NHÓM D: TÌNH TRẠNG ĐẶC BIỆT 

    static getSpecialConditions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await MedicalHistoryEhrService.getSpecialConditions(patientId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.SPECIALS_FETCHED, data });
    });

    static createSpecialCondition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createSpecialCondition(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.SPECIAL_CREATED, data });
    });

    static deleteSpecialCondition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const conditionId = req.params.conditionId as string;
            await MedicalHistoryEhrService.deleteSpecialCondition(patientId, conditionId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.SPECIAL_DELETED });
    });
}
