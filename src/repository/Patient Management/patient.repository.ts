import { pool } from '../../config/postgresdb';
import {
    Patient,
    CreatePatientInput,
    UpdatePatientInput,
    PaginatedPatients
} from '../../models/Patient Management/patient.model';

export class PatientRepository {
    /**
     * Lấy số sequence tiếp theo để sinh mã bệnh nhân
     */
    static async getNextSequenceValue(): Promise<number> {
        const result = await pool.query(`SELECT nextval('patient_code_seq') AS seq`);
        return parseInt(result.rows[0].seq);
    }

    /**
     * Lấy danh sách hồ sơ bệnh nhân có phân trang, tìm kiếm, lọc
     */
    static async getPatients(
        search?: string,
        status?: string,
        gender?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatients> {
        let whereClause = 'WHERE p.deleted_at IS NULL';
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }
        if (gender) {
            whereClause += ` AND p.gender = $${paramIndex++}`;
            params.push(gender);
        }
        if (search) {
            whereClause += ` AND (p.full_name ILIKE $${paramIndex} OR p.patient_code ILIKE $${paramIndex} OR p.phone_number ILIKE $${paramIndex} OR p.id_card_number ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Count
        const countQuery = `SELECT COUNT(*) FROM patients p ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Data
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT p.*,
                   a.email AS account_email,
                   a.phone_number AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
            data: dataResult.rows as Patient[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân theo ID (JOIN thông tin tài khoản nếu có)
     */
    static async getPatientById(id: string): Promise<Patient | null> {
        const query = `
            SELECT p.*,
                   a.email AS account_email,
                   a.phone_number AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            WHERE p.id = $1 AND p.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra CMND/CCCD đã tồn tại trong hệ thống chưa
     */
    static async checkIdCardExists(idCardNumber: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM patients WHERE id_card_number = $1 AND deleted_at IS NULL`;
        const params: any[] = [idCardNumber];
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        const result = await pool.query(query, params);
        return result.rows.length > 0;
    }

    /**
     * Kiểm tra tài khoản người dùng tồn tại (dùng cho liên kết)
     */
    static async checkAccountExists(accountId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM users WHERE users_id = $1`, [accountId]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới hồ sơ bệnh nhân
     */
    static async createPatient(id: string, patientCode: string, input: CreatePatientInput): Promise<Patient> {
        const query = `
            INSERT INTO patients (
                id, patient_code, full_name, date_of_birth, gender,
                phone_number, email, id_card_number,
                address, province_id, district_id, ward_id,
                emergency_contact_name, emergency_contact_phone
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            patientCode,
            input.full_name,
            input.date_of_birth,
            input.gender,
            input.phone_number || null,
            input.email || null,
            input.id_card_number || null,
            input.address || null,
            input.province_id || null,
            input.district_id || null,
            input.ward_id || null,
            input.emergency_contact_name || null,
            input.emergency_contact_phone || null,
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin hành chính bệnh nhân (chỉ các trường được truyền)
     */
    static async updatePatient(id: string, input: UpdatePatientInput): Promise<Patient> {
        const fields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (input.full_name !== undefined) { fields.push(`full_name = $${paramIndex++}`); params.push(input.full_name); }
        if (input.date_of_birth !== undefined) { fields.push(`date_of_birth = $${paramIndex++}`); params.push(input.date_of_birth); }
        if (input.gender !== undefined) { fields.push(`gender = $${paramIndex++}`); params.push(input.gender); }
        if (input.phone_number !== undefined) { fields.push(`phone_number = $${paramIndex++}`); params.push(input.phone_number); }
        if (input.email !== undefined) { fields.push(`email = $${paramIndex++}`); params.push(input.email); }
        if (input.id_card_number !== undefined) { fields.push(`id_card_number = $${paramIndex++}`); params.push(input.id_card_number); }
        if (input.address !== undefined) { fields.push(`address = $${paramIndex++}`); params.push(input.address); }
        if (input.province_id !== undefined) { fields.push(`province_id = $${paramIndex++}`); params.push(input.province_id); }
        if (input.district_id !== undefined) { fields.push(`district_id = $${paramIndex++}`); params.push(input.district_id); }
        if (input.ward_id !== undefined) { fields.push(`ward_id = $${paramIndex++}`); params.push(input.ward_id); }
        if (input.emergency_contact_name !== undefined) { fields.push(`emergency_contact_name = $${paramIndex++}`); params.push(input.emergency_contact_name); }
        if (input.emergency_contact_phone !== undefined) { fields.push(`emergency_contact_phone = $${paramIndex++}`); params.push(input.emergency_contact_phone); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `UPDATE patients SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE)
     */
    static async updateStatus(id: string, status: string): Promise<Patient> {
        const query = `
            UPDATE patients SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        return result.rows[0];
    }

    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản Mobile App
     */
    static async linkAccount(id: string, accountId: string): Promise<Patient> {
        const query = `
            UPDATE patients SET account_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [accountId, id]);
        return result.rows[0];
    }

    /**
     * Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân
     */
    static async unlinkAccount(id: string): Promise<Patient> {
        const query = `
            UPDATE patients SET account_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Soft delete hồ sơ bệnh nhân
     */
    static async softDeletePatient(id: string): Promise<void> {
        await pool.query(
            `UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
