import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const c = new UserController();

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.get("/:id", asyncHandler(c.get));
router.patch("/:id", asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.softDelete));
router.post("/:id/restore", asyncHandler(c.restore));

router.post("/:id/roles", asyncHandler(c.replaceRoles));
router.get("/:id/permissions", asyncHandler(c.effectivePermissions));

export default router;
