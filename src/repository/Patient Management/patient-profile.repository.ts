/**
 * Patient Profile Repository (Multi-Profile)
 *
 * Module 1 — Multi-Patient Profiles
 * Cho phép 1 account quản lý nhiều patient profiles (cho gia đình)
 *
 * Reuse cột `account_id` của bảng patients.
 * Thêm 2 cột mới: relationship + is_default.
 */

import { pool } from '../../config/postgresdb';
import { Patient, CreatePatientProfileInput, PatientRelationship } from '../../models/Patient Management/patient.model';

export class PatientProfileRepository {

    /**
     * Lấy tất cả profiles của 1 account (kèm thông tin liên hệ tài khoản)
     */
    static async findByAccountId(accountId: string): Promise<Patient[]> {
        const query = `
            SELECT p.*,
                   a.email AS account_email,
                   a.phone AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            WHERE p.account_id = $1
              AND p.deleted_at IS NULL
            ORDER BY p.is_default DESC NULLS LAST, p.created_at ASC
        `;
        const result = await pool.query(query, [accountId]);
        return result.rows;
    }

    /**
     * Lấy 1 profile theo id, đồng thời check ownership với accountId
     * Trả null nếu không tìm thấy hoặc không thuộc account
     */
    static async findByIdAndAccount(id: string, accountId: string): Promise<Patient | null> {
        const query = `
            SELECT p.*,
                   a.email AS account_email,
                   a.phone AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            WHERE p.id = $1
              AND p.account_id = $2
              AND p.deleted_at IS NULL
            LIMIT 1
        `;
        const result = await pool.query(query, [id, accountId]);
        return result.rows[0] || null;
    }

    /**
     * Tạo patient profile mới gắn với account đang đăng nhập
     */
    static async createProfile(
        id: string,
        patientCode: string,
        accountId: string,
        input: CreatePatientProfileInput,
    ): Promise<Patient> {
        const relationship: PatientRelationship = input.relationship || 'OTHER';
        const isDefault = input.is_default ?? false;

        const query = `
            INSERT INTO patients (
                id, patient_code, account_id, full_name, date_of_birth, gender,
                phone_number, email, id_card_number,
                address, province_id, district_id, ward_id,
                emergency_contact_name, emergency_contact_phone,
                relationship, is_default
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            patientCode,
            accountId,
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
            relationship,
            isDefault,
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật relationship của 1 profile
     */
    static async updateRelationship(id: string, relationship: PatientRelationship): Promise<Patient> {
        const query = `
            UPDATE patients
            SET relationship = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, [relationship, id]);
        return result.rows[0];
    }

    /**
     * Set 1 profile làm default. Tự động unset default của các profile khác trong cùng account.
     * Dùng transaction để đảm bảo atomic.
     */
    static async setDefault(id: string, accountId: string): Promise<Patient> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Unset all other defaults
            await client.query(
                `UPDATE patients
                 SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP
                 WHERE account_id = $1 AND id <> $2 AND deleted_at IS NULL`,
                [accountId, id],
            );

            // Set this one as default
            const result = await client.query(
                `UPDATE patients
                 SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL
                 RETURNING *`,
                [id, accountId],
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Soft delete profile (ngừng sử dụng). Nếu profile đang là default, default sẽ chuyển sang profile khác.
     */
    static async softDelete(id: string, accountId: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lấy profile hiện tại
            const currentRes = await client.query(
                `SELECT id, is_default FROM patients
                 WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL`,
                [id, accountId],
            );
            const current = currentRes.rows[0];
            if (!current) {
                throw new Error('Profile không tồn tại hoặc không thuộc tài khoản');
            }

            // Soft delete
            await client.query(
                `UPDATE patients
                 SET deleted_at = CURRENT_TIMESTAMP, is_default = FALSE,
                     status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [id],
            );

            // Nếu profile vừa xóa là default, set default sang profile cũ nhất còn active
            if (current.is_default) {
                await client.query(
                    `UPDATE patients
                     SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
                     WHERE id = (
                         SELECT id FROM patients
                         WHERE account_id = $1 AND deleted_at IS NULL
                         ORDER BY created_at ASC LIMIT 1
                     )`,
                    [accountId],
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Đếm số profile của account (để giới hạn nếu cần)
     */
    static async countByAccount(accountId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM patients
             WHERE account_id = $1 AND deleted_at IS NULL`,
            [accountId],
        );
        return result.rows[0]?.cnt ?? 0;
    }

    /**
     * Lấy default profile của account (dùng khi đặt lịch nếu user không chỉ định)
     */
    static async getDefault(accountId: string): Promise<Patient | null> {
        const query = `
            SELECT * FROM patients
            WHERE account_id = $1
              AND is_default = TRUE
              AND deleted_at IS NULL
            LIMIT 1
        `;
        const result = await pool.query(query, [accountId]);
        return result.rows[0] || null;
    }
}
