import { pool } from '../../config/postgresdb';
import { DepartmentDropdown, DepartmentInfo, CreateDepartmentInput, UpdateDepartmentInput, DepartmentQuery } from '../../models/Facility Management/department.model';

export class DepartmentRepository {
    /*
    / Tìm kiếm và lấy danh sách khoa/phòng ban
    */
    static async findAllDepartments(queryOptions: DepartmentQuery): Promise<{ data: DepartmentInfo[], total: number }> {
        const { page = 1, limit = 10, search, branch_id, status } = queryOptions;
        const offset = (page - 1) * limit;

        let queryParams: any[] = [];
        let whereClauses = ['d.deleted_at IS NULL'];

        if (search) {
            whereClauses.push(`(d.name ILIKE $${queryParams.length + 1} OR d.code ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }

        if (branch_id) {
            whereClauses.push(`d.branch_id = $${queryParams.length + 1}`);
            queryParams.push(branch_id);
        }

        if (status) {
            whereClauses.push(`d.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Aggregate stats: JOIN qua user_branch_dept -> doctors (doctor_count)
        // và medical_rooms -> appointments (appointment_today, patient_count today)
        // -> trả về cho FE thay vì FE phải call thêm 3 API rồi aggregate ở client.
        const query = `
            SELECT d.departments_id, d.branch_id, d.code, d.name, d.description, d.logo_url, d.status,
                   b.name as branch_name, f.name as facility_name,
                   COALESCE(doc_stats.doctor_count, 0)::int        AS doctor_count,
                   COALESCE(appt_stats.appointment_today, 0)::int  AS appointment_today,
                   COALESCE(appt_stats.patient_count, 0)::int      AS patient_count
            FROM departments d
            INNER JOIN branches b ON d.branch_id = b.branches_id
            INNER JOIN facilities f ON b.facility_id = f.facilities_id
            LEFT JOIN (
                SELECT ubd.department_id, COUNT(DISTINCT doc.doctors_id) AS doctor_count
                FROM user_branch_dept ubd
                INNER JOIN doctors doc ON doc.user_id = ubd.user_id AND doc.is_active = TRUE
                WHERE ubd.department_id IS NOT NULL AND ubd.status = 'ACTIVE'
                GROUP BY ubd.department_id
            ) doc_stats ON doc_stats.department_id = d.departments_id
            LEFT JOIN (
                SELECT mr.department_id,
                       COUNT(a.appointments_id)               AS appointment_today,
                       COUNT(DISTINCT a.patient_id)           AS patient_count
                FROM appointments a
                INNER JOIN medical_rooms mr ON mr.medical_rooms_id = a.room_id
                WHERE a.appointment_date = CURRENT_DATE
                  AND mr.department_id IS NOT NULL
                GROUP BY mr.department_id
            ) appt_stats ON appt_stats.department_id = d.departments_id
            ${whereString}
            ORDER BY d.code ASC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM departments d
            ${whereString}
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, [...queryParams, limit, offset]),
            pool.query(countQuery, queryParams)
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    /*
    / Lấy danh sách khoa/phòng ban cho dropdown
    */

    static async getDepartmentsForDropdown(branch_id?: string): Promise<DepartmentDropdown[]> {
        let query = `
            SELECT departments_id, branch_id, code, name, logo_url
            FROM departments
            WHERE status = 'ACTIVE' AND deleted_at IS NULL
        `;
        const params: any[] = [];
        if (branch_id) {
            params.push(branch_id);
            query += ` AND branch_id = $1`;
        }
        query += ` ORDER BY name ASC`;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /*
    / Kiểm tra mã khoa/phòng ban đã tồn tại trong chi nhánh
    */

    static async checkDepartmentCodeExistsInBranch(code: string, branch_id: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM departments 
            WHERE code = $1 AND branch_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code, branch_id]);
        return (result.rowCount ?? 0) > 0;
    }

    /*
    / Tìm kiếm khoa/phòng ban theo ID
    */

    static async findDepartmentById(id: string): Promise<DepartmentInfo | null> {
        const query = `
            SELECT d.*, b.name as branch_name, b.facility_id, f.name as facility_name
            FROM departments d
            INNER JOIN branches b ON d.branch_id = b.branches_id
            INNER JOIN facilities f ON b.facility_id = f.facilities_id
            WHERE d.departments_id = $1 AND d.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }


    /*
    / Tạo khoa/phòng ban
    */
    static async createDepartment(data: CreateDepartmentInput & { departments_id: string }): Promise<void> {
        const query = `
            INSERT INTO departments (departments_id, branch_id, code, name, description, logo_url)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const values = [data.departments_id, data.branch_id, data.code, data.name, data.description || null, data.logo_url || null];
        await pool.query(query, values);
    }



    /*
    / Cập nhật thông tin khoa/phòng ban
    */
    static async updateDepartmentInfo(id: string, updates: UpdateDepartmentInput): Promise<DepartmentInfo> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (updates.name !== undefined) {
            setClauses.push(`name = $${index++}`);
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${index++}`);
            values.push(updates.description);
        }

        if (setClauses.length === 0) {
            const current = await this.findDepartmentById(id);
            if (!current) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
            return current;
        }

        const query = `
            UPDATE departments
            SET ${setClauses.join(', ')}
            WHERE departments_id = $${index} AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, [...values, id]);
        if ((result.rowCount ?? 0) === 0) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
        return result.rows[0];
    }



    /*
    / Cập nhật trạng thái khoa/phòng ban
    */
    static async updateDepartmentStatus(id: string, status: string): Promise<void> {
        const query = `
            UPDATE departments
            SET status = $1
            WHERE departments_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [status, id]);
        if ((result.rowCount ?? 0) === 0) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
    }


    /*
    / Xóa khoa/phòng ban
    */
    static async deleteDepartment(id: string): Promise<void> {
        const query = `
            UPDATE departments
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE departments_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        if ((result.rowCount ?? 0) === 0) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
    }
}
