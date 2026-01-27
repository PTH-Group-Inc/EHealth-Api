import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  constructor(private service = new UserService()) {}

  list = async (req: Request, res: Response) => {
    const data = await this.service.list(req.query);
    res.json(data);
  };

  get = async (req: Request, res: Response) => {
    const includeDeleted =
      String(req.query.includeDeleted || "false") === "true";
    const data = await this.service.get(String(req.params.id), includeDeleted);
    res.json(data);
  };

  create = async (req: Request, res: Response) => {
    const data = await this.service.create(req.body);
    res.status(201).json(data);
  };

  update = async (req: Request, res: Response) => {
    const data = await this.service.update(String(req.params.id), req.body);
    res.json(data);
  };

  softDelete = async (req: Request, res: Response) => {
    const actorId = req.header("x-user-id") || undefined; // tạm dùng header, sau này thay bằng auth middleware
    const data = await this.service.softDelete(String(req.params.id), actorId);
    res.json(data);
  };

  restore = async (req: Request, res: Response) => {
    const data = await this.service.restore(String(req.params.id));
    res.json(data);
  };

  replaceRoles = async (req: Request, res: Response) => {
    const { roleIds } = req.body;
    const data = await this.service.replaceRoles(
      String(req.params.id),
      roleIds,
    );
    res.json(data);
  };

  effectivePermissions = async (req: Request, res: Response) => {
    const data = await this.service.effectivePermissions(String(req.params.id));
    res.json({ items: data });
  };
}
