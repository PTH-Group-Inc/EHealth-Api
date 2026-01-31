import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'

const authRoutes = Router()

authRoutes.post("/login/email", AuthController.loginByEmail);
authRoutes.post("/login/phone", AuthController.loginByPhone);

export default authRoutes;