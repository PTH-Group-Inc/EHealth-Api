import { pool } from '../config/postgresdb';
import { PatientModels } from '../models/patient_patient.models';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';

export class PatientRepository {

  /**
   * Lấy danh sách hồ sơ bệnh nhân (Hỗ trợ Search, Filter và Pagination)
   */
  async getPatientsList(params: {
    limit: number;
    offset: number;
    search?: string;
    status?: string;
    gender?: string;
  }): Promise<{ items: any[]; total: number }> {
    try {
      const { limit, offset, search, status, gender } = params;

      const whereConditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Xử lý tìm kiếm
      if (search) {
        whereConditions.push(`(
          full_name ILIKE $${paramIndex} OR 
          phone ILIKE $${paramIndex} OR 
          patient_code ILIKE $${paramIndex} OR 
          identity_number ILIKE $${paramIndex}
        )`);
        values.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (gender) {
        whereConditions.push(`gender = $${paramIndex}`);
        values.push(gender);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const countQuery = `
        SELECT COUNT(*) 
        FROM patienting.patients 
        ${whereClause};
      `;
      const countResult = await pool.query(countQuery, values);

      const totalItems = parseInt(countResult.rows[0].count, 10);

      const dataValues = [...values, limit, offset];

      const dataQuery = `
        SELECT 
          patient_id, patient_code, full_name, date_of_birth, gender, 
          phone, identity_type, identity_number, blood_type, status, created_at, updated_at 
        FROM patienting.patients 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
      `;
      const dataResult = await pool.query(dataQuery, dataValues);

      // Trả về kết quả
      return {
        items: dataResult.rows,
        total: totalItems
      };

    } catch (error) {
      console.error('[PatientRepository] getPatientsList Error:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }


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
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }

  /**
   * Thêm mới hồ sơ bệnh nhân và lưu Log tạo mới
   */
  async insertNewPatient(patientEntity: PatientModels, accountId: string): Promise<void> {
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
      throw PATIENT_ERROR_CODES.DATABASE_INSERT_ERROR;
    } finally {
      client.release();
    }
  }



  /**
   * Cập nhật thông tin bệnh nhân và lưu Audit Log
   */
  async updatePatient(patientId: string, updateFields: Record<string, any>, auditLogs: any[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateFields)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(patientId);

      const updateQuery = `
        UPDATE patienting.patients 
        SET ${setClauses.join(', ')} 
        WHERE patient_id = $${paramIndex};
      `;

      await client.query(updateQuery, values);

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

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
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
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }



  /**
   * Kiểm tra ràng buộc nghiệp vụ trước khi đổi trạng thái (chuyển sang INACTIVE / DECEASED).
   */
  async checkBusinessConstraintsForStatusChange(patientId: string): Promise<boolean> {
    try {
      /*
      const query = `
        SELECT 
          (SELECT EXISTS (
            SELECT 1 FROM patienting.appointments 
            WHERE patient_id = $1 AND status IN ('WAITING', 'IN_PROGRESS')
          )) AS has_active_appointment,
          (SELECT EXISTS (
            SELECT 1 FROM patienting.invoices 
            WHERE patient_id = $1 AND status = 'PENDING'
          )) AS has_pending_invoice;
      `;

      const result = await pool.query(query, [patientId]);
      
      if ((result.rowCount ?? 0) === 0) return false;

      const row = result.rows[0];
      
      // Nếu bệnh nhân có lịch khám đang chờ hoặc đang tiến hành,
      // hoặc có hóa đơn chưa thanh toán thì trả về true (có ràng buộc, không được phép đổi trạng thái)
      return row.has_active_appointment || row.has_pending_invoice;
      */

      // Hiện tại cho phép đổi trạng thái thoải mái
      return false;

    } catch (error) {
      console.error('[PatientRepository] checkBusinessConstraints Error:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }

  /**
   * Cập nhật trạng thái, lý do và ghi nhận Audit Log bằng Transaction
   */
  async updatePatientStatus(patientId: string, status: string, statusReason: string | null, auditLogs: any[]): Promise<void> {

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Cập nhật bảng patients
      const updateQuery = `
        UPDATE patienting.patients 
        SET status = $1, status_reason = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE patient_id = $3;
      `;
      await client.query(updateQuery, [status, statusReason, patientId]);

      if (auditLogs.length > 0) {
        const logQuery = `
          INSERT INTO patienting.patient_audit_logs 
          (patient_id, changed_by, field_name, old_value, new_value, created_at) 
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
        `;

        for (const log of auditLogs) {
          await client.query(logQuery, [
            log.patient_id,
            log.changed_by,
            log.field_name,
            log.old_value,
            log.new_value
          ]);
        }
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PatientRepository] updatePatientStatusTransaction Error:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }




  /**
   * Lấy thông tin bệnh nhân để phục vụ so khớp liên kết tài khoản (Mobile App)
   */
  async getPatientForLinking(patientCode: string): Promise<{ patient_id: string; account_id: string | null; identity_number: string | null; date_of_birth: Date;} | null> {
    const query = `
      SELECT patient_id, account_id, identity_number, date_of_birth 
      FROM patienting.patients 
      WHERE patient_code = $1 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [patientCode]);
      
      if ((result.rowCount ?? 0) === 0)  return null; 
      

      return result.rows[0];
    } catch (error) {
      console.error('[PatientRepository - getPatientForLinking] Lỗi truy vấn:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }

  /**
   * Liên kết tài khoản người dùng với hồ sơ bệnh nhân
   */
  async linkAccount(patientId: string, accountId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updateQuery = `
        UPDATE patienting.patients 
        SET account_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE patient_id = $2;
      `;
      await client.query(updateQuery, [accountId, patientId]);

      const logQuery = `
        INSERT INTO patienting.patient_audit_logs 
        (patient_id, changed_by, field_name, old_value, new_value, created_at) 
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
      `;
      
      const logValues = [
        patientId,  
        accountId, 
        'account_id',
        null,     
        accountId    
      ];
      
      await client.query(logQuery, logValues);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PatientRepository - linkAccountWithAuditTransaction] Lỗi Transaction:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }

}



export const patientRepository = new PatientRepository();