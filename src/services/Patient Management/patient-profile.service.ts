/**
 * Patient Profile Service (Multi-Profile)
 *
 * Module 1 - Multi-Patient Profiles
 * Logic nghiep vu cho 1 account quan ly nhieu patient profiles.
 *
 * Tat ca method deu can `accountId` (lay tu JWT) de enforce ownership.
 */

import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../../config/logger.config';
import { CLOUDINARY_CONFIG } from '../../constants/system.constant';
import { AppError } from '../../utils/app-error.util';
import { PatientProfileRepository } from '../../repository/Patient Management/patient-profile.repository';
import { PatientRepository } from '../../repository/Patient Management/patient.repository';
import {
    Patient,
    CreatePatientProfileInput,
    UpdatePatientInput,
    PatientRelationship,
} from '../../models/Patient Management/patient.model';
import { AvatarImage } from '../../models/Core/profile.model';
import {
    PATIENT_AVATAR_CONFIG,
    PATIENT_AVATAR_ERRORS,
    PATIENT_CODE_PREFIX,
} from '../../constants/patient.constant';

const MAX_PROFILES_PER_ACCOUNT = 10;
const VALID_RELATIONSHIPS: PatientRelationship[] = ['SELF', 'PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'OTHER'];

cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export class PatientProfileService {
    private static buildProfileAccessError(): AppError {
        return new AppError(
            404,
            'PATIENT_PROFILE_NOT_FOUND',
            'Khong tim thay ho so benh nhan hoac ban khong co quyen truy cap.',
        );
    }

    private static async assertProfileAccess(id: string, accountId: string, bypassOwnership?: boolean): Promise<void> {
        if (bypassOwnership) {
            const profile = await PatientRepository.getPatientById(id);
            if (!profile) {
                throw this.buildProfileAccessError();
            }
            return;
        }

        await this.getProfileById(id, accountId);
    }

    private static generatePatientCode(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${PATIENT_CODE_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }

    private static normalizeName(name: string): string {
        return name
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    private static normalizePhone(phone: string): string {
        return phone.replace(/[\s\-().]/g, '');
    }

    private static validateRelationship(rel: string | undefined): PatientRelationship {
        if (!rel) return 'OTHER';
        const upper = rel.toUpperCase() as PatientRelationship;
        if (!VALID_RELATIONSHIPS.includes(upper)) {
            throw new AppError(
                400,
                'PATIENT_PROFILE_INVALID_RELATIONSHIP',
                `Quan he khong hop le. Chi chap nhan: ${VALID_RELATIONSHIPS.join(', ')}`,
            );
        }
        return upper;
    }

    /**
     * Lay danh sach tat ca profiles cua 1 account
     */
    static async getMyProfiles(accountId: string): Promise<Patient[]> {
        if (!accountId) {
            throw new AppError(403, 'PATIENT_PROFILE_MISSING_ACCOUNT', 'Thieu accountId dang nhap.');
        }
        return await PatientProfileRepository.findByAccountId(accountId);
    }

    /**
     * Lay chi tiet 1 profile, kiem tra ownership
     */
    static async getProfileById(id: string, accountId: string): Promise<Patient> {
        const profile = await PatientProfileRepository.findByIdAndAccount(id, accountId);
        if (!profile) {
            throw this.buildProfileAccessError();
        }
        return profile;
    }

    /**
     * Tao profile moi cho account dang dang nhap
     */
    static async createProfile(
        accountId: string,
        input: CreatePatientProfileInput,
    ): Promise<Patient> {
        if (!accountId) {
            throw new AppError(403, 'PATIENT_PROFILE_MISSING_ACCOUNT', 'Thieu accountId - ban can dang nhap.');
        }

        if (!input.full_name || !input.full_name.trim()) {
            throw new AppError(400, 'PATIENT_PROFILE_FULL_NAME_REQUIRED', 'Ho ten khong duoc bo trong.');
        }
        if (!input.date_of_birth) {
            throw new AppError(400, 'PATIENT_PROFILE_DOB_REQUIRED', 'Ngay sinh khong duoc bo trong.');
        }
        if (!input.gender || !['MALE', 'FEMALE', 'OTHER'].includes(input.gender.toUpperCase())) {
            throw new AppError(400, 'PATIENT_PROFILE_INVALID_GENDER', 'Gioi tinh khong hop le (MALE/FEMALE/OTHER).');
        }

        const count = await PatientProfileRepository.countByAccount(accountId);
        if (count >= MAX_PROFILES_PER_ACCOUNT) {
            throw new AppError(
                400,
                'PATIENT_PROFILE_LIMIT_REACHED',
                `Moi tai khoan chi co the tao toi da ${MAX_PROFILES_PER_ACCOUNT} ho so benh nhan.`,
            );
        }

        input.full_name = this.normalizeName(input.full_name);
        if (input.phone_number) input.phone_number = this.normalizePhone(input.phone_number);
        if (input.email) input.email = input.email.trim().toLowerCase();
        input.relationship = this.validateRelationship(input.relationship);
        input.gender = input.gender.toUpperCase();

        if (input.id_card_number) {
            const exists = await PatientRepository.checkIdCardExists(input.id_card_number);
            if (exists) {
                throw new AppError(409, 'PATIENT_PROFILE_ID_CARD_EXISTS', 'CMND/CCCD da ton tai trong he thong.');
            }
        }

        if (count === 0) {
            input.is_default = true;
            input.relationship = input.relationship || 'SELF';
        }

        const newId = randomUUID();
        const patientCode = this.generatePatientCode();

        const created = await PatientProfileRepository.createProfile(newId, patientCode, accountId, input);

        if (input.is_default && count > 0) {
            return await PatientProfileRepository.setDefault(newId, accountId);
        }

        return created;
    }

    /**
     * Cap nhat profile
     */
    static async updateProfile(
        id: string,
        accountId: string,
        input: UpdatePatientInput & { relationship?: string; is_default?: boolean },
    ): Promise<Patient> {
        await this.getProfileById(id, accountId);

        if (input.full_name) input.full_name = this.normalizeName(input.full_name);
        if (input.phone_number) input.phone_number = this.normalizePhone(input.phone_number);
        if (input.email) input.email = input.email.trim().toLowerCase();
        if (input.gender) input.gender = input.gender.toUpperCase();

        const updated = await PatientRepository.updatePatient(id, input);

        if (input.relationship) {
            const rel = this.validateRelationship(input.relationship);
            await PatientProfileRepository.updateRelationship(id, rel);
        }

        if (input.is_default === true) {
            return await PatientProfileRepository.setDefault(id, accountId);
        }

        return updated;
    }

    /**
     * Set 1 profile lam default
     */
    static async setDefaultProfile(id: string, accountId: string): Promise<Patient> {
        await this.getProfileById(id, accountId);
        return await PatientProfileRepository.setDefault(id, accountId);
    }

    /**
     * Cap nhat relationship cua 1 profile
     */
    static async updateRelationship(
        id: string,
        accountId: string,
        relationship: string,
    ): Promise<Patient> {
        await this.getProfileById(id, accountId);
        const rel = this.validateRelationship(relationship);
        return await PatientProfileRepository.updateRelationship(id, rel);
    }

    /**
     * Soft delete profile
     */
    static async deleteProfile(id: string, accountId: string): Promise<void> {
        await this.getProfileById(id, accountId);
        const count = await PatientProfileRepository.countByAccount(accountId);
        if (count <= 1) {
            throw new AppError(
                400,
                'PATIENT_PROFILE_LAST_PROFILE',
                'Khong the xoa ho so duy nhat. Can co it nhat 1 ho so benh nhan.',
            );
        }
        await PatientProfileRepository.softDelete(id, accountId);
    }

    /**
     * Lay default profile
     */
    static async getDefaultProfile(accountId: string): Promise<Patient | null> {
        if (!accountId) {
            throw new AppError(403, 'PATIENT_PROFILE_MISSING_ACCOUNT', 'Thieu accountId dang nhap.');
        }
        return await PatientProfileRepository.getDefault(accountId);
    }

    /**
     * Upload anh ho so cho patient profile va giu toi da 1 anh chinh.
     */
    static async uploadAvatar(
        id: string,
        accountId: string,
        file: Express.Multer.File,
        options?: { bypassOwnership?: boolean },
    ): Promise<AvatarImage> {
        await this.assertProfileAccess(id, accountId, options?.bypassOwnership);

        if (!PATIENT_AVATAR_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new AppError(
                PATIENT_AVATAR_ERRORS.INVALID_FORMAT.httpCode,
                PATIENT_AVATAR_ERRORS.INVALID_FORMAT.code,
                PATIENT_AVATAR_ERRORS.INVALID_FORMAT.message,
            );
        }

        if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
            throw new AppError(
                PATIENT_AVATAR_ERRORS.FILE_TOO_LARGE.httpCode,
                PATIENT_AVATAR_ERRORS.FILE_TOO_LARGE.code,
                PATIENT_AVATAR_ERRORS.FILE_TOO_LARGE.message,
            );
        }

        const currentImages = await PatientProfileRepository.getAvatarImages(id);
        const publicId = `patient_avatar_${id}_${Date.now()}`;

        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: PATIENT_AVATAR_CONFIG.CLOUDINARY_FOLDER,
                    public_id: publicId,
                    overwrite: true,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error || !result) {
                        reject(new AppError(
                            PATIENT_AVATAR_ERRORS.UPLOAD_FAILED.httpCode,
                            PATIENT_AVATAR_ERRORS.UPLOAD_FAILED.code,
                            PATIENT_AVATAR_ERRORS.UPLOAD_FAILED.message,
                        ));
                    } else {
                        resolve(result);
                    }
                },
            );

            uploadStream.end(file.buffer);
        });

        const newImage: AvatarImage = {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            uploaded_at: new Date().toISOString(),
        };

        const saved = await PatientProfileRepository.setAvatarImages(id, [newImage]);
        if (!saved) {
            await this.destroyCloudinaryImage(uploadResult.public_id);
            throw new AppError(
                PATIENT_AVATAR_ERRORS.UPLOAD_FAILED.httpCode,
                PATIENT_AVATAR_ERRORS.UPLOAD_FAILED.code,
                'Upload thanh cong nhung khong the luu metadata anh ho so.',
            );
        }

        await Promise.all(currentImages.map((image) => this.destroyCloudinaryImage(image.public_id)));

        return newImage;
    }

    /**
     * Xoa anh ho so theo public_id trong patient profile.
     */
    static async deleteAvatar(
        id: string,
        accountId: string,
        publicId: string,
        options?: { bypassOwnership?: boolean },
    ): Promise<void> {
        await this.assertProfileAccess(id, accountId, options?.bypassOwnership);

        const currentImages = await PatientProfileRepository.getAvatarImages(id);
        const imageExists = currentImages.some((image) => image.public_id === publicId);
        if (!imageExists) {
            throw new AppError(
                PATIENT_AVATAR_ERRORS.IMAGE_NOT_FOUND.httpCode,
                PATIENT_AVATAR_ERRORS.IMAGE_NOT_FOUND.code,
                PATIENT_AVATAR_ERRORS.IMAGE_NOT_FOUND.message,
            );
        }

        const removed = await PatientProfileRepository.removeAvatarImage(id, publicId);
        if (!removed) {
            throw new AppError(
                PATIENT_AVATAR_ERRORS.DELETE_FAILED.httpCode,
                PATIENT_AVATAR_ERRORS.DELETE_FAILED.code,
                PATIENT_AVATAR_ERRORS.DELETE_FAILED.message,
            );
        }

        await this.destroyCloudinaryImage(publicId);
    }

    private static async destroyCloudinaryImage(publicId: string): Promise<void> {
        if (!publicId) {
            return;
        }

        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (error: any) {
            logger.error(`[PATIENT_AVATAR] Loi xoa anh tren Cloudinary (${publicId}):`, error.message);
        }
    }
}
