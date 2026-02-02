import { Router } from 'express'
import { AuthController} from '../controllers/auth.controller'
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware'

const authRoutes = Router()

// Đăng nhập bằng Email + mật khẩu
authRoutes.post("/login/email", AuthController.loginByEmail);
authRoutes.post("/login/phone", AuthController.loginByPhone);

// Đăng xuất
authRoutes.post("/logout", verifyAccessToken, AuthController.logout);

// Quên mật khẩu & Đặt lại mật khẩu
authRoutes.post('/forgot-password', AuthController.forgotPassword);
authRoutes.post('/reset-password', AuthController.resetPassword);

// Đăng ký tài khoản
authRoutes.post('/register/email', AuthController.registerByEmail);
authRoutes.post('/register/phone', AuthController.registerByPhone);

// Xác thực Email
authRoutes.get('/verify-email', AuthController.verifyEmail);

export default authRoutes;