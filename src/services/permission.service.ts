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

  async listPermissions(q: any) {
    try {
      const includeDeleted = String(q.includeDeleted || "false") === "true";
      const module = q.module ? String(q.module) : undefined;
      return await this.repo.list({ includeDeleted, module });
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async getPermissionById(id: string, includeDeleted = false) {
    try {
      const p = await this.repo.findById(id, includeDeleted);
      if (!p) throw new HttpError(404, "Permission not found");
      return p;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async createPermission(body: any) {
    try {
      const dto = createPermissionSchema.parse(body);
      return await this.repo.create(dto);
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async updatePermission(id: string, body: any) {
    try {
      const dto = updatePermissionSchema.parse(body);
      const p = await this.repo.update(id, dto);
      if (!p) throw new HttpError(404, "Permission not found or deleted");
      return p;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async softDeletePermission(id: string, actorId?: string) {
    try {
      const p = await this.repo.softDelete(id, actorId);
      if (!p)
        throw new HttpError(404, "Permission not found or already deleted");
      return p;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async restorePermission(id: string) {
    try {
      const p = await this.repo.restore(id);
      if (!p) throw new HttpError(404, "Permission not found or not deleted");
      return p;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }
}
