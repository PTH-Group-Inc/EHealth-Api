import { Router } from "express";
import userRoute from "./user.route";
import roleRoute from "./role.route";
import permissionRoute from "./permission.route";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/users", userRoute);
router.use("/roles", roleRoute);
router.use("/permissions", permissionRoute);

export default router;
