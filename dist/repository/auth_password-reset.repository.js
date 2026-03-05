"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetRepository = void 0;
const postgresdb_1 = require("../config/postgresdb");
class PasswordResetRepository {
    /*
     * Tạo mới một token đặt lại mật khẩu
     */
    static async createResetToken(id, userId, resetTokenHash, expiredAt) {
        const query = `
                INSERT INTO password_resets (
                    password_resets_id,   
                    user_id,
                    reset_token,
                    expired_at
                )
                VALUES ($1, $2, $3, $4) 
            `;
        await postgresdb_1.pool.query(query, [id, userId, resetTokenHash, expiredAt]);
    }
    /* * Tìm token đặt lại mật khẩu hợp lệ
     */
    static async findValidToken(resetTokenHash) {
        const query = `
            SELECT password_resets_id, user_id, reset_token, expired_at, used_at, created_at
            FROM password_resets
            WHERE reset_token = $1
              AND expired_at > NOW()
              AND used_at IS NULL
            LIMIT 1
        `;
        const result = await postgresdb_1.pool.query(query, [resetTokenHash]);
        if (result.rowCount === 0)
            return null;
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
    static async markAsUsed(id) {
        const query = `
            UPDATE password_resets
            SET used_at = NOW()
            WHERE password_resets_id = $1
              AND used_at IS NULL
        `;
        await postgresdb_1.pool.query(query, [id]);
    }
}
exports.PasswordResetRepository = PasswordResetRepository;
