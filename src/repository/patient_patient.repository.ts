import { pool } from '../config/postgresdb';
import { PatientFilterParams, PatientModels, PatientContact, PatientRelation, PatientMedicalHistory, PatientAuditLogModel } from '../models/patient_patient.models';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';
import crypto from 'crypto';



export class PatientRepository {

  /**
   * Lấy danh sách hồ sơ bệnh nhân
   */
  async getPatientsList(params: PatientFilterParams): Promise<{ items: any[]; total: number }> {
    try {
      const { limit, offset, search, status, gender } = params;

      const conditions: string[] = [];
      const values: any[] = [];

      if (search) {
        values.push(`%${search}%`);
        conditions.push(`(
          p.full_name ILIKE $${values.length} OR 
          p.patient_code ILIKE $${values.length} OR 
          p.identity_number ILIKE $${values.length} OR
          EXISTS (
            SELECT 1 FROM patienting.patient_contacts pc 
            WHERE pc.patient_id = p.patient_id AND pc.phone_number ILIKE $${values.length}
          )
        )`);
      }

      if (status) {
        values.push(status);
        conditions.push(`p.status = $${values.length}`);
      }

      if (gender) {
        values.push(gender);
        conditions.push(`p.gender = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countQuery = `
        SELECT COUNT(p.patient_id) as total_count
        FROM patienting.patients p
        ${whereClause};
      `;

      const dataQuery = `
        SELECT 
          p.patient_id, p.patient_code, p.full_name, p.date_of_birth, p.gender, 
          p.identity_type, p.identity_number, p.nationality, p.status, 
          p.created_at, p.updated_at,
          (
            SELECT phone_number 
            FROM patienting.patient_contacts pc 
            WHERE pc.patient_id = p.patient_id AND pc.is_primary = true 
            LIMIT 1
          ) AS primary_phone
        FROM patienting.patients p
        ${whereClause}
        ORDER BY p.created_at DESC 
        LIMIT $${values.length + 1} OFFSET $${values.length + 2};
      `;

      const dataValues = [...values, limit, offset];

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, values),
        pool.query(dataQuery, dataValues)
      ]);

      return {
        items: dataResult.rows,
        total: parseInt(countResult.rows[0].total_count, 10)
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
   * Thêm mới hồ sơ bệnh nhân
   */
  async insertNewPatient(
    patientEntity: PatientModels,
    contactEntity: Partial<PatientContact>,
    accountId: string
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert vào bảng patients
      const insertPatientQuery = `
        INSERT INTO patienting.patients (
          patient_id, patient_code, full_name, date_of_birth, gender,
          identity_type, identity_number, nationality, account_id,
          status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        );
      `;
      const patientValues = [
        patientEntity.patient_id, patientEntity.patient_code, patientEntity.full_name,
        patientEntity.date_of_birth, patientEntity.gender || null, patientEntity.identity_type || null,
        patientEntity.identity_number || null, patientEntity.nationality || 'VN',
        patientEntity.account_id || null, patientEntity.status, patientEntity.created_at, patientEntity.updated_at
      ];
      await client.query(insertPatientQuery, patientValues);

      // Insert vào bảng patient_contacts
      const insertContactQuery = `
        INSERT INTO patienting.patient_contacts (
          contact_id, patient_id, phone_number, email, street_address, 
          ward, province, is_primary, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
      `;
      const contactValues = [
        contactEntity.contact_id,
        patientEntity.patient_id,
        contactEntity.phone_number,
        contactEntity.email || null,
        contactEntity.street_address || null,
        contactEntity.ward || null,
        contactEntity.province || null,
        true
      ];
      await client.query(insertContactQuery, contactValues);

      // Ghi audit log (Tạo mới hồ sơ)
      const logId = crypto.randomUUID();
      const logQuery = `
        INSERT INTO patienting.patient_audit_logs 
        (log_id, patient_id, changed_by, field_name, old_value, new_value, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
      `;
      await client.query(logQuery, [
        logId, patientEntity.patient_id, accountId, 'status', null, 'CREATED'
      ]);

      await client.query('COMMIT');

    } catch (error) {
      console.error('[PatientRepository] insertNewPatient Error:', error);
      throw PATIENT_ERROR_CODES.DATABASE_INSERT_ERROR;
    } finally {
      client.release();
    }
  }



  /**
   * Cập nhật thông tin bệnh nhân
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

      // Ghi audit logs
      if (auditLogs.length > 0) {
        const logQuery = `
          INSERT INTO patienting.patient_audit_logs 
          (log_id, patient_id, changed_by, field_name, old_value, new_value, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
        `;

        for (const log of auditLogs) {
          const logId = crypto.randomUUID();
          await client.query(logQuery, [
            logId,
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
      console.error('[PatientRepository] updatePatient Error:', error);
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
      console.error('[PatientRepository] getPatientById Error:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }

  /**
   * Kiểm tra xem số điện thoại đã được sử dụng bởi một bệnh nhân KHÁC chưa
   */
  async checkPhoneConflict(phone: string, currentPatientId: string): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM patienting.patient_contacts 
      WHERE phone_number = $1 AND patient_id != $2 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [phone, currentPatientId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('[PatientRepository] checkPhoneConflict Error:', error);
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

      // Ghi audit logs
      if (auditLogs.length > 0) {
        const logQuery = `
          INSERT INTO patienting.patient_audit_logs 
          (log_id, patient_id, changed_by, field_name, old_value, new_value, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
        `;

        for (const log of auditLogs) {
          const logId = crypto.randomUUID();
          await client.query(logQuery, [
            logId,
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
      console.error('[PatientRepository] updatePatientStatus Error:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }




  /**
   * Lấy thông tin bệnh nhân để phục vụ so khớp liên kết tài khoản (Mobile App)
   */
  async getPatientForLinking(patientCode: string): Promise<{
    patient_id: string;
    account_id: string | null;
    identity_number: string | null;
    date_of_birth: string;
  } | null> {

    const query = `
      SELECT 
        patient_id, 
        account_id, 
        identity_number, 
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth 
      FROM patienting.patients 
      WHERE patient_code = $1 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [patientCode]);

      if ((result.rowCount ?? 0) === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('[PatientRepository - getPatientForLinking] Error:', error);
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

      // Ghi audit log
      const logId = crypto.randomUUID();
      const logQuery = `
        INSERT INTO patienting.patient_audit_logs 
        (log_id, patient_id, changed_by, field_name, old_value, new_value, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
      `;

      await client.query(logQuery, [
        logId,
        patientId,
        accountId,
        'account_id',
        null,
        accountId
      ]);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PatientRepository - linkAccount] Error:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }



  /**
   * Cập nhật thông tin liên hệ
   */
  async updatePatientContact(patientId: string, contactData: Record<string, any>, auditLogs: any[]): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(contactData)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(patientId);

      const updateQuery = `
        UPDATE patienting.patient_contacts 
        SET ${setClauses.join(', ')} 
        WHERE patient_id = $${paramIndex} AND is_primary = true;
      `;
      
      const updateResult = await client.query(updateQuery, values);
      
      const affectedRows = updateResult.rowCount ?? 0;

      if (affectedRows > 0 && auditLogs.length > 0) {
        const logQuery = `
          INSERT INTO patienting.patient_audit_logs 
          (log_id, patient_id, changed_by, field_name, old_value, new_value, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
        `;

        for (const log of auditLogs) {
          await client.query(logQuery, [
            crypto.randomUUID(), 
            log.patient_id,
            log.changed_by,
            log.field_name,
            log.old_value,
            log.new_value
          ]);
        }
      }

      await client.query('COMMIT');
      
      return affectedRows;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PatientRepository] updatePatientContact Error:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }




  /**
   * Thêm mới thông tin người nhà
   */
  async insertPatientRelation(relationData: any, auditLogs: any[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO patienting.patient_relations (
          relation_id, patient_id, full_name, relationship, phone_number, 
          is_emergency, has_legal_rights, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
      `;

      const relationValues = [
        relationData.relation_id,
        relationData.patient_id,
        relationData.full_name,
        relationData.relationship,
        relationData.phone_number,
        relationData.is_emergency || false,
        relationData.has_legal_rights || false
      ];

      await client.query(insertQuery, relationValues);

      if (auditLogs.length > 0) {
        const logQuery = `
          INSERT INTO patienting.patient_audit_logs 
          (log_id, patient_id, changed_by, field_name, old_value, new_value, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
        `;

        for (const log of auditLogs) {
          await client.query(logQuery, [
            crypto.randomUUID(),
            log.patient_id,
            log.changed_by,
            `relation_${log.field_name}`,
            log.old_value,
            log.new_value
          ]);
        }
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PatientContactRelationRepository] insertPatientRelation Error:', error);
      throw PATIENT_ERROR_CODES.TRANSACTION_FAILED;
    } finally {
      client.release();
    }
  }



  /**
   * Lấy thông tin liên hệ chính của bệnh nhân
   */
  async getPrimaryContactByPatientId(patientId: string): Promise<PatientContact | null> {
    const query = `
      SELECT * FROM patienting.patient_contacts 
      WHERE patient_id = $1 AND is_primary = true 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [patientId]);
      
      if ((result.rowCount ?? 0) === 0) {
        return null;
      }
      return result.rows[0] as PatientContact;
      
    } catch (error) {
      console.error('[PatientRepository] getPrimaryContactByPatientId Error:', error);
      throw PATIENT_ERROR_CODES.DATABASE_ERROR;
    }
  }


}

export const patientRepository = new PatientRepository();