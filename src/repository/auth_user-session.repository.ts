import { pool } from '../config/postgresdb';
import { UserSession } from '../models/auth_user-session.model';

export interface CreateSessionInput {
  accountId: string;
  refreshTokenHash: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  expiredAt: Date;
}

export class UserSessionRepository {
  /**
   * Tạo mới một user session
   */
  static async createSession(input: CreateSessionInput): Promise<void> {
    const {
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
        account_id,
        refresh_token,
        device_id,
        device_name,
        ip_address,
        user_agent,
        expired_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      `,
      [
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

  /**
   * Tìm user session theo refresh token (chỉ session còn hiệu lực)
   */
  static async findByRefreshToken(
    refreshTokenHash: string
  ): Promise<UserSession | null> {
    const result = await pool.query<UserSession>(
      `
      SELECT
        id,
        account_id,
        refresh_token,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM accounting.user_sessions
      WHERE refresh_token = $1
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
  static async updateLastUsed(sessionId: bigint): Promise<void> {
    await pool.query(
      `
      UPDATE accounting.user_sessions
      SET last_used_at = NOW()
      WHERE id = $1
      `,
      [sessionId]
    );
  }

  /**
   * Thu hồi một user session theo refresh token
   */
  static async revokeSessionByRefreshToken(
    refreshTokenHash: string
  ): Promise<void> {
    await pool.query(
      `
      UPDATE accounting.user_sessions
      SET revoked_at = NOW()
      WHERE refresh_token = $1
        AND revoked_at IS NULL
      `,
      [refreshTokenHash]
    );
  }

  /**
   * Thu hồi tất cả user session của một tài khoản
   */
  static async revokeAllSessions(accountId: string): Promise<void> {
    await pool.query(
      `
      UPDATE accounting.user_sessions
      SET revoked_at = NOW()
      WHERE account_id = $1
        AND revoked_at IS NULL
      `,
      [accountId]
    );
  }
}