import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const c = new UserController();

router.get("/", asyncHandler(c.listUsers));
router.post("/", asyncHandler(c.createUser));
router.get("/:id", asyncHandler(c.getUserById));
router.patch("/:id", asyncHandler(c.updateUser));
router.delete("/:id", asyncHandler(c.softDeleteUser));
router.post("/:id/restore", asyncHandler(c.restoreUser));

router.post("/:id/roles", asyncHandler(c.replaceRolesForUser));
router.get("/:id/permissions", asyncHandler(c.getEffectivePermissionsForUser));

export default router;
