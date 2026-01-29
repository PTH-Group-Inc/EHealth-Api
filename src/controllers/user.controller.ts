import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  constructor(private service = new UserService()) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.list(req.query);
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeDeleted =
        String(req.query.includeDeleted || "false") === "true";
      const data = await this.service.get(
        String(req.params.id),
        includeDeleted,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(String(req.params.id), req.body);
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.header("x-user-id") || undefined; // tạm dùng header, sau này thay bằng auth middleware
      const data = await this.service.softDelete(
        String(req.params.id),
        actorId,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.restore(String(req.params.id));
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  replaceRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleIds } = req.body;
      const data = await this.service.replaceRoles(
        String(req.params.id),
        roleIds,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  effectivePermissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.effectivePermissions(
        String(req.params.id),
      );
      res.json({ items: data });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
}
