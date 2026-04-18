import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { ProfileRepository } from '../../repository/Core/profile.repository';
import { UserRepository } from '../../repository/Core/user.repository';
import { UserSessionRepository } from '../../repository/Core/auth_user-session.repository';
import { MasterDataItemRepository } from '../../repository/Core/master-data-item.repository';
import { AppError } from '../../utils/app-error.util';
import { UserProfileResponse, UpdateProfileInput, ChangePasswordInput, UpdateSettingsInput, SessionResponse, AvatarImage } from '../../models/Core/profile.model';
import { CLOUDINARY_CONFIG, AVATAR_CONFIG, AVATAR_ERRORS } from '../../constants/system.constant';
import logger from '../../config/logger.config';


// Khởi tạo Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export class ProfileService {
    /**
     * Lấy thông tin hồ sơ người dùng
     */
    static async getMyProfile(userId: string): Promise<UserProfileResponse> {
        const profile = await ProfileRepository.getProfileByUserId(userId);
        if (!profile) {
            throw new AppError(404, 'PROFILE_NOT_FOUND', 'Không tìm thấy thông tin hồ sơ người dùng.');
        }
        return profile;
    }

    /**
     * Cập nhật thông tin hồ sơ cá nhân
     */
    static async updateMyProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileResponse> {
        // Validation
        if (input.gender) {
            const genderItem = await MasterDataItemRepository.getItemByCode('GENDER', input.gender);
            if (!genderItem || !genderItem.is_active) {
                throw new AppError(400, 'PROFILE_INVALID_GENDER', 'Giới tính không hợp lệ theo quy chuẩn của Master Data.');
            }
        }

        // Thực hiện update
        const updated = await ProfileRepository.updateProfile(userId, input);
        if (!updated) {
            throw new AppError(400, 'PROFILE_UPDATE_FAILED', 'Cập nhật hồ sơ thất bại.');
        }

        return this.getMyProfile(userId);
    }

    /**
     * Thay đổi mật khẩu người dùng
     */
    static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
        // Lấy mật khẩu cũ để kiểm tra
        const currentHash = await UserRepository.getUserPasswordHash(userId);
        if (!currentHash) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại.');
        }

        // So khớp mật khẩu cũ
        const isMatch = await bcrypt.compare(input.old_password, currentHash);
        if (!isMatch) {
            throw new AppError(400, 'PASSWORD_INCORRECT', 'Mật khẩu cũ không chính xác.');
        }

        // Hash và cập nhật mật khẩu mới
        const newHash = await bcrypt.hash(input.new_password, 10);
        const updated = await UserRepository.updateUserPassword(userId, newHash);

        if (!updated) {
            throw new AppError(400, 'PASSWORD_UPDATE_FAILED', 'Cập nhật mật khẩu thất bại.');
        }

        await UserSessionRepository.revokeAllByAccount(userId);
    }

    /**
     * Lấy lịch sử phiên đăng nhập của người dùng
     */
    static async getMySessions(userId: string, currentSessionId: string): Promise<SessionResponse[]> {
        const sessions = await UserSessionRepository.findActiveByAccount(userId);

        return sessions.map((session: any) => ({
            user_sessions_id: session.user_sessions_id,
            device_name: session.device_name,
            ip_address: session.ip_address,
            last_used_at: session.last_used_at,
            expired_at: session.expired_at,
            revoked_at: session.revoked_at,
            is_current: session.user_sessions_id === currentSessionId
        }));
    }

    /**
     * Đăng xuất / thu hồi 1 thiết bị đăng nhập khác
     */
    static async revokeSession(userId: string, sessionIdToRevoke: string, currentSessionId: string): Promise<void> {
        if (sessionIdToRevoke === currentSessionId) {
            throw new AppError(400, 'SESSION_REVOKE_CURRENT', 'Không thể thu hồi phiên đăng nhập hiện tại bằng API này. Vui lòng dùng tính năng Đăng xuất.');
        }

        const success = await UserSessionRepository.revokeBySessionId(sessionIdToRevoke, userId);
        if (!success) {
            throw new AppError(404, 'SESSION_NOT_FOUND', 'Không tìm thấy phiên đăng nhập hoặc phiên đã bị thu hồi.');
        }
    }

    /**
     * Đăng xuất tất cả thiết bị khác
     */
    static async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
        const sessions = await UserSessionRepository.findActiveByAccount(userId);

        for (const session of sessions) {
            if (session.user_sessions_id !== currentSessionId) {
                await UserSessionRepository.revokeBySessionId(session.user_sessions_id, userId);
            }
        }
    }

    /**
     * Cập nhật Cài đặt cá nhân
     */
    static async updateMySettings(userId: string, input: UpdateSettingsInput): Promise<UserProfileResponse> {
        const updated = await ProfileRepository.updateSettings(userId, input);
        if (!updated) {
            throw new AppError(400, 'SETTINGS_UPDATE_FAILED', 'Cập nhật cài đặt thất bại.');
        }

        return this.getMyProfile(userId);
    }

    // ======================= AVATAR MANAGEMENT =======================

    /**
     * Upload 1 ảnh avatar lên Cloudinary và lưu metadata vào DB.
     * Kiểm tra giới hạn số ảnh trước khi upload.
     */
    static async uploadAvatar(userId: string, file: Express.Multer.File): Promise<AvatarImage> {
        // Validate MIME type
        if (!AVATAR_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new AppError(
                AVATAR_ERRORS.INVALID_FORMAT.httpCode,
                AVATAR_ERRORS.INVALID_FORMAT.code,
                AVATAR_ERRORS.INVALID_FORMAT.message
            );
        }

        // Validate file size
        if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
            throw new AppError(
                AVATAR_ERRORS.FILE_TOO_LARGE.httpCode,
                AVATAR_ERRORS.FILE_TOO_LARGE.code,
                AVATAR_ERRORS.FILE_TOO_LARGE.message
            );
        }

        // Kiểm tra giới hạn số ảnh hiện tại
        const currentImages = await ProfileRepository.getAvatarImages(userId);
        if (currentImages.length >= AVATAR_CONFIG.MAX_IMAGES) {
            throw new AppError(
                AVATAR_ERRORS.MAX_IMAGES_REACHED.httpCode,
                AVATAR_ERRORS.MAX_IMAGES_REACHED.code,
                AVATAR_ERRORS.MAX_IMAGES_REACHED.message
            );
        }

        // Sinh public_id duy nhất: ehealth/avatars/avatar_{userId}_{timestamp}
        const timestamp = Date.now();
        const publicId = `avatar_${userId}_${timestamp}`;

        // Upload lên Cloudinary bằng stream từ buffer
        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: AVATAR_CONFIG.CLOUDINARY_FOLDER,
                    public_id: publicId,
                    overwrite: true,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error || !result) {
                        reject(new AppError(
                            AVATAR_ERRORS.UPLOAD_FAILED.httpCode,
                            AVATAR_ERRORS.UPLOAD_FAILED.code,
                            AVATAR_ERRORS.UPLOAD_FAILED.message
                        ));
                    } else {
                        resolve(result);
                    }
                }
            );
            uploadStream.end(file.buffer);
        });

        // Tạo object ảnh mới
        const newImage: AvatarImage = {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            uploaded_at: new Date().toISOString(),
        };

        // Lưu vào DB (append vào mảng JSONB)
        const saved = await ProfileRepository.addAvatarImage(userId, newImage);
        if (!saved) {
            throw new AppError(
                AVATAR_ERRORS.UPLOAD_FAILED.httpCode,
                AVATAR_ERRORS.UPLOAD_FAILED.code,
                'Upload thành công nhưng không thể lưu metadata vào DB.'
            );
        }

        return newImage;
    }

    /**
     * Xóa 1 ảnh avatar theo public_id.
     * Xóa trên Cloudinary trước, sau đó xóa metadata khỏi DB.
     */
    static async deleteAvatar(userId: string, publicId: string): Promise<void> {
        // Kiểm tra ảnh có tồn tại trong DB không
        const currentImages = await ProfileRepository.getAvatarImages(userId);
        const imageExists = currentImages.some(img => img.public_id === publicId);
        if (!imageExists) {
            throw new AppError(
                AVATAR_ERRORS.IMAGE_NOT_FOUND.httpCode,
                AVATAR_ERRORS.IMAGE_NOT_FOUND.code,
                AVATAR_ERRORS.IMAGE_NOT_FOUND.message
            );
        }

        // Xóa trên Cloudinary (fire-and-forget nếu lỗi thì chỉ log warning)
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (error: any) {
            logger.error(`[AVATAR] Lỗi xóa ảnh trên Cloudinary (${publicId}):`, error.message);
            // Vẫn tiếp tục xóa trong DB dù Cloudinary lỗi
        }

        // Xóa metadata khỏi DB
        const removed = await ProfileRepository.removeAvatarImage(userId, publicId);
        if (!removed) {
            throw new AppError(
                AVATAR_ERRORS.DELETE_FAILED.httpCode,
                AVATAR_ERRORS.DELETE_FAILED.code,
                AVATAR_ERRORS.DELETE_FAILED.message
            );
        }
    }
}
