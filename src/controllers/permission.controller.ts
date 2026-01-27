import { Request, Response } from "express";
import { PermissionService } from "../services/permission.service";

export class PermissionController {
  constructor(private service = new PermissionService()) {}

  list = async (req: Request, res: Response) => {
    res.json({ items: await this.service.list(req.query) });
  };

  get = async (req: Request, res: Response) => {
    const includeDeleted =
      String(req.query.includeDeleted || "false") === "true";
    res.json(await this.service.get(String(req.params.id), includeDeleted));
  };

  create = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.create(req.body));
  };

  update = async (req: Request, res: Response) => {
    res.json(await this.service.update(String(req.params.id), req.body));
  };

  softDelete = async (req: Request, res: Response) => {
    const actorId = req.header("x-user-id") || undefined;
    res.json(await this.service.softDelete(String(req.params.id), actorId));
  };

  restore = async (req: Request, res: Response) => {
    res.json(await this.service.restore(String(req.params.id)));
  };
}
