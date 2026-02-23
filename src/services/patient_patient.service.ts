import { ValidationPatientUtil } from '../utils/patient_validation.util';
import { IdentifierPatientUtil } from '../utils/patient_identifier.util';
import { patientRepository } from '../repository/patient_patient.repository';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';
import { PatientModels, Gender, IdentityType, CreatePatientPayload } from '../models/patient_patient.models';

export class PatientService {
    /*
     * Nghiệp vụ tạo mới hồ sơ bệnh nhân
     */
    async createPatientProfile(payload: CreatePatientPayload) {
        // Có loại giấy tờ nhưng không có số giấy tờ -> Báo lỗi
        if (payload.identity_type && !payload.identity_number) {
            throw PATIENT_ERROR_CODES.MISSING_IDENTITY_NUMBER;
        }

        // --- Normalize & Validate ---
        if (!payload.full_name || payload.full_name.trim().length < 2) {
            throw PATIENT_ERROR_CODES.INVALID_NAME;
        }
        const normalizedFullName = ValidationPatientUtil.normalizeFullName(payload.full_name);
        const formattedDateOfBirth = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.date_of_birth);


        // --- Check Duplicate ---
        // Chỉ kiểm tra khi bệnh nhân có cung cấp giấy tờ định danh
        if (payload.identity_type && payload.identity_number) {
            const isExist = await patientRepository.checkPatientExistenceByIdentity(
                payload.identity_type,
                payload.identity_number
            );

            if (isExist) {
                throw PATIENT_ERROR_CODES.DUPLICATE_STRONG;
            }
        }


        // --- Generate IDs ---
        const patientId = IdentifierPatientUtil.generateInternalId();
        const patientCode = IdentifierPatientUtil.generatePatientCode();


        // --- Save (Map data & Insert) ---
        const now = new Date();
        const newPatient: PatientModels = {
            patient_id: patientId,
            patient_code: patientCode,
            full_name: normalizedFullName,
            date_of_birth: formattedDateOfBirth,
            gender: (payload.gender as Gender) || null,
            phone: payload.phone || null,
            identity_type: (payload.identity_type as IdentityType) || null,
            identity_number: payload.identity_number || null,
            status: 'ACTIVE',
            created_at: now,
            updated_at: now,
        };

        // Gọi Repository để lưu xuống DB
        await patientRepository.insertNewPatient(newPatient);


        // --- Return ---
        return {
            patient_id: newPatient.patient_id,
            patient_code: newPatient.patient_code,
            status: newPatient.status,
        };
    }
}

export const patientService = new PatientService();