// repositories/account.repository.ts

import { pool } from '../config/postgresdb';
import { Account } from '../models/auth_account.model';

export class AccountRepository {
  /**
   * Tìm kiếm tài khoản theo email
   */
  static async findByEmail(email: string): Promise<Account | null> {
    const result = await pool.query<Account>(
      `
      SELECT
        account_id,
        name,
        email,
        phone,
        password,
        role,
        status,
        last_login_at,
        created_at,
        updated_at
      FROM accounting.accounts
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    return result.rows[0] ?? null;
  }

  /**
   * Tìm kiếm tài khoản theo số điện thoại
   */
  static async findByPhone(phone: string): Promise<Account | null> {
    const result = await pool.query<Account>(
      `
      SELECT
        account_id,
        name,
        email,
        phone,
        password,
        role,
        status,
        last_login_at,
        created_at,
        updated_at
      FROM accounting.accounts
      WHERE phone = $1
      LIMIT 1
      `,
      [phone]
    );

    return result.rows[0] ?? null;
  }

  /**
   * Cập nhật thời gian đăng nhập cuối cùng cho tài khoản
   */
  static async updateLastLogin(accountId: string): Promise<void> {
    await pool.query(
      `
      UPDATE accounting.accounts
      SET
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE account_id = $1
      `,
      [accountId]
    );
  }

  /**
   * Cập nhật mật khẩu mới cho account
   */
  static async updatePassword(
    accountId: string,
    hashedPassword: string
  ): Promise<void> {
    const query = `
      UPDATE accounting.accounts
      SET password = $1,
          updated_at = NOW()
      WHERE account_id = $2
    `;

    await pool.query(query, [hashedPassword, accountId]);
  }


  /**
   * Tạo tài khoản mới
   */
  static async createAccount(account: Account): Promise<void> {
    const query = `
            INSERT INTO accounting.accounts (
                account_id,
                name,
                email,
                phone,
                password,
                role,
                status,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `;

    await pool.query(query, [
      account.account_id,
      account.name,
      account.email || null,
      account.phone || null,
      account.password,
      account.role,
      account.status
    ]);
  }


  /**
     * Kích hoạt tài khoản (Update status -> ACTIVE)
     */
  static async activateAccount(accountId: string): Promise<void> {
    const query = `
            UPDATE accounting.accounts
            SET status = 'ACTIVE',
                updated_at = NOW()
            WHERE account_id = $1
        `;
    await pool.query(query, [accountId]);
  }
}