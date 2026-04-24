import { pool } from '../../config/postgresdb';
import { PasswordReset } from '../../models/Core/auth_password-reset.model';

export class PasswordResetRepository {
    /*
     * Tạo mới một token đặt lại mật khẩu
     */
    static async createResetToken(
        id: string,
        userId: string,
        resetTokenHash: string,
        expiredAt: Date
    ): Promise<void> {

        const query = `
                INSERT INTO password_resets (
                    password_resets_id,   
                    user_id,
                    reset_token,
                    expired_at
                )
                VALUES ($1, $2, $3, $4) 
            `;

        await pool.query(query, [id, userId, resetTokenHash, expiredAt]);
    }

    /* * Tìm token đặt lại mật khẩu hợp lệ
     */
    static async findValidToken(
        resetTokenHash: string
    ): Promise<PasswordReset | null> {
        const query = `
            SELECT password_resets_id, user_id, reset_token, expired_at, used_at, created_at
            FROM password_resets
            WHERE reset_token = $1
              AND expired_at > NOW()
              AND used_at IS NULL
            LIMIT 1
        `;

        const result = await pool.query(query, [resetTokenHash]);

        if (result.rowCount === 0) return null;

        return {
            password_resets_id: result.rows[0].password_resets_id,
            userId: result.rows[0].user_id,
            resetToken: result.rows[0].reset_token,
            expiredAt: result.rows[0].expired_at,
            usedAt: result.rows[0].used_at,
            createdAt: result.rows[0].created_at,
        };
    }

    /* 
    * Đánh dấu token đã được sử dụng
    */
    static async markAsUsed(id: string): Promise<void> {
        const query = `
            UPDATE password_resets
            SET used_at = NOW()
            WHERE password_resets_id = $1
              AND used_at IS NULL
        `;

        await pool.query(query, [id]);
    }

    /**
     * Lấy token mới nhất của user
     */
    static async findLatestToken(userId: string): Promise<PasswordReset | null> {
        const query = `
            SELECT password_resets_id, user_id, reset_token, expired_at, used_at, created_at
            FROM password_resets
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rowCount === 0) return null;

        return {
            password_resets_id: result.rows[0].password_resets_id,
            userId: result.rows[0].user_id,
            resetToken: result.rows[0].reset_token,
            expiredAt: result.rows[0].expired_at,
            usedAt: result.rows[0].used_at,
            createdAt: result.rows[0].created_at,
        };
    }

    /**
     * Đếm số lượng token đã tạo trong khoảng thời gian
     */
    static async countRecentTokens(userId: string, hours: number): Promise<number> {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        const query = `
            SELECT COUNT(*) as count
            FROM password_resets
            WHERE user_id = $1
              AND created_at >= $2
        `;

        const result = await pool.query(query, [userId, since]);
        return parseInt(result.rows[0].count, 10);
    }
}