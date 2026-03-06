import { pool } from '../config/postgresdb';

export class RoleRepository {
    /**
     * Lấy danh sách toàn bộ vai trò (Role)
     */
    static async getAllRoles(): Promise<{ roles_id: string, code: string, name: string, description: string }[]> {
        const query = `
            SELECT roles_id, code, name, description, is_system
            FROM roles
            ORDER BY code ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}
