import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const c = new RoleController();

router.get("/", asyncHandler(c.listRoles));
router.post("/", asyncHandler(c.createRole));
router.get("/:id", asyncHandler(c.getRoleById));
router.patch("/:id", asyncHandler(c.updateRole));
router.delete("/:id", asyncHandler(c.softDeleteRole));
router.post("/:id/restore", asyncHandler(c.restoreRole));

router.get("/:id/permissions", asyncHandler(c.getPermissionsForRole));
router.post("/:id/permissions", asyncHandler(c.replacePermissionsForRole)); // replace list

export default router;
