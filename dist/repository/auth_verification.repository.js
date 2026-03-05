"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountVerificationRepository = void 0;
const postgresdb_1 = require("../config/postgresdb");
class AccountVerificationRepository {
    /**
     * Tạo token xác thực email mới
     */
    static async createVerificationToken(id, userId, tokenHash, expiredAt) {
        const query = `
            INSERT INTO account_verifications (
                account_verifications_id,
                user_id,
                verify_token_hash,
                expired_at
            )
            VALUES ($1, $2, $3, $4)
        `;
        await postgresdb_1.pool.query(query, [id, userId, tokenHash, expiredAt]);
    }
    /**
     * Tìm token hợp lệ
     */
    static async findValidToken(tokenHash) {
        const query = `
            SELECT 
                account_verifications_id,
                user_id as "userId",
                verify_token_hash as "verifyTokenHash",
                expired_at as "expiredAt",
                used_at as "usedAt",
                created_at as "createdAt"
            FROM account_verifications
            WHERE verify_token_hash = $1
              AND expired_at > NOW()
              AND used_at IS NULL 
            LIMIT 1
        `;
        const result = await postgresdb_1.pool.query(query, [tokenHash]);
        if (result.rowCount === 0)
            return null;
        return result.rows[0];
    }
    /**
     * Đánh dấu token đã được sử dụng
     */
    static async markAsUsed(id) {
        const query = `
            UPDATE account_verifications
            SET used_at = NOW()
            WHERE account_verifications_id = $1
              AND used_at IS NULL
        `;
        await postgresdb_1.pool.query(query, [id]);
    }
    /**
     * Vô hiệu hóa các token cũ của user này trước khi tạo mới
     */
    static async invalidateOldTokens(userId) {
        const query = `
            UPDATE account_verifications
            SET expired_at = NOW()
            WHERE user_id = $1
              AND used_at IS NULL
              AND expired_at > NOW()
        `;
        await postgresdb_1.pool.query(query, [userId]);
    }
    /**
     * Tìm OTP hợp lệ
     */
    static async findValidOTP(userId, tokenHash) {
        const query = `
            SELECT 
                account_verifications_id,
                user_id as "userId",
                verify_token_hash as "verifyTokenHash",
                expired_at as "expiredAt",
                used_at as "usedAt",
                created_at as "createdAt"
            FROM account_verifications
            WHERE user_id = $1           
              AND verify_token_hash = $2
              AND expired_at > NOW()
              AND used_at IS NULL 
            LIMIT 1
        `;
        const result = await postgresdb_1.pool.query(query, [userId, tokenHash]);
        return result.rows[0] ?? null;
    }
}
exports.AccountVerificationRepository = AccountVerificationRepository;
