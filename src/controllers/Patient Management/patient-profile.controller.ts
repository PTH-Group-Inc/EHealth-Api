/**
 * Patient Profile Controller (Multi-Profile)
 *
 * Module 1 — Multi-Patient Profiles
 * Endpoint: /api/patient/profiles/*
 *
 * Tất cả endpoints yêu cầu authentication (verifyAccessToken).
 * accountId được lấy từ JWT payload (req.auth.user_id).
 */

import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { PatientProfileService } from '../../services/Patient Management/patient-profile.service';

function getAccountId(req: Request): string {
    const accountId = (req as any).auth?.user_id;
    if (!accountId) {
        throw new Error('Không xác định được tài khoản đăng nhập');
    }
    return accountId;
}

function handleError(res: Response, error: any) {
    const message = error?.message || 'Có lỗi xảy ra';
    const status =
        message.includes('Không tìm thấy') || message.includes('không tồn tại') ? 404 :
        message.includes('không hợp lệ') || message.includes('bắt buộc') || message.includes('không được bỏ trống') ? 400 :
        message.includes('không có quyền') || message.includes('Thiếu accountId') ? 403 :
        message.includes('đã tồn tại') ? 409 :
        500;
    return res.status(status).json({ success: false, message });
}

export class PatientProfileController {
    /**
     * GET /api/patient/profiles
     * Lấy danh sách tất cả hồ sơ bệnh nhân của tài khoản đang đăng nhập
     */
    static getMyProfiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const profiles = await PatientProfileService.getMyProfiles(accountId);
            return res.json({
                success: true,
                data: profiles,
                total: profiles.length,
            });
    });

    /**
     * GET /api/patient/profiles/default
     * Lấy hồ sơ mặc định của tài khoản
     */
    static getDefaultProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const profile = await PatientProfileService.getDefaultProfile(accountId);
            return res.json({
                success: true,
                data: profile,
            });
    });

    /**
     * GET /api/patient/profiles/:id
     * Lấy chi tiết 1 hồ sơ bệnh nhân
     */
    static getProfileById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const id = req.params.id as string;
            const profile = await PatientProfileService.getProfileById(id, accountId);
            return res.json({
                success: true,
                data: profile,
            });
    });

    /**
     * POST /api/patient/profiles
     * Tạo hồ sơ bệnh nhân mới (cho bản thân hoặc người thân)
     */
    static createProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const profile = await PatientProfileService.createProfile(accountId, req.body);
            return res.status(201).json({
                success: true,
                data: profile,
                message: 'Tạo hồ sơ bệnh nhân thành công',
            });
    });

    /**
     * PUT /api/patient/profiles/:id
     * Cập nhật thông tin hồ sơ bệnh nhân
     */
    static updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const id = req.params.id as string;
            const updated = await PatientProfileService.updateProfile(id, accountId, req.body);
            return res.json({
                success: true,
                data: updated,
                message: 'Cập nhật hồ sơ thành công',
            });
    });

    /**
     * DELETE /api/patient/profiles/:id
     * Ngừng sử dụng hồ sơ (soft delete)
     */
    static deleteProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const id = req.params.id as string;
            await PatientProfileService.deleteProfile(id, accountId);
            return res.json({
                success: true,
                message: 'Đã ngừng sử dụng hồ sơ bệnh nhân',
            });
    });

    /**
     * PATCH /api/patient/profiles/:id/set-default
     * Đặt hồ sơ làm mặc định khi đặt lịch
     */
    static setDefault = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const id = req.params.id as string;
            const updated = await PatientProfileService.setDefaultProfile(id, accountId);
            return res.json({
                success: true,
                data: updated,
                message: 'Đã đặt làm hồ sơ mặc định',
            });
    });

    /**
     * PUT /api/patient/profiles/:id/relationship
     * Cập nhật quan hệ với chủ tài khoản
     */
    static updateRelationship = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const accountId = getAccountId(req);
            const id = req.params.id as string;
            const { relationship } = req.body;
            const updated = await PatientProfileService.updateRelationship(id, accountId, relationship);
            return res.json({
                success: true,
                data: updated,
                message: 'Cập nhật quan hệ thành công',
            });
    });
}
