import { pool } from '../config/postgresdb';
import { UserSession } from '../models/auth_user-session.model';
import { CreateSessionInput } from '../models/auth_user-session.model';
import { AuthSessionUtil } from '../utils/auth-session.util';

export class UserSessionRepository {
  /**
   * Tạo mới một user session
   */
  static async createSession(input: CreateSessionInput): Promise<void> {
    const {
      sessionId = AuthSessionUtil.generate(input.accountId),
      accountId,
      refreshTokenHash,
      deviceId,
      deviceName,
      ipAddress,
      userAgent,
      expiredAt,
    } = input;

    await pool.query(
      `
      INSERT INTO accounting.user_sessions (
        session_id,
        account_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        expired_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      `,
      [
        sessionId,
        accountId,
        refreshTokenHash,
        deviceId ?? null,
        deviceName ?? null,
        ipAddress ?? null,
        userAgent ?? null,
        expiredAt,
      ]
    );
  }

  // Tìm user session theo accountId và deviceId
  static async findByAccountAndDevice(accountId: string, deviceId: string | null): Promise<UserSession | null> {
    const result = await pool.query<UserSession>(
      `
      SELECT
        session_id,
        account_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM accounting.user_sessions
      WHERE account_id = $1
        AND (device_id = $2 OR (device_id IS NULL AND $2 IS NULL))
        AND revoked_at IS NULL
        AND expired_at > NOW()
      LIMIT 1
      `,
      [accountId, deviceId]
    );

    return result.rows[0] ?? null;
  }

  // Cập nhật user session theo ID
  static async updateSessionBySessionId(sessionId: string, input: { refreshTokenHash: string; ipAddress?: string; userAgent?: string; expiredAt: Date; }): Promise<void> {
    await pool.query(
      `
      UPDATE accounting.user_sessions
      SET
        refresh_token_hash = $1,
        ip_address = $2,
        user_agent = $3,
        expired_at = $4,
        last_used_at = NOW(),
        revoked_at = NULL
      WHERE session_id = $5
      `,
      [
        input.refreshTokenHash,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.expiredAt,
        sessionId,
      ]
    );
  }

  /**
   * Đăng xuất session hiện tại 
   */
  static async logoutCurrentSession(accountId: string, refreshTokenHash: string): Promise<boolean> {
    const result = await pool.query(
      `
      UPDATE accounting.user_sessions
      SET revoked_at = NOW()
      WHERE account_id = $1
        AND refresh_token_hash = $2
        AND revoked_at IS NULL
        AND expired_at > NOW()
      `,
      [accountId, refreshTokenHash]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Đăng xuất toàn bộ session của một tài khoản
   */
  static async revokeAllByAccount(accountId: string): Promise<number> {
    const result = await pool.query(
      `
      UPDATE accounting.user_sessions
      SET revoked_at = NOW()
      WHERE account_id = $1
        AND revoked_at IS NULL
      `,
      [accountId]
    );

    return result.rowCount ?? 0;
  }


  /**
   * Tìm session còn hiệu lực theo refresh token
   */
  static async findActiveSessionByRefreshToken(
    refreshTokenHash: string
  ): Promise<UserSession | null> {
    const result = await pool.query<UserSession>(
      `
      SELECT
        session_id,
        account_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM accounting.user_sessions
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
        AND expired_at > NOW()
      LIMIT 1
      `,
      [refreshTokenHash]
    );

    return result.rows[0] ?? null;
  }

  /**
  * Cập nhật thời gian sử dụng cuối cùng của session
  */
  static async updateLastUsed(sessionId: string): Promise<void> {
    await pool.query(
      `
      UPDATE accounting.user_sessions
      SET last_used_at = NOW()
      WHERE session_id = $1
      `,
      [sessionId]
    );
  }

  /*
   * Lấy danh sách session còn hiệu lực của một tài khoản
   */

  static async findActiveByAccount(accountId: string): Promise<UserSession[]> {
    const result = await pool.query<UserSession>(
      `SELECT session_id, device_name, ip_address, last_used_at, created_at, expired_at
         FROM accounting.user_sessions
         WHERE account_id = $1 AND revoked_at IS NULL AND expired_at > NOW()
         ORDER BY last_used_at DESC`,
      [accountId]
    );
    return result.rows;
  }

  /*
   * Thu hồi (revoke) một session theo sessionId
   */
  static async revokeBySessionId(sessionId: string, accountId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE accounting.user_sessions
         SET revoked_at = NOW()
         WHERE session_id = $1 AND account_id = $2 AND revoked_at IS NULL`,
      [sessionId, accountId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /*
   * Thu hồi (revoke) một session theo refreshTokenHash
   */
  static async findActiveBySessionId(sessionId: string): Promise<UserSession | null> {
    const result = await pool.query<UserSession>(
        `SELECT * FROM accounting.user_sessions 
         WHERE session_id = $1 AND revoked_at IS NULL AND expired_at > NOW() 
         LIMIT 1`,
        [sessionId]
    );
    return result.rows[0] ?? null;
}
}