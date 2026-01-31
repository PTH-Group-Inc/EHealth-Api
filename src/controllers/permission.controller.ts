import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/permission.service";

export class PermissionController {
  constructor(private service = new PermissionService()) {}

  listPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ items: await this.service.listPermissions(req.query) });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  getPermissionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const includeDeleted =
        String(req.query.includeDeleted || "false") === "true";
      res.json(
        await this.service.getPermissionById(
          String(req.params.id),
          includeDeleted,
        ),
      );
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  createPermission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      res.status(201).json(await this.service.createPermission(req.body));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  updatePermission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      res.json(
        await this.service.updatePermission(String(req.params.id), req.body),
      );
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  softDeletePermission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const actorId = req.header("x-user-id") || undefined;
      res.json(
        await this.service.softDeletePermission(String(req.params.id), actorId),
      );
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  restorePermission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      res.json(await this.service.restorePermission(String(req.params.id)));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
}
