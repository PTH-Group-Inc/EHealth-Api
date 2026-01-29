import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRepository } from "../repository/user.repository";
import { HttpError } from "../utils/httpError";

const createUserSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(8).max(32).optional(),
    password: z.string().min(6),
    fullName: z.string().min(1).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "DELETED"]).optional(),
  })
  .refine((v: any) => v.email || v.phone, {
    message: "Require email or phone",
  });

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(32).optional(),
  fullName: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "DELETED"]).optional(),
});

export class UserService {
  constructor(private repo = new UserRepository()) {}

  async list(q: any) {
    try {
      const page = Math.max(1, Number(q.page || 1));
      const limit = Math.min(100, Math.max(1, Number(q.limit || 20)));
      const includeDeleted = String(q.includeDeleted || "false") === "true";
      const search = q.search ? String(q.search) : undefined;
      return await this.repo.list({ page, limit, includeDeleted, search });
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async get(id: string, includeDeleted = false) {
    try {
      const user = await this.repo.findById(id, includeDeleted);
      if (!user) throw new HttpError(404, "User not found");
      return user;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async create(body: any) {
    try {
      const dto = createUserSchema.parse(body);
      const passwordHash = await bcrypt.hash(dto.password, 10);
      return await this.repo.create({
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        status: dto.status,
      });
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async update(id: string, body: any) {
    try {
      const dto = updateUserSchema.parse(body);
      const updated = await this.repo.update(id, dto);
      if (!updated) throw new HttpError(404, "User not found or deleted");
      return updated;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async softDelete(id: string, actorId?: string) {
    try {
      const deleted = await this.repo.softDelete(id, actorId);
      if (!deleted)
        throw new HttpError(404, "User not found or already deleted");
      return deleted;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async restore(id: string) {
    try {
      const restored = await this.repo.restore(id);
      if (!restored) throw new HttpError(404, "User not found or not deleted");
      return restored;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async replaceRoles(userId: string, roleIds: string[]) {
    try {
      if (!Array.isArray(roleIds))
        throw new HttpError(400, "roleIds must be array");
      await this.repo.replaceUserRoles(userId, roleIds);
      return { ok: true };
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }

  async effectivePermissions(userId: string) {
    try {
      return await this.repo.getEffectivePermissions(userId);
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof z.ZodError) throw new HttpError(400, err.message);
      throw new HttpError(500, String(err?.message || err));
    }
  }
}
