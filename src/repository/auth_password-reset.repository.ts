import { pool } from '../config/postgresdb';
import { PasswordReset } from '../models/auth_password-reset.model';

export class PasswordResetRepository {
    /*
     * Tạo mới một token đặt lại mật khẩu (Có Transaction: Xóa cũ -> Thêm mới)
     */
    static async createResetToken(
        id: string,
        accountId: string,
        resetTokenHash: string,
        expiredAt: Date
    ): Promise<void> {


        const query = `
                INSERT INTO accounting.password_resets (
                    id,   
                    account_id,
                    reset_token,
                    expired_at
                )
                VALUES ($1, $2, $3, $4) 
            `;

        await pool.query(query, [id, accountId, resetTokenHash, expiredAt]);

    }

    /* * Tìm token đặt lại mật khẩu hợp lệ
     */
    static async findValidToken(
        resetTokenHash: string
    ): Promise<PasswordReset | null> {
        const query = `
            SELECT *
            FROM accounting.password_resets
            WHERE reset_token = $1
              AND expired_at > NOW()
              AND used_at IS NULL
            LIMIT 1
        `;

        const result = await pool.query(query, [resetTokenHash]);

        if (result.rowCount === 0) return null;

        return {
            id: result.rows[0].id,
            accountId: result.rows[0].account_id,
            resetToken: result.rows[0].reset_token,
            expiredAt: result.rows[0].expired_at,
            usedAt: result.rows[0].used_at,
            createdAt: result.rows[0].created_at,
        };
    }

    /* * Đánh dấu token đã được sử dụng
     */
    static async markAsUsed(id: string): Promise<void> {
        const query = `
            UPDATE accounting.password_resets
            SET used_at = NOW()
            WHERE id = $1
              AND used_at IS NULL
        `;

        await pool.query(query, [id]);
    }
}