import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { StaffService } from '../../services/Facility Management/staff.service';
import { LicenseService } from '../../services/Facility Management/license.service';
import { DoctorInfoService } from '../../services/Facility Management/doctor-info.service';
import { UserService } from '../../services/Facility Management/user.service';
import { UserFacilityService } from '../../services/Facility Management/user-facility.service';
import { CreateStaffInput, UpdateStaffInput, UpdateDoctorInfoInput } from '../../models/Facility Management/staff.model';
import { UpdateUserStatusInput, AssignRoleInput } from '../../models/Core/user.model';
import { AssignUserFacilityInput } from '../../models/Facility Management/facility.model';
import { AppError } from '../../utils/app-error.util';
import path from 'path';

export class StaffController {
    static getStaffs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filter = {
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
                search: req.query.search as string,
                status: req.query.status as string,
                role: req.query.role as string,
                branch_id: req.query.branch_id as string,
                facility_id: req.query.facility_id as string,
                specialty_id: req.query.specialty_id as string,
                service_id: req.query.service_id as string,
                gender: req.query.gender as string,
                min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
                max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
            };

            const data = await StaffService.getStaffs(filter);
            res.status(200).json({ status: 'success', data });
    });

    static getStaffById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const data = await StaffService.getStaffById(userId);
            res.status(200).json({ status: 'success', data });
    });

    static createStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreateStaffInput = req.body;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            // Yêu cầu roles
            if (!input.roles || input.roles.length === 0) {
                throw new AppError(400, 'MISSING_ROLES', 'Bắt buộc chọn ít nhất một vai trò (DOCTOR, NURSE...).');
            }

            const data = await StaffService.createStaff(
                input,
                adminId,
                req.ip || req.connection.remoteAddress || null,
                req.get('User-Agent') || null
            );
            res.status(201).json({ status: 'success', message: 'Tạo hồ sơ nhân sự thành công.', data });
    });

    static updateStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const input: UpdateStaffInput = req.body;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            await StaffService.updateStaff(
                userId,
                input,
                adminId,
                req.ip || req.connection.remoteAddress || null,
                req.get('User-Agent') || null
            );

            res.status(200).json({ status: 'success', message: 'Cập nhật thông tin nhân sự thành công.' });
    });

    static updateSignature = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const file = req.file;

            if (!file) {
                throw new AppError(400, 'MISSING_FILE', 'Vui lòng cung cấp file ảnh chữ ký để upload.');
            }

            const signatureUrl = `/uploads/${file.filename}`;

            await StaffService.updateSignature(userId, signatureUrl);

            res.status(200).json({
                status: 'success',
                message: 'Cập nhật ảnh chữ ký thành công.',
                data: { signature_url: signatureUrl }
            });
    });

    // --- BẰNG CẤP CHỨNG CHỈ (LICENSES) ---

    /**
     * Lấy danh sách bằng cấp / chứng chỉ theo nhân viên.
     */
    static getLicensesByUserId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const data = await LicenseService.getLicenses({ user_id: userId });
            res.status(200).json({ status: 'success', data });
    });

    /**
     * Lấy chi tiết chứng chỉ theo ID
     */
    static getLicenseById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const licenseId = req.params.licenseId as string;
            const data = await LicenseService.getLicenseById(licenseId);
            res.status(200).json({ status: 'success', data });
    });

    /**
     * Tạo chứng chỉ cho nhân viên.
     * Lấy user_id từ URL param để chống payload spoofing.
     */
    static createLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const { license_type, license_number, issue_date, expiry_date, issued_by, document_url } = req.body;

            if (!license_type || !license_number || !issue_date) {
                throw new AppError(400, 'MISSING_DATA', 'Thiếu thông tin bắt buộc: license_type, license_number, issue_date.');
            }

            const data = await LicenseService.createLicense({
                user_id: userId,
                license_type,
                license_number,
                issue_date,
                expiry_date: expiry_date || null,
                issued_by: issued_by || null,
                document_url: document_url || null,
            });
            res.status(201).json({ status: 'success', message: 'Thêm chứng chỉ thành công.', data });
    });

    /**
     * Cập nhật chứng chỉ
     */
    static updateLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const licenseId = req.params.licenseId as string;
            const { license_type, license_number, issue_date, expiry_date, issued_by, document_url } = req.body;
            const data = await LicenseService.updateLicense(licenseId, {
                license_type, license_number, issue_date, expiry_date, issued_by, document_url,
            });
            res.status(200).json({ status: 'success', message: 'Cập nhật chứng chỉ thành công.', data });
    });

    /**
     * Xóa chứng chỉ (Soft Delete)
     */
    static deleteLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const licenseId = req.params.licenseId as string;
            await LicenseService.deleteLicense(licenseId);
            res.status(200).json({ status: 'success', message: 'Xóa chứng chỉ thành công.' });
    });

    // --- CHUYÊN MÔN BÁC SĨ ---
    /*
    / Cập nhật thông tin chuyên môn bác sĩ
    */
    static updateDoctorInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const input: UpdateDoctorInfoInput = req.body;
            await DoctorInfoService.updateDoctorInfo(userId, input);
            res.status(200).json({ status: 'success', message: 'Cập nhật thông tin chuyên khoa Bác sĩ thành công.' });
    });

    // --- QUẢN LÝ TRẠNG THÁI ---
    /*
    / Cập nhật trạng thái nhân sự
    */
    static updateStaffStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const input: UpdateUserStatusInput = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            await UserService.updateUserStatus(userId, input, adminId, ipAddress, userAgent);
            res.status(200).json({ status: 'success', message: 'Cập nhật trạng thái nhân sự thành công.' });
    });

    // --- QUẢN LÝ VAI TRÒ ---
    /*
    / Gán vai trò cho nhân sự
    */
    static assignStaffRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const input: AssignRoleInput = req.body;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            await UserService.assignRole(userId, input, adminId);
            res.status(200).json({ status: 'success', message: 'Cấp quyền vai trò thành công.' });
    });

    /*
    / Thu hồi vai trò của nhân sự
    */
    static removeStaffRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const roleId = req.params.roleId as string;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            await UserService.removeRole(userId, roleId, adminId);
            res.status(200).json({ status: 'success', message: 'Thu hồi vai trò thành công.' });
    });

    // --- QUẢN LÝ CHI NHÁNH / KHÁM CHỮA BỆNH ---
    /*
    / Gán nhân sự vào chi nhánh / phòng ban
    */
    static assignStaffFacility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const input: AssignUserFacilityInput = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            await UserFacilityService.assignUserToFacility(userId, input, adminId, ipAddress, userAgent);
            res.status(200).json({ status: 'success', message: 'Phân công nhân sự vào chi nhánh thành công.' });
    });

    /*
    / Xóa phân công nhân sự khỏi chi nhánh
    */
    static removeStaffFacility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.params.staffId as string;
            const branchId = req.params.branchId as string;
            const { reason } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;
            const adminId = (req as any).auth?.user_id || 'SYSTEM';

            await UserFacilityService.removeUserFromFacility(userId, branchId, reason || 'Điều chuyển công tác', adminId, ipAddress, userAgent);
            res.status(200).json({ status: 'success', message: 'Xóa phân công nhân sự tại chi nhánh thành công.' });
    });
}
