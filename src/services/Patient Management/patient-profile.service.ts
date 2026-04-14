/**
 * Patient Profile Service (Multi-Profile)
 *
 * Module 1 — Multi-Patient Profiles
 * Logic nghiệp vụ cho 1 account quản lý nhiều patient profiles.
 *
 * Tất cả method đều cần `accountId` (lấy từ JWT) để enforce ownership.
 */

import { randomUUID } from 'crypto';
import { PatientProfileRepository } from '../../repository/Patient Management/patient-profile.repository';
import { PatientRepository } from '../../repository/Patient Management/patient.repository';
import {
    Patient,
    CreatePatientProfileInput,
    UpdatePatientInput,
    PatientRelationship,
} from '../../models/Patient Management/patient.model';
import { PATIENT_CODE_PREFIX } from '../../constants/patient.constant';

const MAX_PROFILES_PER_ACCOUNT = 10;
const VALID_RELATIONSHIPS: PatientRelationship[] = ['SELF', 'PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'OTHER'];

export class PatientProfileService {
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
            throw new Error(`Quan hệ không hợp lệ. Chỉ chấp nhận: ${VALID_RELATIONSHIPS.join(', ')}`);
        }
        return upper;
    }

    /**
     * Lấy danh sách tất cả profiles của 1 account
     */
    static async getMyProfiles(accountId: string): Promise<Patient[]> {
        if (!accountId) {
            throw new Error('Thiếu accountId');
        }
        return await PatientProfileRepository.findByAccountId(accountId);
    }

    /**
     * Lấy chi tiết 1 profile, kiểm tra ownership
     */
    static async getProfileById(id: string, accountId: string): Promise<Patient> {
        const profile = await PatientProfileRepository.findByIdAndAccount(id, accountId);
        if (!profile) {
            throw new Error('Không tìm thấy hồ sơ bệnh nhân hoặc bạn không có quyền truy cập');
        }
        return profile;
    }

    /**
     * Tạo profile mới cho account đăng nhập
     */
    static async createProfile(
        accountId: string,
        input: CreatePatientProfileInput,
    ): Promise<Patient> {
        if (!accountId) {
            throw new Error('Thiếu accountId — bạn cần đăng nhập');
        }

        // Validate input
        if (!input.full_name || !input.full_name.trim()) {
            throw new Error('Họ tên không được bỏ trống');
        }
        if (!input.date_of_birth) {
            throw new Error('Ngày sinh không được bỏ trống');
        }
        if (!input.gender || !['MALE', 'FEMALE', 'OTHER'].includes(input.gender.toUpperCase())) {
            throw new Error('Giới tính không hợp lệ (MALE/FEMALE/OTHER)');
        }

        // Check số profiles tối đa
        const count = await PatientProfileRepository.countByAccount(accountId);
        if (count >= MAX_PROFILES_PER_ACCOUNT) {
            throw new Error(`Mỗi tài khoản chỉ có thể tạo tối đa ${MAX_PROFILES_PER_ACCOUNT} hồ sơ bệnh nhân`);
        }

        // Chuẩn hóa
        input.full_name = this.normalizeName(input.full_name);
        if (input.phone_number) input.phone_number = this.normalizePhone(input.phone_number);
        if (input.email) input.email = input.email.trim().toLowerCase();
        input.relationship = this.validateRelationship(input.relationship);
        input.gender = input.gender.toUpperCase();

        // Check id_card duplicate
        if (input.id_card_number) {
            const exists = await PatientRepository.checkIdCardExists(input.id_card_number);
            if (exists) {
                throw new Error('CMND/CCCD đã tồn tại trong hệ thống');
            }
        }

        // Nếu là profile đầu tiên, tự động set is_default = true
        if (count === 0) {
            input.is_default = true;
            input.relationship = input.relationship || 'SELF';
        }

        const newId = randomUUID();
        const patientCode = this.generatePatientCode();

        const created = await PatientProfileRepository.createProfile(newId, patientCode, accountId, input);

        // Nếu user yêu cầu set default ngay → setDefault sẽ unset các profile khác
        if (input.is_default && count > 0) {
            return await PatientProfileRepository.setDefault(newId, accountId);
        }

        return created;
    }

    /**
     * Cập nhật profile (chỉ cho phép update profile của chính mình)
     */
    static async updateProfile(
        id: string,
        accountId: string,
        input: UpdatePatientInput & { relationship?: string; is_default?: boolean },
    ): Promise<Patient> {
        // Verify ownership
        await this.getProfileById(id, accountId);

        // Chuẩn hóa input
        if (input.full_name) input.full_name = this.normalizeName(input.full_name);
        if (input.phone_number) input.phone_number = this.normalizePhone(input.phone_number);
        if (input.email) input.email = input.email.trim().toLowerCase();
        if (input.gender) input.gender = input.gender.toUpperCase();

        // Update các trường thông tin cơ bản qua repo cũ
        const updated = await PatientRepository.updatePatient(id, input);

        // Nếu có update relationship
        if (input.relationship) {
            const rel = this.validateRelationship(input.relationship);
            await PatientProfileRepository.updateRelationship(id, rel);
        }

        // Nếu set is_default = true
        if (input.is_default === true) {
            return await PatientProfileRepository.setDefault(id, accountId);
        }

        return updated;
    }

    /**
     * Set 1 profile làm default
     */
    static async setDefaultProfile(id: string, accountId: string): Promise<Patient> {
        await this.getProfileById(id, accountId);
        return await PatientProfileRepository.setDefault(id, accountId);
    }

    /**
     * Cập nhật relationship của 1 profile
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
     * Soft delete profile (ngừng sử dụng)
     */
    static async deleteProfile(id: string, accountId: string): Promise<void> {
        await this.getProfileById(id, accountId);
        const count = await PatientProfileRepository.countByAccount(accountId);
        if (count <= 1) {
            throw new Error('Không thể xóa hồ sơ duy nhất. Cần có ít nhất 1 hồ sơ bệnh nhân.');
        }
        await PatientProfileRepository.softDelete(id, accountId);
    }

    /**
     * Lấy default profile
     */
    static async getDefaultProfile(accountId: string): Promise<Patient | null> {
        return await PatientProfileRepository.getDefault(accountId);
    }
}
