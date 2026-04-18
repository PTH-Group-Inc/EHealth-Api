import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { PatientDocumentService } from '../../services/Patient Management/patient-document.service';
import {
    CreatePatientDocumentInput,
    UpdatePatientDocumentInput
} from '../../models/Patient Management/patient-document.model';
import { DOCUMENT_MESSAGES, DOCUMENT_VERSION_MESSAGES } from '../../constants/document.constant';

export class PatientDocumentController {
    /**
     * Upload tài liệu bệnh nhân (multipart/form-data)
     */
    static upload = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreatePatientDocumentInput = {
                patient_id: req.params.patientId || req.body.patient_id,
                document_type_id: req.body.document_type_id,
                document_name: req.body.document_name,
                notes: req.body.notes,
            };
            const file = req.file as Express.Multer.File;
            const uploadedBy = (req as any).user?.userId || null;

            const data = await PatientDocumentService.upload(input, file, uploadedBy);
            res.status(201).json({
                success: true,
                message: DOCUMENT_MESSAGES.DOC_UPLOAD_SUCCESS,
                data
            });
    });

    /**
     * Danh sách tài liệu bệnh nhân (phân trang, filter)
     */
    static getList = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = (req.params.patientId || req.query.patient_id) as string;
            const documentTypeId = (req.query.document_type_id as string) || null;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await PatientDocumentService.getByPatient(patientId, documentTypeId, page, limit);
            res.status(200).json({ success: true, ...result });
    });

    /**
     * Chi tiết tài liệu
     */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientDocumentService.getById(id);
            res.status(200).json({ success: true, data });
    });

    /**
     * Cập nhật metadata tài liệu
     */
    static updateMetadata = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdatePatientDocumentInput = req.body;

            // Capture old value cho audit middleware
            const oldDoc = await PatientDocumentService.getById(id);
            (req as any).auditOldValue = oldDoc;

            const data = await PatientDocumentService.updateMetadata(id, input);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.DOC_UPDATE_SUCCESS,
                data
            });
    });

    /**
     * Xóa mềm tài liệu
     */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await PatientDocumentService.delete(id);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.DOC_DELETE_SUCCESS
            });
    });

    /**
     * Upload phiên bản mới cho tài liệu
     */
    static uploadVersion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const file = req.file as Express.Multer.File;
            const uploadedBy = (req as any).user?.userId || null;

            const data = await PatientDocumentService.uploadNewVersion(id, file, uploadedBy);
            res.status(201).json({
                success: true,
                message: DOCUMENT_VERSION_MESSAGES.VERSION_UPLOAD_SUCCESS,
                data
            });
    });

    /**
     * Lấy lịch sử tất cả phiên bản của tài liệu
     */
    static listVersions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientDocumentService.getVersionHistory(id);
            res.status(200).json({ success: true, data });
    });

    /**
     * Chi tiết 1 phiên bản cụ thể
     */
    static getVersion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id, versionId } = req.params as { id: string; versionId: string };
            const data = await PatientDocumentService.getVersionById(id, versionId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Xem tài liệu trực tiếp (inline — trình duyệt hiển thị, không tải về)
     */
    static viewFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const fileUrl = await PatientDocumentService.getFileUrl(id);
            res.redirect(302, fileUrl);
    });

    /**
     * Ép trình duyệt tải file về máy (download attachment).
     * Dùng Cloudinary transformation flag fl_attachment để ép download.
     */
    static downloadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const fileUrl = await PatientDocumentService.getFileUrl(id);

            // Thêm fl_attachment vào URL Cloudinary để ép trình duyệt tải file
            const downloadUrl = fileUrl.includes('cloudinary.com')
                ? fileUrl.replace('/upload/', '/upload/fl_attachment/')
                : fileUrl;

            res.redirect(302, downloadUrl);
    });
}
