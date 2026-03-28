import { pool } from '../../config/postgresdb';
import { DepartmentSpecialty } from '../../models/Facility Management/department-specialty.model';

export class DepartmentSpecialtyRepository {
    /**
     * Lấy danh sách chuyên khoa đã gán cho 1 phòng ban
     */
    static async getSpecialtiesByDepartmentId(departmentId: string): Promise<DepartmentSpecialty[]> {
        const query = `
            SELECT 
                ds.department_specialty_id,
                ds.department_id,
                ds.specialty_id,
                ds.created_at,
                sp.code  AS specialty_code,
                sp.name  AS specialty_name,
                sp.description AS specialty_description,
                sp.logo_url AS specialty_logo_url
            FROM department_specialties ds
            JOIN specialties sp ON ds.specialty_id = sp.specialties_id
            WHERE ds.department_id = $1 AND sp.deleted_at IS NULL
            ORDER BY sp.name ASC
        `;
        const result = await pool.query(query, [departmentId]);
        return result.rows;
    }

    /**
     * Lấy danh sách chuyên khoa theo chi nhánh (branch_id)
     */
    static async getSpecialtiesByBranchId(branchId: string): Promise<DepartmentSpecialty[]> {
        const query = `
            SELECT DISTINCT ON (sp.specialties_id)
                ds.department_specialty_id,
                ds.department_id,
                ds.specialty_id,
                sp.code  AS specialty_code,
                sp.name  AS specialty_name,
                sp.description AS specialty_description,
                sp.logo_url AS specialty_logo_url,
                d.code   AS department_code,
                d.name   AS department_name
            FROM department_specialties ds
            JOIN departments d   ON ds.department_id = d.departments_id
            JOIN specialties sp  ON ds.specialty_id  = sp.specialties_id
            WHERE d.branch_id = $1
              AND d.deleted_at IS NULL
              AND sp.deleted_at IS NULL
              AND d.status = 'ACTIVE'
            ORDER BY sp.specialties_id, sp.name ASC
        `;
        const result = await pool.query(query, [branchId]);
        return result.rows;
    }

    /**
     * Lấy danh sách chuyên khoa theo cơ sở (facility_id)
     */
    static async getSpecialtiesByFacilityId(facilityId: string): Promise<DepartmentSpecialty[]> {
        const query = `
            SELECT DISTINCT ON (sp.specialties_id)
                ds.department_specialty_id,
                ds.department_id,
                ds.specialty_id,
                sp.code  AS specialty_code,
                sp.name  AS specialty_name,
                sp.description AS specialty_description,
                sp.logo_url AS specialty_logo_url,
                d.code   AS department_code,
                d.name   AS department_name,
                b.branches_id AS branch_id,
                b.name   AS branch_name
            FROM department_specialties ds
            JOIN departments d   ON ds.department_id = d.departments_id
            JOIN branches b      ON d.branch_id      = b.branches_id
            JOIN specialties sp  ON ds.specialty_id   = sp.specialties_id
            WHERE b.facility_id = $1
              AND d.deleted_at IS NULL
              AND sp.deleted_at IS NULL
              AND d.status = 'ACTIVE'
              AND b.status = 'ACTIVE'
            ORDER BY sp.specialties_id, sp.name ASC
        `;
        const result = await pool.query(query, [facilityId]);
        return result.rows;
    }

    /**
     * Kiểm tra liên kết đã tồn tại chưa
     */
    static async exists(departmentId: string, specialtyId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM department_specialties
            WHERE department_id = $1 AND specialty_id = $2
        `;
        const result = await pool.query(query, [departmentId, specialtyId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gán 1 chuyên khoa vào phòng ban
     */
    static async assign(departmentSpecialtyId: string, departmentId: string, specialtyId: string): Promise<DepartmentSpecialty> {
        const query = `
            INSERT INTO department_specialties (department_specialty_id, department_id, specialty_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (department_id, specialty_id) DO NOTHING
            RETURNING *
        `;
        const result = await pool.query(query, [departmentSpecialtyId, departmentId, specialtyId]);
        return result.rows[0];
    }

    /**
     * Gỡ 1 chuyên khoa khỏi phòng ban
     */
    static async remove(departmentId: string, specialtyId: string): Promise<boolean> {
        const query = `
            DELETE FROM department_specialties
            WHERE department_id = $1 AND specialty_id = $2
        `;
        const result = await pool.query(query, [departmentId, specialtyId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gỡ toàn bộ chuyên khoa khỏi phòng ban (Dùng khi Replace strategy)
     */
    static async removeAllByDepartment(departmentId: string): Promise<void> {
        const query = `DELETE FROM department_specialties WHERE department_id = $1`;
        await pool.query(query, [departmentId]);
    }

    /**
     * Kiểm tra phòng ban tồn tại và chưa bị xóa
     */
    static async departmentExists(departmentId: string): Promise<boolean> {
        const query = `SELECT 1 FROM departments WHERE departments_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [departmentId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra chuyên khoa tồn tại và chưa bị xóa
     */
    static async specialtyExists(specialtyId: string): Promise<boolean> {
        const query = `SELECT 1 FROM specialties WHERE specialties_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [specialtyId]);
        return (result.rowCount ?? 0) > 0;
    }
}
