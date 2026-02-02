import { pool } from '../config/postgresdb';
import { AccountVerification } from '../models/auth_verification.model';

export class AccountVerificationRepository {
    /**
     * Tạo token xác thực email mới
     */
    static async createVerificationToken(id: string, accountId: string, tokenHash: string, expiredAt: Date): Promise<void> {
        const query = `
            INSERT INTO accounting.account_verifications (
                id,
                account_id,
                verify_token_hash,
                expired_at
            )
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(query, [id, accountId, tokenHash, expiredAt]);
    }

    /**
     * Tìm token hợp lệ
     */
    static async findValidToken(tokenHash: string): Promise<AccountVerification | null> {
        const query = `
            SELECT 
                id,
                account_id as "accountId",
                verify_token_hash as "verifyTokenHash",
                expired_at as "expiredAt",
                used_at as "usedAt",
                created_at as "createdAt"
            FROM accounting.account_verifications
            WHERE verify_token_hash = $1
              AND expired_at > NOW()
              AND used_at IS NULL 
            LIMIT 1
        `;

        const result = await pool.query(query, [tokenHash]);
        
        if (result.rowCount === 0) return null;

        return result.rows[0];
    }

    /**
     * Đánh dấu token đã được sử dụng
     */
    static async markAsUsed(id: string): Promise<void> {
        const query = `
            UPDATE accounting.account_verifications
            SET used_at = NOW()
            WHERE id = $1
              AND used_at IS NULL
        `;

        await pool.query(query, [id]);
    }

    /**
     * Vô hiệu hóa các token cũ của user này trước khi tạo mới
     */
    static async invalidateOldTokens(accountId: string): Promise<void> {
        const query = `
            UPDATE accounting.account_verifications
            SET expired_at = NOW()
            WHERE account_id = $1
              AND used_at IS NULL
              AND expired_at > NOW()
        `;
        await pool.query(query, [accountId]);
    }
}