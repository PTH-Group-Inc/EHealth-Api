// Thêm type cho nhóm máu
export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN';
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
  email?: string | null;
  address?: string | null;
  ethnicity?: string | null;
  nationality?: string | null;
  job_title?: string | null;
  blood_type?: BloodType | null;
  emer_contact_name?: string | null;
  emer_contact_phone?: string | null;
  account_id?: string | null;

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
  email?: string;
  address?: string;
  ethnicity?: string;
  nationality?: string;
  job_title?: string;
  blood_type?: string;
  emer_contact_name?: string;
  emer_contact_phone?: string;
}


export interface PatientAuditLogModel {
  log_id?: string | number;
  patient_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at?: Date;
}

export interface UpdatePatientAdminPayload {
  full_name?: string;
  date_of_birth?: string;
  gender?: Gender | null;
  phone?: string | null;
  email?: string | null;
  identity_type?: IdentityType | null;
  identity_number?: string | null;
  address?: string | null;
  ethnicity?: string | null;
  nationality?: string | null;
  job_title?: string | null;
  blood_type?: BloodType | null;
  emer_contact_name?: string | null;
  emer_contact_phone?: string | null;
  account_id?: string | null;
  status?: PatientStatus;
}