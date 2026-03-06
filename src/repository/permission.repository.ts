import { pool } from '../config/postgresdb';
import { PermissionDetail, CreatePermissionInput, UpdatePermissionInput, PermissionQueryFilter } from '../models/permission.model';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/app-error.util';
import { SecurityUtil } from '../utils/auth-security.util';

export class PermissionRepository {
    /**
     * Lấy danh sách quyền
     */
    static async getPermissions(filter: PermissionQueryFilter): Promise<PermissionDetail[]> {
        let query = `
            SELECT permissions_id, code, module, description
            FROM permissions
            WHERE deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.search) {
            query += ` AND (code ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            params.push(`%${filter.search}%`);
            paramIndex++;
        }

        if (filter.module) {
            query += ` AND module = $${paramIndex}`;
            params.push(filter.module);
            paramIndex++;
        }

        query += ` ORDER BY module ASC, code ASC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy danh sách các Module riêng biệt
     */
    static async getDistinctModules(): Promise<string[]> {
        const query = `
            SELECT DISTINCT module
            FROM permissions
            WHERE deleted_at IS NULL
            ORDER BY module ASC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => row.module);
    }

    /**
     * Lấy chi tiết quyền theo ID
     */
    static async getPermissionById(id: string): Promise<PermissionDetail | null> {
        const query = `
            SELECT permissions_id, code, module, description
            FROM permissions
            WHERE permissions_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Lấy chi tiết quyền theo Code
     */
    static async getPermissionByCode(code: string): Promise<PermissionDetail | null> {
        const query = `
            SELECT permissions_id, code, module, description
            FROM permissions
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Tạo quyền mới
     */
    static async createPermission(
        data: CreatePermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<PermissionDetail> {
        const permissionId = SecurityUtil.generatePermissionId();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO permissions (permissions_id, code, module, description)
                VALUES ($1, $2, $3, $4)
                RETURNING permissions_id, code, module, description
            `;
            const params = [permissionId, data.code, data.module, data.description || ''];
            const result = await client.query(query, params);
            const newPermission = result.rows[0];

            // Audit
            const auditId = `AUDIT_${Date.now()}_${randomUUID().substring(0, 8)}`;
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id,
                    old_values, new_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                auditId, adminId, 'CREATE_PERMISSION', 'permissions', permissionId,
                null, JSON.stringify(newPermission), ipAddress, userAgent
            ]);

            await client.query('COMMIT');
            return newPermission;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cập nhật quyền
     */
    static async updatePermission(
        permissionId: string,
        data: UpdatePermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<PermissionDetail> {
        const currentPermission = await this.getPermissionById(permissionId);
        if (!currentPermission) throw new AppError(404, 'NOT_FOUND', 'Quyền không tồn tại');

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        const permissionCopy = { ...currentPermission };

        if (data.module !== undefined) {
            updates.push(`module = $${paramIndex++}`);
            params.push(data.module);
            permissionCopy.module = data.module;
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description);
            permissionCopy.description = data.description;
        }

        if (updates.length === 0) {
            return currentPermission;
        }

        params.push(permissionId);
        const query = `
            UPDATE permissions
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE permissions_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING permissions_id, code, module, description
        `;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(query, params);

            // Audit
            const auditId = `AUDIT_${Date.now()}_${randomUUID().substring(0, 8)}`;
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id,
                    old_values, new_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                auditId, adminId, 'UPDATE_PERMISSION', 'permissions', permissionId,
                JSON.stringify(currentPermission), JSON.stringify(result.rows[0]), ipAddress, userAgent
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa quyền
     */
    static async deletePermission(
        permissionId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const currentPermission = await this.getPermissionById(permissionId);
        if (!currentPermission) return;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Soft delete
            const query = `UPDATE permissions SET deleted_at = CURRENT_TIMESTAMP WHERE permissions_id = $1`;
            await client.query(query, [permissionId]);

            // Audit
            const auditId = `AUDIT_${Date.now()}_${randomUUID().substring(0, 8)}`;
            await client.query(`
                INSERT INTO audit_logs (
                    audit_logs_id, user_id, action, table_name, record_id,
                    old_values, new_values, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                auditId, adminId, 'DELETE_PERMISSION', 'permissions', permissionId,
                JSON.stringify(currentPermission), JSON.stringify({ deleted_at: 'CURRENT_TIMESTAMP' }),
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
     * Kiểm tra bao nhiêu vai trò (Role) đang sử dụng quyền này
     */
    static async countRolesByPermission(permissionId: string): Promise<number> {
        const query = `SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1`;
        const result = await pool.query(query, [permissionId]);
        return parseInt(result.rows[0].count, 10);
    }
}
