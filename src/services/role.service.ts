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

  async listRoles(q: any) {
    try {
      const includeDeleted = String(q.includeDeleted || "false") === "true";
      return await this.repo.list({ includeDeleted });
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async getRoleById(id: string, includeDeleted = false) {
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

  async createRole(body: any) {
    try {
      const dto = createRoleSchema.parse(body);
      return await this.repo.create(dto);
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async updateRole(id: string, body: any) {
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

  async softDeleteRole(id: string, actorId?: string) {
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

  async restoreRole(id: string) {
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

  async getPermissionsForRole(roleId: string) {
    try {
      await this.getRoleById(roleId, true);
      return await this.repo.getRolePermissions(roleId);
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async replacePermissionsForRole(roleId: string, permissionIds: any) {
    try {
      const schema = z.array(z.string().uuid());
      const ids = schema.parse(permissionIds || []);

      // ensure unique ids
      if (new Set(ids).size !== ids.length)
        throw new HttpError(400, "permissionIds must not contain duplicates");

      await this.getRoleById(roleId, false);
      await this.repo.replaceRolePermissions(roleId, ids);
      return { ok: true };
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }
}
