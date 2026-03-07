import { pool } from '../config/postgresdb';

export class DoctorRepository {
    /**
     * Đếm số lượng bác sĩ đang trực thuộc một chuyên khoa cụ thể.
     */
    static async countDoctorsBySpecialtyId(specialtyId: string): Promise<number> {
        const query = `SELECT COUNT(*) as total FROM doctors WHERE specialty_id = $1`;
        const result = await pool.query(query, [specialtyId]);
        return parseInt(result.rows[0].total, 10);
    }
}