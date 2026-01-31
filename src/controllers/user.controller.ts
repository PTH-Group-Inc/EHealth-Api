import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  constructor(private service = new UserService()) {}

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.listUsers(req.query);
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeDeleted =
        String(req.query.includeDeleted || "false") === "true";
      const data = await this.service.getUserById(
        String(req.params.id),
        includeDeleted,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createUser(req.body);
      res.status(201).json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateUser(
        String(req.params.id),
        req.body,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  softDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.header("x-user-id") || undefined; // tạm dùng header, sau này thay bằng auth middleware
      const data = await this.service.softDeleteUser(
        String(req.params.id),
        actorId,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  restoreUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.restoreUser(String(req.params.id));
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  replaceRolesForUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { roleIds } = req.body;
      const data = await this.service.replaceRolesForUser(
        String(req.params.id),
        roleIds,
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  getEffectivePermissionsForUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.getEffectivePermissionsForUser(
        String(req.params.id),
      );
      res.json({ items: data });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
}
