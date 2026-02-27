// === TYPES ===
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type IdentityType = 'CCCD' | 'PASSPORT' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';
export type RelationshipType = 'PARENT' | 'SPOUSE' | 'CHILD' | 'SIBLING' | 'OTHER';
export type MedicalVisitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// === MODELS ===

/**
 * Thông tin bệnh nhân chính
 */
export interface PatientModels {
  patient_id: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender?: Gender | null;
  identity_type?: IdentityType | null;
  identity_number?: string | null;
  nationality?: string | null;
  account_id?: string | null;
  status: PatientStatus;
  status_reason?: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Thông tin liên hệ bệnh nhân
 */
export interface PatientContact {
  contact_id: string;
  patient_id: string;
  phone_number: string;
  email?: string | null;
  street_address?: string | null;
  ward?: string | null;      // Đổi ward_code -> ward
  province?: string | null; 
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}
/**
 * Thông tin người nhà / người liên hệ khẩn cấp
 */
export interface PatientRelation {
  relation_id: string;
  patient_id: string;
  full_name: string;
  relationship: RelationshipType;
  phone_number: string;
  is_emergency: boolean;
  has_legal_rights: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Lịch sử khám bệnh / lịch sử y tế
 */
export interface PatientMedicalHistory {
  history_id: string;
  patient_id: string;
  doctor_id?: string | null;
  facility_id?: string | null;
  visit_date: Date;
  reason?: string | null;
  diagnosis?: string | null;
  status: MedicalVisitStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Log kiểm toán thay đổi bệnh nhân
 */
export interface PatientAuditLogModel {
  log_id: string;
  patient_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: Date;
}

// === PAYLOADS ===

/**
 * Tạo mới hồ sơ bệnh nhân
 */
export interface CreatePatientPayload {
  full_name: string;
  date_of_birth: string;
  gender?: string;
  identity_type?: string;
  identity_number?: string;
  nationality?: string;
  contact: {
    phone_number: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
  };
}

/**
 * Cập nhật thông tin bệnh nhân
 */
export interface UpdatePatientAdminPayload {
  full_name?: string;
  date_of_birth?: string;
  gender?: Gender | null;
  identity_type?: IdentityType | null;
  identity_number?: string | null;
  nationality?: string | null;
  account_id?: string | null;
  status?: PatientStatus;
  status_reason?: string | null;
}

/**
 * Thêm/Cập nhật thông tin liên hệ
 */
export interface CreatePatientContactPayload {
  phone_number: string;
  email?: string;
  street_address?: string;
  ward?: string;
  province?: string;
  is_primary?: boolean;
}

/**
 * Thêm/Cập nhật thông tin người nhà
 */
export interface CreatePatientRelationPayload {
  full_name: string;
  relationship: string;
  phone_number: string;
  is_emergency?: boolean;
  has_legal_rights?: boolean;
}

/**
 * Liên kết tài khoản
 */
export interface LinkPatientPayload {
  patient_code: string;
  verification_data: {
    identity_number: string;
    date_of_birth: string;
  };
}


export interface PatientFilterParams {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  gender?: string;
}