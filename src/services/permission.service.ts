import { z } from "zod";
import { PermissionRepository } from "../repository/permission.repository";
import { HttpError } from "../utils/httpError";

const createPermissionSchema = z.object({
  code: z.string().min(2).max(128),
  name: z.string().min(1).max(255),
  module: z.string().max(64).optional(),
  description: z.string().optional(),
});

const updatePermissionSchema = z.object({
  code: z.string().min(2).max(128).optional(),
  name: z.string().min(1).max(255).optional(),
  module: z.string().max(64).optional(),
  description: z.string().optional(),
});

export class PermissionService {
  constructor(private repo = new PermissionRepository()) {}

  async list(q: any) {
    const includeDeleted = String(q.includeDeleted || "false") === "true";
    const module = q.module ? String(q.module) : undefined;
    return this.repo.list({ includeDeleted, module });
  }

  async get(id: string, includeDeleted = false) {
    const p = await this.repo.findById(id, includeDeleted);
    if (!p) throw new HttpError(404, "Permission not found");
    return p;
  }

  async create(body: any) {
    const dto = createPermissionSchema.parse(body);
    return this.repo.create(dto);
  }

  async update(id: string, body: any) {
    const dto = updatePermissionSchema.parse(body);
    const p = await this.repo.update(id, dto);
    if (!p) throw new HttpError(404, "Permission not found or deleted");
    return p;
  }

  async softDelete(id: string, actorId?: string) {
    const p = await this.repo.softDelete(id, actorId);
    if (!p) throw new HttpError(404, "Permission not found or already deleted");
    return p;
  }

  async restore(id: string) {
    const p = await this.repo.restore(id);
    if (!p) throw new HttpError(404, "Permission not found or not deleted");
    return p;
  }
}
