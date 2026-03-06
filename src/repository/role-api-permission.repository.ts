import { pool } from '../config/postgresdb';
import { RoleApiPermissionDetail } from '../models/role-api-permission.model';
import { randomUUID } from 'crypto';

export class RoleApiPermissionRepository {
    /**
     * Lấy danh sách toàn bộ API Permissions được phép truy cập bởi một Vai trò
     */
    static async getApiPermissionsByRoleId(roleId: string): Promise<RoleApiPermissionDetail[]> {
        const query = `
            SELECT 
                r.role_id, r.role_name, r.role_code,
                a.api_id, a.method, a.endpoint, a.description, a.module, a.status
            FROM role_api_permissions rap
            JOIN roles r ON rap.role_id = r.role_id
            JOIN api_permissions a ON rap.api_id = a.api_id
            WHERE rap.role_id = $1 AND r.deleted_at IS NULL AND a.deleted_at IS NULL AND a.status = 'ACTIVE'
            ORDER BY a.module ASC, a.endpoint ASC, a.method ASC
        `;
        const result = await pool.query(query, [roleId]);
        return result.rows;
    }

    /**
     * Gán 1 API permission cho một Role
     */
    static async assignApiPermission(
        roleId: string,
        apiId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                INSERT INTO role_api_permissions (role_id, api_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [roleId, apiId]);

            // Audit
            const auditId = 'AUDIT_' + Date.now() + '_' + randomUUID().substring(0, 8);
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id, new_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [auditId, adminId, 'ASSIGN_ROLE_API_PERMISSION', 'role_api_permissions', `${roleId}_${apiId}`, JSON.stringify({ role_id: roleId, api_id: apiId }), ipAddress, userAgent]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa gán API permission khỏi Role
     */
    static async removeApiPermission(
        roleId: string,
        apiId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const checkExists = await client.query(`SELECT 1 FROM role_api_permissions WHERE role_id = $1 AND api_id = $2`, [roleId, apiId]);
            if (checkExists.rowCount === 0) {
                return; // Nothing to delete
            }

            await client.query(`
                DELETE FROM role_api_permissions
                WHERE role_id = $1 AND api_id = $2
            `, [roleId, apiId]);

            // Audit
            const auditId = 'AUDIT_' + Date.now() + '_' + randomUUID().substring(0, 8);
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id, old_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [auditId, adminId, 'REMOVE_ROLE_API_PERMISSION', 'role_api_permissions', `${roleId}_${apiId}`, JSON.stringify({ role_id: roleId, api_id: apiId }), ipAddress, userAgent]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
