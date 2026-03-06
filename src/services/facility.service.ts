import { FacilityRepository } from '../repository/facility.repository';
import { FacilityInfo, UpdateFacilityInfoInput } from '../models/facility.model';
import { SYSTEM_ERRORS, LOGO_CONFIG, CLOUDINARY_CONFIG, UPLOAD_MESSAGES } from '../constants/system.constant';
import { v2 as cloudinary } from 'cloudinary';

// Khởi tạo Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export class FacilityService {
    /**
     * Lấy danh sách cơ sở y tế
     */
    static async getFacilitiesForDropdown() {
        return await FacilityRepository.getFacilitiesForDropdown();
    }

    /**
     * Lấy thông tin chi tiết cơ sở y tế.
     */
    static async getFacilityInfo(): Promise<FacilityInfo> {
        const facility = await FacilityRepository.getFacilityInfo();
        if (!facility) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;
        return facility;
    }

    /**
     * Cập nhật thông tin tổng quan cơ sở y tế.
     */
    static async updateFacilityInfo(input: UpdateFacilityInfoInput): Promise<FacilityInfo> {
        // Lấy facility hiện tại để lấy ID 
        const existing = await FacilityRepository.getFacilityInfo();
        if (!existing) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;

        // Loại bỏ các field undefined để tránh update ô thừa
        const sanitizedInput: UpdateFacilityInfoInput = Object.fromEntries(
            Object.entries(input).filter(([, value]) => value !== undefined && value !== null)
        );

        return await FacilityRepository.updateFacilityInfo(existing.facilities_id, sanitizedInput);
    }

    /**
     * Upload logo lên Cloudinary và cập nhật URL vào DB.
     */
    static async uploadLogo(file: Express.Multer.File): Promise<{ logo_url: string }> {
        // Validate MIME type
        if (!LOGO_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw SYSTEM_ERRORS.INVALID_IMAGE_FORMAT;
        }

        // Validate file size
        if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
            throw SYSTEM_ERRORS.IMAGE_TOO_LARGE;
        }

        // Lấy facility để lấy ID
        const existing = await FacilityRepository.getFacilityInfo();
        if (!existing) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;

        // Upload lên Cloudinary bằng stream từ buffer
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: LOGO_CONFIG.CLOUDINARY_FOLDER,
                    public_id: `facility_logo_${existing.facilities_id}`,
                    overwrite: true,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error || !result) reject(SYSTEM_ERRORS.UPLOAD_FAILED);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        // Lưu URL vào DB
        await FacilityRepository.updateFacilityLogo(existing.facilities_id, uploadResult.secure_url);

        return { logo_url: uploadResult.secure_url };
    }
}
