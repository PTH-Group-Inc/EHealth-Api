import { Router } from "express";
import { PermissionController } from "../controllers/permission.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const c = new PermissionController();

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.get("/:id", asyncHandler(c.get));
router.patch("/:id", asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.softDelete));
router.post("/:id/restore", asyncHandler(c.restore));

export default router;
