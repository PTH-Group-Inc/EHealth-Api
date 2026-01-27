import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const c = new RoleController();

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.get("/:id", asyncHandler(c.get));
router.patch("/:id", asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.softDelete));
router.post("/:id/restore", asyncHandler(c.restore));

router.get("/:id/permissions", asyncHandler(c.getPermissions));
router.post("/:id/permissions", asyncHandler(c.replacePermissions)); // replace list

export default router;
