import { pool } from "../config/postgresdb";
import { HttpError } from "../utils/httpError";

export class PermissionRepository {
  async list(params?: { module?: string; includeDeleted?: boolean }) {
    const includeDeleted = params?.includeDeleted ?? false;
    const values: any[] = [];
    const where: string[] = [];

    if (!includeDeleted) where.push("deleted_at IS NULL");
    if (params?.module) {
      values.push(params.module);
      where.push(`module = $${values.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT * FROM permissions ${whereSql} ORDER BY code ASC;`,
      values,
    );
    return rows;
  }

  async findById(id: string, includeDeleted = false) {
    const sql = includeDeleted
      ? `SELECT * FROM permissions WHERE id=$1`
      : `SELECT * FROM permissions WHERE id=$1 AND deleted_at IS NULL`;
    const { rows } = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  async create(input: {
    code: string;
    name: string;
    module?: string;
    description?: string;
  }) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO permissions(code, name, module, description) VALUES ($1,$2,$3,$4) RETURNING *;`,
        [
          input.code,
          input.name,
          input.module ?? null,
          input.description ?? null,
        ],
      );
      return rows[0];
    } catch (e: any) {
      if (String(e?.code) === "23505")
        throw new HttpError(409, "Permission code already exists (active)");
      throw e;
    }
  }

  async update(
    id: string,
    input: {
      code?: string;
      name?: string;
      module?: string;
      description?: string;
    },
  ) {
    try {
      const { rows } = await pool.query(
        `UPDATE permissions
           SET code = COALESCE($2, code),
               name = COALESCE($3, name),
               module = COALESCE($4, module),
               description = COALESCE($5, description)
         WHERE id=$1 AND deleted_at IS NULL
         RETURNING *;`,
        [
          id,
          input.code ?? null,
          input.name ?? null,
          input.module ?? null,
          input.description ?? null,
        ],
      );
      return rows[0] || null;
    } catch (e: any) {
      if (String(e?.code) === "23505")
        throw new HttpError(409, "Permission code already exists (active)");
      throw e;
    }
  }

  async softDelete(id: string, actorId?: string) {
    const { rows } = await pool.query(
      `UPDATE permissions
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
      `UPDATE permissions
         SET deleted_at = NULL,
             deleted_by_user_id = NULL
       WHERE id=$1 AND deleted_at IS NOT NULL
       RETURNING *;`,
      [id],
    );
    return rows[0] || null;
  }
}
