import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleConsultationTypeService } from '../../services/Remote Consultation/tele-consultation-type.service';
import { REMOTE_CONSULTATION_CONFIG, REMOTE_CONSULTATION_SUCCESS } from '../../constants/remote-consultation.constant';

export class TeleConsultationTypeController {

    // ═══ NHÓM 1: QUẢN LÝ LOẠI HÌNH ═══

    static createType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await TeleConsultationTypeService.createType(req.body, userId);
            res.status(201).json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.TYPE_CREATED, data });
    });

    static getTypes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { is_active, keyword } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT;
            const data = await TeleConsultationTypeService.getTypes(
                is_active as string, keyword as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    static getTypeById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.getTypeById(String(req.params.typeId));
            res.json({ success: true, data });
    });

    static updateType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.updateType(String(req.params.typeId), req.body);
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.TYPE_UPDATED, data });
    });

    static deleteType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleConsultationTypeService.deleteType(String(req.params.typeId));
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.TYPE_DELETED });
    });

    static getActiveTypes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.getActiveTypes();
            res.json({ success: true, data });
    });

    // ═══ NHÓM 2: CẤU HÌNH CHUYÊN KHOA ═══

    static createConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await TeleConsultationTypeService.createConfig(req.body, userId);
            res.status(201).json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.CONFIG_CREATED, data });
    });

    static getConfigs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { type_id, specialty_id, facility_id, is_enabled, is_active } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT;
            const data = await TeleConsultationTypeService.getConfigs(
                type_id as string, specialty_id as string, facility_id as string,
                is_enabled as string, is_active as string, page, limit
            );
            res.json({ success: true, ...data });
    });

    static getConfigById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.getConfigById(String(req.params.configId));
            res.json({ success: true, data });
    });

    static updateConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.updateConfig(String(req.params.configId), req.body);
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.CONFIG_UPDATED, data });
    });

    static deleteConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await TeleConsultationTypeService.deleteConfig(String(req.params.configId));
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.CONFIG_DELETED });
    });

    static getSpecialtiesByType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.getSpecialtiesByType(
                String(req.params.typeId), req.query.facility_id as string
            );
            res.json({ success: true, data });
    });

    static getTypesBySpecialty = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.getTypesBySpecialty(
                String(req.params.specialtyId), req.query.facility_id as string
            );
            res.json({ success: true, data });
    });

    static batchCreateConfigs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await TeleConsultationTypeService.batchCreateConfigs(req.body, userId);
            res.status(201).json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.BATCH_CREATED, data });
    });

    // ═══ NHÓM 3: TRA CỨU & THỐNG KÊ ═══

    static checkAvailability = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.checkAvailability(
                req.query.specialty_id as string, req.query.facility_id as string
            );
            res.json({ success: true, data });
    });

    static getStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await TeleConsultationTypeService.getStats();
            res.json({ success: true, data });
    });
}
