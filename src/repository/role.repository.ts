import { pool } from "../config/postgresdb";
import { HttpError } from "../utils/httpError";

export class RoleRepository {
  async findById(id: string, includeDeleted = false) {
    const sql = includeDeleted
      ? `SELECT * FROM roles WHERE id=$1`
      : `SELECT * FROM roles WHERE id=$1 AND deleted_at IS NULL`;
    const { rows } = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  async list(params?: {
    search?: string;
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
  }) {
    const {
      search,
      page = 1,
      limit = 20,
      includeDeleted = false,
    } = params || {};
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (!includeDeleted) where.push(`deleted_at IS NULL`);
    if (search) {
      where.push(`(code ILIKE $${idx} OR name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
      SELECT * FROM roles
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    values.push(limit, offset);

    const countSql = `SELECT COUNT(*)::int AS total FROM roles ${whereSql};`;

    const [data, count] = await Promise.all([
      pool.query(sql, values),
      pool.query(countSql, values.slice(0, values.length - 2)),
    ]);

    return { items: data.rows, total: count.rows[0]?.total ?? 0, page, limit };
  }

  async create(input: { code: string; name: string; description?: string }) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO roles (code, name, description)
         VALUES ($1,$2,$3)
         RETURNING *;`,
        [input.code, input.name, input.description ?? null],
      );
      return rows[0];
    } catch (e: any) {
      if (String(e?.code) === "23505")
        throw new HttpError(409, "Role code already exists (active)");
      throw e;
    }
  }

  async update(
    id: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
    },
  ) {
    try {
      const { rows } = await pool.query(
        `UPDATE roles
           SET code = COALESCE($2, code),
               name = COALESCE($3, name),
               description = COALESCE($4, description)
         WHERE id=$1 AND deleted_at IS NULL
         RETURNING *;`,
        [id, input.code ?? null, input.name ?? null, input.description ?? null],
      );
      return rows[0] || null;
    } catch (e: any) {
      if (String(e?.code) === "23505")
        throw new HttpError(409, "Role code already exists (active)");
      throw e;
    }
  }

  async softDelete(id: string, actorId?: string) {
    const { rows } = await pool.query(
      `UPDATE roles
         SET deleted_at = now(),
             deleted_by_user_id = $2
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING *;`,
      [id, actorId ?? null],
    );
    return rows[0] || null;
  }

  async restore(id: string) {
    const { rows } = await pool.query(
      `UPDATE roles
         SET deleted_at = NULL,
             deleted_by_user_id = NULL
       WHERE id=$1 AND deleted_at IS NOT NULL
       RETURNING *;`,
      [id],
    );
    return rows[0] || null;
  }

  async getRolePermissions(roleId: string) {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT p.*
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
      WHERE rp.role_id = $1
      ORDER BY p.code ASC;
      `,
      [roleId],
    );
    return rows;
  }

  async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    await pool.query("BEGIN");
    try {
      await pool.query(`DELETE FROM role_permissions WHERE role_id=$1`, [
        roleId,
      ]);
      for (const permissionId of permissionIds) {
        await pool.query(
          `INSERT INTO role_permissions(role_id, permission_id) VALUES ($1,$2)`,
          [roleId, permissionId],
        );
      }
      await pool.query("COMMIT");
      return true;
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  }
}
