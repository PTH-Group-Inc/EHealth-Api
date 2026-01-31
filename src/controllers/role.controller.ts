import { Request, Response, NextFunction } from "express";
import { RoleService } from "../services/role.service";

export class RoleController {
  constructor(private service = new RoleService()) {}

  listRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.listRoles(req.query));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  getRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeDeleted =
        String(req.query.includeDeleted || "false") === "true";
      res.json(
        await this.service.getRoleById(String(req.params.id), includeDeleted),
      );
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.createRole(req.body));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.updateRole(String(req.params.id), req.body));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  softDeleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.header("x-user-id") || undefined;
      res.json(
        await this.service.softDeleteRole(String(req.params.id), actorId),
      );
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  restoreRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.restoreRole(String(req.params.id)));
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  getPermissionsForRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      res.json({
        items: await this.service.getPermissionsForRole(String(req.params.id)),
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  replacePermissionsForRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { permissionIds } = req.body;
      res.json(
        await this.service.replacePermissionsForRole(
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
