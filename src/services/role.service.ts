import { z } from "zod";
import { RoleRepository } from "../repository/role.repository";
import { HttpError } from "../utils/httpError";

const createRoleSchema = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateRoleSchema = z.object({
  code: z.string().min(2).max(64).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export class RoleService {
  constructor(private repo = new RoleRepository()) {}

  async list(q: any) {
    try {
      const includeDeleted = String(q.includeDeleted || "false") === "true";
      return await this.repo.list({ includeDeleted });
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async get(id: string, includeDeleted = false) {
    try {
      const role = await this.repo.findById(id, includeDeleted);
      if (!role) throw new HttpError(404, "Role not found");
      return role;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async create(body: any) {
    try {
      const dto = createRoleSchema.parse(body);
      return await this.repo.create(dto);
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async update(id: string, body: any) {
    try {
      const dto = updateRoleSchema.parse(body);
      const role = await this.repo.update(id, dto);
      if (!role) throw new HttpError(404, "Role not found or deleted");
      return role;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async softDelete(id: string, actorId?: string) {
    try {
      const role = await this.repo.softDelete(id, actorId);
      if (!role) throw new HttpError(404, "Role not found or already deleted");
      return role;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async restore(id: string) {
    try {
      const role = await this.repo.restore(id);
      if (!role) throw new HttpError(404, "Role not found or not deleted");
      return role;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async getPermissions(roleId: string) {
    try {
      await this.get(roleId, true);
      return await this.repo.getRolePermissions(roleId);
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async replacePermissions(roleId: string, permissionIds: string[]) {
    try {
      if (!Array.isArray(permissionIds))
        throw new HttpError(400, "permissionIds must be array");
      await this.get(roleId, false);
      await this.repo.replaceRolePermissions(roleId, permissionIds);
      return { ok: true };
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }
}
