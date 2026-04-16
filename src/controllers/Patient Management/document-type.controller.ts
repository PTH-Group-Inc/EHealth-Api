import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DocumentTypeService } from '../../services/Patient Management/document-type.service';
import {
    CreateDocumentTypeInput,
    UpdateDocumentTypeInput
} from '../../models/Patient Management/document-type.model';
import { DOCUMENT_MESSAGES } from '../../constants/document.constant';

export class DocumentTypeController {
    /**
     * Lấy danh sách loại tài liệu
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DocumentTypeService.getAll();
            res.status(200).json({ success: true, data });
    });

    /**
     * Tạo mới loại tài liệu
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreateDocumentTypeInput = req.body;
            const data = await DocumentTypeService.create(input);
            res.status(201).json({
                success: true,
                message: DOCUMENT_MESSAGES.TYPE_CREATE_SUCCESS,
                data
            });
    });

    /**
     * Cập nhật loại tài liệu
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdateDocumentTypeInput = req.body;
            const data = await DocumentTypeService.update(id, input);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.TYPE_UPDATE_SUCCESS,
                data
            });
    });

    /**
     * Xóa mềm loại tài liệu
     */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await DocumentTypeService.delete(id);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.TYPE_DELETE_SUCCESS
            });
    });
}
