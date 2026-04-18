// src/controllers/Facility Management/license.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { LicenseService } from '../../services/Facility Management/license.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class LicenseController {

    /**
     * Tạo giấy phép mới
     */
    static createLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { user_id, license_type, license_number, issue_date, expiry_date, issued_by, document_url } = req.body;

            if (!user_id || !license_type || !license_number || !issue_date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATA', 'Thiếu thông tin bắt buộc: user_id, license_type, license_number, issue_date.');
            }

            const license = await LicenseService.createLicense({
                user_id, license_type, license_number, issue_date,
                expiry_date: expiry_date || null,
                issued_by: issued_by || null,
                document_url: document_url || null
            });

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Tạo giấy phép thành công',
                data: license
            });
    });

    /**
     * Lấy danh sách giấy phép
     */
    static getLicenses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { user_id, license_type, expiring_in_days } = req.query;

            const licenses = await LicenseService.getLicenses({
                user_id: user_id?.toString(),
                license_type: license_type?.toString(),
                expiring_in_days: expiring_in_days ? Number(expiring_in_days) : undefined
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy danh sách giấy phép thành công',
                data: licenses
            });
    });

    /**
     * Chi tiết 1 giấy phép
     */
    static getLicenseById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const license = await LicenseService.getLicenseById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: license });
    });

    /**
     * Cập nhật giấy phép
     */
    static updateLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { license_type, license_number, issue_date, expiry_date, issued_by, document_url } = req.body;
            const updated = await LicenseService.updateLicense(req.params.id as string, {
                license_type, license_number, issue_date, expiry_date, issued_by, document_url
            });
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật giấy phép thành công', data: updated });
    });

    /**
     * Xóa / disable giấy phép
     */
    static deleteLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await LicenseService.deleteLicense(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa giấy phép thành công' });
    });

    /**
     * Upload file giấy phép (PDF, JPG, PNG)
     */
    static uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, code: 'LIC_FILE_001', message: 'Không tìm thấy file tải lên. Vui lòng chọn file PDF, JPG hoặc PNG.' });
            }
            const result = await LicenseService.uploadLicenseFile(req.params.id as string, req.file);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Upload file giấy phép thành công', data: result });
    });

    /**
     * Xem file giấy phép (trả URL)
     */
    static getFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await LicenseService.getLicenseFile(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /**
     * Xóa file giấy phép (Cloudinary + DB)
     */
    static deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await LicenseService.deleteLicenseFile(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa file giấy phép thành công' });
    });

    /**
     * Dashboard: Danh sách giấy phép sắp hết hạn
     */
    static getExpiringLicenses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const days = req.query.days ? Number(req.query.days) : 30;
            const data = await LicenseService.getExpiringLicenses(days);
            res.status(HTTP_STATUS.OK).json({ success: true, message: `Danh sách giấy phép sắp hết hạn trong ${days} ngày`, data });
    });

    /**
     * Dashboard: Danh sách giấy phép đã hết hạn
     */
    static getExpiredLicenses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await LicenseService.getExpiredLicenses();
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Danh sách giấy phép đã hết hạn', data });
    });
}
