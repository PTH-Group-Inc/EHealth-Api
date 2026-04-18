import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { ProfileService } from '../../services/Core/profile.service';
import { UpdateProfileInput, ChangePasswordInput, UpdateSettingsInput } from '../../models/Core/profile.model';
import { AVATAR_ERRORS, AVATAR_SUCCESS } from '../../constants/system.constant';

export class ProfileController {
    /**
     * Xem hồ sơ cá nhân
     */
    static getMyProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const profile = await ProfileService.getMyProfile(userId!);

            res.status(200).json({
                success: true,
                message: 'Lấy thông tin hồ sơ thành công.',
                data: profile
            });
    });

    /**
     * Cập nhật thông tin hồ sơ cơ bản
     */
    static updateMyProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data: UpdateProfileInput = req.body;

            const profile = await ProfileService.updateMyProfile(userId!, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật hồ sơ thành công.',
                data: profile
            });
    });

    /**
     * Đổi mật khẩu
     */
    static changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data: ChangePasswordInput = req.body;

            await ProfileService.changePassword(userId!, data);

            res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị.'
            });
    });

    /**
     * Xem danh sách các phiên đăng nhập đang Active
     */
    static getMySessions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const currentSessionId = (req as any).auth?.sessionId;

            const sessions = await ProfileService.getMySessions(userId!, currentSessionId!);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách phiên bản đăng nhập thành công.',
                data: sessions
            });
    });

    /**
     * Đăng xuất/Thu hồi một thiết bị cụ thể 
     */
    static revokeSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const currentSessionId = (req as any).auth?.sessionId;
            const sessionId = req.params.sessionId as string;

            await ProfileService.revokeSession(userId!, sessionId, currentSessionId!);

            res.status(200).json({
                success: true,
                message: 'Đã thu hồi phiên bản đăng nhập thành công.'
            });
    });

    /**
     * Đăng xuất tất cả thiết bị khác
     */
    static revokeAllOtherSessions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const currentSessionId = (req as any).auth?.sessionId;

            await ProfileService.revokeAllOtherSessions(userId!, currentSessionId!);

            res.status(200).json({
                success: true,
                message: 'Đã thu hồi tất cả các thiết bị đăng nhập khác thành công.'
            });
    });

    /**
     * Cập nhật Cài đặt cá nhân
     */
    static updateMySettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data: UpdateSettingsInput = req.body;

            const profile = await ProfileService.updateMySettings(userId!, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật cài đặt cá nhân thành công.',
                data: profile
            });
    });

    // ======================= AVATAR MANAGEMENT =======================

    /**
     * POST /api/profile/avatar — Upload 1 ảnh đại diện lên Cloudinary
     */
    static uploadAvatar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const file = req.file;

            if (!file) {
                res.status(AVATAR_ERRORS.FILE_MISSING.httpCode).json({
                    success: false,
                    code: AVATAR_ERRORS.FILE_MISSING.code,
                    message: AVATAR_ERRORS.FILE_MISSING.message,
                });
                return;
            }

            const image = await ProfileService.uploadAvatar(userId!, file);

            res.status(200).json({
                success: true,
                message: AVATAR_SUCCESS.UPLOADED,
                data: image,
            });
    });

    /**
     * DELETE /api/profile/avatar — Xóa 1 ảnh đại diện theo public_id
     */
    static deleteAvatar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const { public_id } = req.body;

            if (!public_id) {
                res.status(400).json({
                    success: false,
                    code: 'AVT_MISSING_ID',
                    message: 'Vui lòng cung cấp public_id của ảnh cần xóa.',
                });
                return;
            }

            await ProfileService.deleteAvatar(userId!, public_id);

            res.status(200).json({
                success: true,
                message: AVATAR_SUCCESS.DELETED,
            });
    });
}
