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
   * Thêm mới hồ sơ bệnh nhân và lưu Log tạo mới
   */
  async insertNewPatientWithAuditTransaction(patientEntity: PatientModels, accountId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO patienting.patients (
          patient_id, patient_code, full_name, date_of_birth, gender, phone,
          identity_type, identity_number, email, address, ethnicity, nationality, 
          job_title, blood_type, emer_contact_name, emer_contact_phone, account_id,
          status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
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
      patientEntity.email || null,
      patientEntity.address || null,
      patientEntity.ethnicity || null,
      patientEntity.nationality || null,
      patientEntity.job_title || null,
      patientEntity.blood_type || null,
      patientEntity.emer_contact_name || null,
      patientEntity.emer_contact_phone || null,
      patientEntity.account_id || null,

      patientEntity.status,
      patientEntity.created_at,
      patientEntity.updated_at
      ];

      await client.query(insertQuery, values);

      const logQuery = `
        INSERT INTO patienting.patient_audit_logs 
        (patient_id, changed_by, field_name, old_value, new_value, created_at) 
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
      `;

      await client.query(logQuery, [
        patientEntity.patient_id,
        accountId,
        'profile_creation',
        null,
        'CREATED'
      ]);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Lỗi INSERT bệnh nhân kèm Audit:', error);
      throw PATIENT_ERROR_CODES.DATABASE_INSERT_ERROR;
    } finally {
      client.release();
    }
  }



  /**
   * Cập nhật thông tin bệnh nhân và lưu Audit Log
   */
  async updatePatientWithAuditTransaction(patientId: string, updateFields: Record<string, any>, auditLogs: any[]): Promise<void> {
    // Lấy một kết nối duy nhất từ pool
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Xử lý Update bảng patients
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateFields)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      // Bổ sung updated_at
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

      // Đẩy patientId vào cuối mảng values
      values.push(patientId);

      const updateQuery = `
        UPDATE patienting.patients 
        SET ${setClauses.join(', ')} 
        WHERE patient_id = $${paramIndex};
      `;

      await client.query(updateQuery, values);

      // Xử lý Insert bảng patient_audit_logs
      if (auditLogs.length > 0) {
        const logQuery = `
          INSERT INTO patienting.patient_audit_logs 
          (patient_id, changed_by, field_name, old_value, new_value, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6);
        `;

        for (const log of auditLogs) {
          await client.query(logQuery, [
            log.patient_id,
            log.changed_by,
            log.field_name,
            log.old_value,
            log.new_value,
            new Date()
          ]);
        }
      }

      // Commit Transaction nếu mọi thứ thành công
      await client.query('COMMIT');

    } catch (error) {
      // Rollback nếu có lỗi xảy ra
      await client.query('ROLLBACK');
      console.error('Lỗi Transaction khi cập nhật bệnh nhân:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }


  /**
   * Lấy thông tin bệnh nhân theo ID
   */
  async getPatientById(patientId: string): Promise<PatientModels | null> {
    const query = `
      SELECT * FROM patienting.patients 
      WHERE patient_id = $1 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [patientId]);
      if ((result.rowCount ?? 0) === 0) {
        return null;
      }
      return result.rows[0] as PatientModels;
    } catch (error) {
      console.error('Lỗi khi getPatientById:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }

  /**
   * Kiểm tra xem số điện thoại đã được sử dụng bởi một bệnh nhân KHÁC chưa
   */
  async checkPhoneConflict(phone: string, currentPatientId: string): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM patienting.patients 
      WHERE phone = $1 AND patient_id != $2 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [phone, currentPatientId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Lỗi khi kiểm tra xung đột số điện thoại (checkPhoneConflict):', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }



}



export const patientRepository = new PatientRepository();