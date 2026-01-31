import { pool } from "../config/postgresdb";
import { HttpError } from "../utils/httpError";

export class UserRepository {
  async findById(id: string, includeDeleted = false) {
    const sql = includeDeleted
      ? `SELECT * FROM app_users WHERE id=$1`
      : `SELECT * FROM app_users WHERE id=$1 AND deleted_at IS NULL`;
    const { rows } = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  async list(params: {
    search?: string;
    page: number;
    limit: number;
    includeDeleted?: boolean;
  }) {
    const { search, page, limit, includeDeleted } = params;
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (!includeDeleted) where.push(`deleted_at IS NULL`);
    if (search) {
      where.push(
        `(email ILIKE $${idx} OR phone ILIKE $${idx} OR full_name ILIKE $${idx})`,
      );
      values.push(`%${search}%`);
      idx++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
      SELECT * FROM app_users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    values.push(limit, offset);

    const countSql = `SELECT COUNT(*)::int AS total FROM app_users ${whereSql};`;

    const [data, count] = await Promise.all([
      pool.query(sql, values),
      pool.query(countSql, values.slice(0, values.length - 2)),
    ]);

    return { items: data.rows, total: count.rows[0]?.total ?? 0, page, limit };
  }

  async create(input: {
    email?: string;
    phone?: string;
    passwordHash: string;
    fullName?: string;
    status?: string;
  }) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO app_users (email, phone, password_hash, full_name, status)
         VALUES ($1,$2,$3,$4, COALESCE($5,'ACTIVE'))
         RETURNING *;`,
        [
          input.email ?? null,
          input.phone ?? null,
          input.passwordHash,
          input.fullName ?? null,
          input.status ?? "ACTIVE",
        ],
      );
      return rows[0];
    } catch (e: any) {
      // partial unique index can throw duplicate
      if (String(e?.code) === "23505")
        throw new HttpError(409, "Email/Phone already exists (active)");
      throw e;
    }
  }

  async update(
    id: string,
    input: {
      email?: string;
      phone?: string;
      fullName?: string;
      status?: string;
    },
  ) {
    try {
      const { rows } = await pool.query(
        `UPDATE app_users
           SET email = COALESCE($2, email),
               phone = COALESCE($3, phone),
               full_name = COALESCE($4, full_name),
               status = COALESCE($5, status)
         WHERE id=$1 AND deleted_at IS NULL
         RETURNING *;`,
        [
          id,
          input.email ?? null,
          input.phone ?? null,
          input.fullName ?? null,
          input.status ?? null,
        ],
      );
      return rows[0] || null;
    } catch (e: any) {
      if (String(e?.code) === "23505")
        throw new HttpError(409, "Email/Phone already exists (active)");
      throw e;
    }
  }

  async softDelete(id: string, actorId?: string) {
    const { rows } = await pool.query(
      `UPDATE app_users
         SET deleted_at = now(),
             deleted_by_user_id = $2,
             status = 'DELETED'
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING *;`,
      [id, actorId ?? null],
    );
    return rows[0] || null;
  }

  async restore(id: string) {
    const { rows } = await pool.query(
      `UPDATE app_users
         SET deleted_at = NULL,
             deleted_by_user_id = NULL,
             status = 'ACTIVE'
       WHERE id=$1 AND deleted_at IS NOT NULL
       RETURNING *;`,
      [id],
    );
    return rows[0] || null;
  }

  async replaceUserRoles(userId: string, roleIds: string[]) {
    await pool.query("BEGIN");
    try {
      await pool.query(`DELETE FROM app_user_roles WHERE user_id=$1`, [userId]);
      for (const roleId of roleIds) {
        await pool.query(
          `INSERT INTO app_user_roles(user_id, role_id) VALUES ($1,$2)`,
          [userId, roleId],
        );
      }
      await pool.query("COMMIT");
      return true;
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  }

  async getEffectivePermissions(userId: string) {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT p.*
      FROM app_user_roles ur
      JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
      JOIN app_role_permissions rp ON rp.role_id = r.id
      JOIN app_permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
      WHERE ur.user_id = $1
      ORDER BY p.code ASC;
      `,
      [userId],
    );
    return rows;
  }
}
