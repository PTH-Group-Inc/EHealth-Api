export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type IdentityType = 'CCCD' | 'PASSPORT' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';

export interface PatientModels {
    patient_id: string;
    patient_code: string;
    full_name: string;
    date_of_birth: string;
    gender?: Gender | null;
    phone?: string | null;
    identity_type?: IdentityType | null;
    identity_number?: string | null;
    status: PatientStatus;
    created_at: Date;
    updated_at: Date;
}


export interface CreatePatientPayload {
  full_name: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  identity_type?: string;
  identity_number?: string;
}