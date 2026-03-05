"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionRepository = void 0;
const postgresdb_1 = require("../config/postgresdb");
const auth_session_util_1 = require("../utils/auth-session.util");
class UserSessionRepository {
    /**
     * Tạo mới một user session
     */
    static async createSession(input) {
        const { user_sessions_id = auth_session_util_1.AuthSessionUtil.generate(input.userId), userId, refreshTokenHash, deviceId, deviceName, ipAddress, userAgent, expiredAt, } = input;
        await postgresdb_1.pool.query(`
      INSERT INTO user_sessions (
        user_sessions_id,
        user_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        expired_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      `, [
            user_sessions_id,
            userId,
            refreshTokenHash,
            deviceId ?? null,
            deviceName ?? null,
            ipAddress ?? null,
            userAgent ?? null,
            expiredAt,
        ]);
    }
    // Tìm user session theo userId và deviceId
    static async findByAccountAndDevice(userId, deviceId) {
        const result = await postgresdb_1.pool.query(`
      SELECT
        user_sessions_id,
        user_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM user_sessions
      WHERE user_id = $1
        AND (device_id = $2 OR (device_id IS NULL AND $2 IS NULL))
        AND revoked_at IS NULL
        AND expired_at > NOW()
      LIMIT 1
      `, [userId, deviceId]);
        if (result.rowCount === 0)
            return null;
        return result.rows[0];
    }
    // Cập nhật user session theo ID
    static async updateSessionBySessionId(sessionId, input) {
        await postgresdb_1.pool.query(`
      UPDATE user_sessions
      SET
        refresh_token_hash = $1,
        ip_address = $2,
        user_agent = $3,
        expired_at = $4,
        last_used_at = NOW(),
        revoked_at = NULL
      WHERE user_sessions_id = $5
      `, [
            input.refreshTokenHash,
            input.ipAddress ?? null,
            input.userAgent ?? null,
            input.expiredAt,
            sessionId,
        ]);
    }
    /**
     * Đăng xuất session hiện tại
     */
    static async logoutCurrentSession(userId, refreshTokenHash) {
        const result = await postgresdb_1.pool.query(`
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND refresh_token_hash = $2
        AND revoked_at IS NULL
        AND expired_at > NOW()
      `, [userId, refreshTokenHash]);
        return (result.rowCount ?? 0) > 0;
    }
    /**
     * Đăng xuất toàn bộ session của một tài khoản
     */
    static async revokeAllByAccount(userId) {
        const result = await postgresdb_1.pool.query(`
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
      `, [userId]);
        return result.rowCount ?? 0;
    }
    /**
     * Tìm session còn hiệu lực theo refresh token
     */
    static async findActiveSessionByRefreshToken(refreshTokenHash) {
        const result = await postgresdb_1.pool.query(`
      SELECT
        user_sessions_id,
        user_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM user_sessions
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
        AND expired_at > NOW()
      LIMIT 1
      `, [refreshTokenHash]);
        if (result.rowCount === 0)
            return null;
        return result.rows[0];
    }
    /**
    * Cập nhật thời gian sử dụng cuối cùng của session
    */
    static async updateLastUsed(sessionId) {
        await postgresdb_1.pool.query(`
      UPDATE user_sessions
      SET last_used_at = NOW()
      WHERE user_sessions_id = $1
      `, [sessionId]);
    }
    /*
     * Lấy danh sách session còn hiệu lực của một tài khoản
     */
    static async findActiveByAccount(userId) {
        const result = await postgresdb_1.pool.query(`SELECT user_sessions_id, device_name, ip_address, last_used_at, created_at, expired_at
         FROM user_sessions
         WHERE user_id = $1 AND revoked_at IS NULL AND expired_at > NOW()
         ORDER BY last_used_at DESC`, [userId]);
        return result.rows;
    }
    /*
     * Thu hồi (revoke) một session theo sessionId
     */
    static async revokeBySessionId(sessionId, userId) {
        const result = await postgresdb_1.pool.query(`UPDATE user_sessions
         SET revoked_at = NOW()
         WHERE user_sessions_id = $1 AND user_id = $2 AND revoked_at IS NULL`, [sessionId, userId]);
        return (result.rowCount ?? 0) > 0;
    }
    /*
     * Thu hồi (revoke) một session theo sessionId
     */
    static async findActiveBySessionId(sessionId) {
        const result = await postgresdb_1.pool.query(`SELECT user_sessions_id, user_id, refresh_token_hash, device_id, device_name, ip_address, user_agent, last_used_at, expired_at, revoked_at, created_at 
         FROM user_sessions 
         WHERE user_sessions_id = $1 AND revoked_at IS NULL AND expired_at > NOW() 
         LIMIT 1`, [sessionId]);
        if (result.rowCount === 0)
            return null;
        return result.rows[0];
    }
    /**
     * Dọn dẹp các session hết hạn
     */
    static async revokeExpiredSessions(idleTimeoutDays) {
        const result = await postgresdb_1.pool.query(`
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE revoked_at IS NULL
        AND (
            expired_at < NOW() 
            OR 
            last_used_at < (NOW() - make_interval(days => $1))
        )
      `, [idleTimeoutDays]);
        return result.rowCount ?? 0;
    }
}
exports.UserSessionRepository = UserSessionRepository;
