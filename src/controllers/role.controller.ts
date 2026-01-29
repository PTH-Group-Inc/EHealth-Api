import { Request, Response, NextFunction } from "express";
import { RoleService } from "../services/role.service";

export class RoleController {
  constructor(private service = new RoleService()) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.list(req.query));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeDeleted =
        String(req.query.includeDeleted || "false") === "true";
      res.json(await this.service.get(String(req.params.id), includeDeleted));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.create(req.body));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.update(String(req.params.id), req.body));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.header("x-user-id") || undefined;
      res.json(await this.service.softDelete(String(req.params.id), actorId));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.restore(String(req.params.id)));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  getPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        items: await this.service.getPermissions(String(req.params.id)),
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  replacePermissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { permissionIds } = req.body;
      res.json(
        await this.service.replacePermissions(
          String(req.params.id),
          permissionIds,
        ),
      );
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
}
