import crypto from 'crypto';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';
import { ValidationPatientUtil } from '../utils/patient_validation.util';
import { patientRepository } from '../repository/patient_patient.repository';
import { LinkPatientPayload } from '../models/patient_patient.models';

export class PatientMobileService {
    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản App (CUSTOMER)
     */
    async linkPatient(payload: LinkPatientPayload, currentUser: { account_id: string; role: string }) {

        if (!payload.patient_code || !payload.verification_data || !payload.verification_data.identity_number || !payload.verification_data.date_of_birth) {
            throw PATIENT_ERROR_CODES.VALIDATION_ERROR;
        }

        const patientCode = ValidationPatientUtil.normalizeString(payload.patient_code);
        const identityNumber = ValidationPatientUtil.normalizeString(payload.verification_data.identity_number);
        
        let formattedDob: string;
        try {
            formattedDob = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.verification_data.date_of_birth);
        } catch (error) {
            throw PATIENT_ERROR_CODES.LINK_FAILED; 
        }

        const patientData = await patientRepository.getPatientForLinking(patientCode);

        let dbFormattedDob = '';
        if (patientData && patientData.date_of_birth) {
            const dbDate = patientData.date_of_birth;
            const year = dbDate.getFullYear();
            const month = String(dbDate.getMonth() + 1).padStart(2, '0');
            const day = String(dbDate.getDate()).padStart(2, '0');
            dbFormattedDob = `${year}-${month}-${day}`;
        }

        if (
            !patientData ||                                
            patientData.account_id !== null ||         
            patientData.identity_number !== identityNumber || 
            dbFormattedDob !== formattedDob             
        ) {
            throw PATIENT_ERROR_CODES.LINK_FAILED;
        }

        await patientRepository.linkAccount(
            patientData.patient_id,
            currentUser.account_id
        );

        return {
            patient_id: patientData.patient_id,
            patient_code: patientCode,
            linked_at: new Date()
        };
    }
}

export const patientMobileService = new PatientMobileService();