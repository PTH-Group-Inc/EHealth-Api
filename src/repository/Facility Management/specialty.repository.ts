import { pool } from '../../config/postgresdb';
import { Specialty, SpecialtyPayloadDTO } from '../../models/Facility Management/specialty.model';

export class SpecialtyRepository {
    /**
     * Lấy danh sách chuyên khoa có phân trang và tìm kiếm.
     */
    static async getSpecialties(page: number, limit: number, searchKeyword?: string): Promise<[Specialty[], number]> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        // Count query dùng alias rỗng (chỉ FROM specialties), data query alias `s`.
        // Tách 2 whereClause để tránh phải regex replace.
        let countWhere = 'WHERE deleted_at IS NULL';
        let dataWhere = 'WHERE s.deleted_at IS NULL';

        if (searchKeyword) {
            countWhere += ` AND (name ILIKE $1 OR code ILIKE $1)`;
            dataWhere += ` AND (s.name ILIKE $1 OR s.code ILIKE $1)`;
            params.push(`%${searchKeyword}%`);
        }

        const countQuery = `SELECT COUNT(*) as total FROM specialties ${countWhere}`;
        // Aggregate stats: service_count via specialty_services, doctor_count via doctors.
        // Tránh FE phải call thêm 2 API rồi aggregate ở client.
        const dataQuery = `
            SELECT s.specialties_id, s.code, s.name, s.description, s.logo_url,
                   COALESCE(svc_stats.service_count, 0)::int AS service_count,
                   COALESCE(doc_stats.doctor_count, 0)::int  AS doctor_count
            FROM specialties s
            LEFT JOIN (
                SELECT specialty_id, COUNT(*) AS service_count
                FROM specialty_services
                GROUP BY specialty_id
            ) svc_stats ON svc_stats.specialty_id = s.specialties_id
            LEFT JOIN (
                SELECT specialty_id, COUNT(*) AS doctor_count
                FROM doctors
                WHERE is_active = TRUE
                GROUP BY specialty_id
            ) doc_stats ON doc_stats.specialty_id = s.specialties_id
            ${dataWhere}
            ORDER BY s.code ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, params),
            pool.query(dataQuery, [...params, limit, offset])
        ]);

        const total = parseInt(countResult.rows[0].total, 10);
        return [dataResult.rows, total];
    }

    /**
     * Lấy thông tin chi tiết một chuyên khoa theo ID.
     */
    static async getSpecialtyById(id: string): Promise<Specialty | null> {
        const query = `
            SELECT specialties_id, code, name, description, logo_url 
            FROM specialties 
            WHERE specialties_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] ?? null;
    }

    /**
     * Lấy chuyên khoa theo mã code (dùng để validate trùng lặp).
     */
    static async getSpecialtyByCode(code: string): Promise<Specialty | null> {
        const query = `
            SELECT specialties_id, code, name, description, logo_url 
            FROM specialties 
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows[0] ?? null;
    }

    /**
     * Thêm mới chuyên khoa.
     */
    static async createSpecialty(specialty: Specialty): Promise<Specialty> {
        const query = `
            INSERT INTO specialties (specialties_id, code, name, description, logo_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING specialties_id, code, name, description, logo_url;
        `;
        const values = [specialty.specialties_id, specialty.code, specialty.name, specialty.description, specialty.logo_url || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin chuyên khoa.
     */
    static async updateSpecialty(id: string, payload: Partial<SpecialtyPayloadDTO>): Promise<Specialty | null> {
        const fields = Object.keys(payload) as (keyof SpecialtyPayloadDTO)[];

        if (fields.length === 0) return null;

        const setClauses = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
        const values = fields.map(field => payload[field]);

        const query = `
            UPDATE specialties 
            SET ${setClauses}
            WHERE specialties_id = $1 
            RETURNING specialties_id, code, name, description, logo_url;
        `;
        const result = await pool.query(query, [id, ...values]);
        return result.rows[0] ?? null;
    }

    /**
     * Xóa mềm chuyên khoa (Cập nhật cột deleted_at)
     */
    static async softDeleteSpecialty(id: string): Promise<boolean> {
        const query = `
            UPDATE specialties 
            SET deleted_at = CURRENT_TIMESTAMP 
            WHERE specialties_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }
}