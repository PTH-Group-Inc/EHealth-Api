import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AiRagService } from '../../services/AI Health/ai-rag.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { AI_SUCCESS } from '../../constants/AI Health/ai-health-chat.constant';

export class AiRagController {

    /**
     * POST /api/ai/rag/documents
     * Upload tài liệu PDF vào knowledge base
     */
    static uploadDocument = asyncHandler(async (req: Request, res: Response) => {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'FILE_REQUIRED', 'Vui lòng upload file PDF.');
        }

        if (file.mimetype !== 'application/pdf') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_FILE_TYPE', 'Chỉ hỗ trợ file PDF.');
        }

        const auth = (req as any).auth;
        const document_category = req.body.document_category ? String(req.body.document_category) : undefined;

        const doc = await AiRagService.uploadAndProcess({
            file_name: file.originalname,
            file_buffer: file.buffer,
            file_size_bytes: file.size,
            uploaded_by: auth?.user_id as string | undefined,
            document_category,
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: AI_SUCCESS.DOC_UPLOADED,
            data: doc,
        });
    });

    /**
     * GET /api/ai/rag/documents
     * Danh sách tài liệu trong knowledge base
     */
    static listDocuments = asyncHandler(async (req: Request, res: Response) => {
        const category = req.query.category ? String(req.query.category) : undefined;
        const docs = await AiRagService.listDocuments(category);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: docs,
        });
    });

    /**
     * GET /api/ai/rag/documents/:docId
     * Chi tiết một tài liệu
     */
    static getDocument = asyncHandler(async (req: Request, res: Response) => {
        const docId = String(req.params.docId);
        const doc = await AiRagService.getDocument(docId);
        if (!doc) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOC_NOT_FOUND', 'Không tìm thấy tài liệu.');

        res.status(HTTP_STATUS.OK).json({ success: true, data: doc });
    });

    /**
     * DELETE /api/ai/rag/documents/:docId
     * Xóa tài liệu
     */
    static deleteDocument = asyncHandler(async (req: Request, res: Response) => {
        const docId = String(req.params.docId);
        const doc = await AiRagService.getDocument(docId);
        if (!doc) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOC_NOT_FOUND', 'Không tìm thấy tài liệu.');

        await AiRagService.deleteDocument(docId);

        res.status(HTTP_STATUS.OK).json({ success: true, message: AI_SUCCESS.DOC_DELETED });
    });

    /**
     * POST /api/ai/rag/search-test
     * Test tìm kiếm knowledge base (Admin only)
     */
    static searchTest = asyncHandler(async (req: Request, res: Response) => {
        const { query, top_k } = req.body;
        if (!query?.trim()) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'QUERY_REQUIRED', 'Vui lòng nhập câu hỏi.');

        const results = await AiRagService.search(query.trim(), top_k ?? 5);

        res.status(HTTP_STATUS.OK).json({ success: true, data: results });
    });
}
