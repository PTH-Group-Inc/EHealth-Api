import { Router } from "express";
import { PermissionController } from "../controllers/permission.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const c = new PermissionController();

router.get("/", asyncHandler(c.listPermissions));
router.post("/", asyncHandler(c.createPermission));
router.get("/:id", asyncHandler(c.getPermissionById));
router.patch("/:id", asyncHandler(c.updatePermission));
router.delete("/:id", asyncHandler(c.softDeletePermission));
router.post("/:id/restore", asyncHandler(c.restorePermission));

export default router;
