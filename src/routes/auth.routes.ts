import { Router } from 'express'
import { AuthController} from '../controllers/auth.controller'
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware'

const authRoutes = Router()

// Đăng nhập bằng Email + mật khẩu
authRoutes.post("/login/email", AuthController.loginByEmail);
authRoutes.post("/login/phone", AuthController.loginByPhone);

// Đăng xuất
authRoutes.post("/logout", verifyAccessToken, AuthController.logout);

export default authRoutes;