import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { PatientTagService } from '../../services/Patient Management/patient-tag.service';
import {
    TAG_MESSAGES,
    PATIENT_TAG_MESSAGES,
    TAG_PAGINATION
} from '../../constants/patient-tag.constant';

export class PatientTagController {


    /** Tạo mới Tag */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await PatientTagService.create(req.body);
            res.status(201).json({ success: true, message: TAG_MESSAGES.CREATE_SUCCESS, data });
    });

    /** Danh sách Tag */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string, 10) || TAG_PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string, 10) || TAG_PAGINATION.DEFAULT_LIMIT;
            const isActive = req.query.is_active !== undefined
                ? req.query.is_active === 'true'
                : undefined;

            const result = await PatientTagService.getAll(page, limit, isActive);
            res.status(200).json({ success: true, ...result });
    });

    /** Chi tiết Tag */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientTagService.getById(id);
            res.status(200).json({ success: true, data });
    });

    /** Cập nhật Tag */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientTagService.update(id, req.body);
            res.status(200).json({ success: true, message: TAG_MESSAGES.UPDATE_SUCCESS, data });
    });

    /** Xóa mềm Tag */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await PatientTagService.delete(id);
            res.status(200).json({ success: true, message: TAG_MESSAGES.DELETE_SUCCESS });
    });

    /** Gắn tag cho bệnh nhân */
    static assignTag = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const { tag_id } = req.body;
            const assignedBy = (req as any).user?.userId || null;

            const data = await PatientTagService.assignTag(patientId, tag_id, assignedBy);
            res.status(201).json({ success: true, message: PATIENT_TAG_MESSAGES.ASSIGN_SUCCESS, data });
    });

    /** Danh sách tag của bệnh nhân */
    static getPatientTags = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientTagService.getPatientTags(patientId);
            res.status(200).json({ success: true, data });
    });

    /** Gỡ tag khỏi bệnh nhân */
    static removeTag = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId, tagId } = req.params as { patientId: string; tagId: string };
            await PatientTagService.removeTag(patientId, tagId);
            res.status(200).json({ success: true, message: PATIENT_TAG_MESSAGES.REMOVE_SUCCESS });
    });
}
