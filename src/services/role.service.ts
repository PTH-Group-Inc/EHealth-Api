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
    const includeDeleted = String(q.includeDeleted || "false") === "true";
    return this.repo.list({ includeDeleted });
  }

  async get(id: string, includeDeleted = false) {
    const role = await this.repo.findById(id, includeDeleted);
    if (!role) throw new HttpError(404, "Role not found");
    return role;
  }

  async create(body: any) {
    const dto = createRoleSchema.parse(body);
    return this.repo.create(dto);
  }

  async update(id: string, body: any) {
    const dto = updateRoleSchema.parse(body);
    const role = await this.repo.update(id, dto);
    if (!role) throw new HttpError(404, "Role not found or deleted");
    return role;
  }

  async softDelete(id: string, actorId?: string) {
    const role = await this.repo.softDelete(id, actorId);
    if (!role) throw new HttpError(404, "Role not found or already deleted");
    return role;
  }

  async restore(id: string) {
    const role = await this.repo.restore(id);
    if (!role) throw new HttpError(404, "Role not found or not deleted");
    return role;
  }

  async getPermissions(roleId: string) {
    await this.get(roleId, true);
    return this.repo.getRolePermissions(roleId);
  }

  async replacePermissions(roleId: string, permissionIds: string[]) {
    if (!Array.isArray(permissionIds))
      throw new HttpError(400, "permissionIds must be array");
    await this.get(roleId, false);
    await this.repo.replaceRolePermissions(roleId, permissionIds);
    return { ok: true };
  }
}
