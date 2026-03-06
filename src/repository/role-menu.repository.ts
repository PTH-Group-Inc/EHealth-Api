import { pool } from '../config/postgresdb';
import { RoleMenuDetail } from '../models/role-menu.model';
import { randomUUID } from 'crypto';

export class RoleMenuRepository {
    /**
     * Lấy danh sách Menu của một Role
     */
    static async getMenusByRoleId(roleId: string): Promise<RoleMenuDetail[]> {
        const query = `
            SELECT m.menus_id, m.code, m.name, m.url, m.icon, m.parent_id, m.sort_order
            FROM role_menus rm
            JOIN menus m ON rm.menu_id = m.menus_id
            WHERE rm.role_id = $1 AND m.deleted_at IS NULL AND m.status = 'ACTIVE'
            ORDER BY m.sort_order ASC
        `;
        const result = await pool.query(query, [roleId]);
        return result.rows;
    }

    /**
     * Gán lẻ một Menu cho Vai trò
     */
    static async assignMenu(
        roleId: string,
        menuId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                INSERT INTO role_menus (role_id, menu_id)
                VALUES ($1, $2)
                ON CONFLICT (role_id, menu_id) DO NOTHING
            `, [roleId, menuId]);

            // Audit
            const auditId = `AUDIT_${Date.now()}_${randomUUID().substring(0, 8)}`;
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id,
                    old_values, new_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                auditId, adminId, 'ASSIGN_ROLE_MENU', 'role_menus', roleId,
                null, JSON.stringify({ assigned_menu_id: menuId }),
                ipAddress, userAgent
            ]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa một Menu khỏi Vai trò
     */
    static async removeMenu(
        roleId: string,
        menuId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                DELETE FROM role_menus
                WHERE role_id = $1 AND menu_id = $2
            `, [roleId, menuId]);

            // Audit
            const auditId = `AUDIT_${Date.now()}_${randomUUID().substring(0, 8)}`;
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id,
                    old_values, new_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                auditId, adminId, 'REMOVE_ROLE_MENU', 'role_menus', roleId,
                JSON.stringify({ removed_menu_id: menuId }), null,
                ipAddress, userAgent
            ]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
