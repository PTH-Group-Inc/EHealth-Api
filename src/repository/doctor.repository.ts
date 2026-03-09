import { pool } from '../config/postgresdb';
import { randomUUID } from 'crypto';
import { UpdateDoctorInfoInput } from '../models/staff.model';

export class DoctorRepository {
    /**
     * Đếm số lượng bác sĩ đang trực thuộc một chuyên khoa cụ thể.
     */
    static async countDoctorsBySpecialtyId(specialtyId: string): Promise<number> {
        const query = `SELECT COUNT(*) as total FROM doctors WHERE specialty_id = $1`;
        const result = await pool.query(query, [specialtyId]);
        return parseInt(result.rows[0].total, 10);
    }

    /**
     * Cập nhật thông tin chuyên môn bác sĩ (UPSERT)
     */
    static async upsertDoctorInfo(userId: string, data: UpdateDoctorInfoInput): Promise<void> {
        const doctorId = `DOC_${randomUUID()}`;
        const query = `
            INSERT INTO doctors (
                doctors_id, user_id, specialty_id, title, biography, consultation_fee
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) DO UPDATE SET
                specialty_id = EXCLUDED.specialty_id,
                title = EXCLUDED.title,
                biography = EXCLUDED.biography,
                consultation_fee = EXCLUDED.consultation_fee,
                is_active = TRUE
        `;
        const params = [
            doctorId, userId, data.specialty_id, data.title || null, data.biography || null, data.consultation_fee || null
        ];
        await pool.query(query, params);
    }

    /**
     * Lấy thông tin bác sĩ theo user_id
     */
    static async getDoctorByUserId(userId: string) {
        const query = `SELECT * FROM doctors WHERE user_id = $1`;
        const result = await pool.query(query, [userId]);
        return result.rows[0] || null;
    }
}