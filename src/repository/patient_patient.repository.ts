import { pool } from '../config/postgresdb';
import { PatientModels } from '../models/patient_patient.models';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';

export class PatientRepository {
  /**
   * Kiểm tra xem bệnh nhân đã tồn tại dựa trên giấy tờ định danh chưa.
   */
  async checkPatientExistenceByIdentity(
    identityType: string,
    identityNumber: string
  ): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM patienting.patients 
      WHERE identity_type = $1 AND identity_number = $2 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [identityType, identityNumber]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Lỗi khi kiểm tra tồn tại bệnh nhân:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }

  /**
   * Thêm mới hồ sơ bệnh nhân vào cơ sở dữ liệu.
   */
  async insertNewPatient(patientEntity: PatientModels): Promise<void> {
    const query = `
      INSERT INTO patienting.patients (
        patient_id, 
        patient_code, 
        full_name, 
        date_of_birth, 
        gender, 
        phone,
        identity_type, 
        identity_number, 
        status, 
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      );
    `;

    const values = [
      patientEntity.patient_id,
      patientEntity.patient_code,
      patientEntity.full_name,
      patientEntity.date_of_birth,
      patientEntity.gender || null,
      patientEntity.phone || null,
      patientEntity.identity_type || null,
      patientEntity.identity_number || null,
      patientEntity.status,
      patientEntity.created_at,
      patientEntity.updated_at
    ];

    try {
      await pool.query(query, values);
    } catch (error) {
      throw PATIENT_ERROR_CODES.DATABASE_INSERT_ERROR;
    }
  }
}

export const patientRepository = new PatientRepository();