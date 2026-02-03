import { Router } from 'express'
import { AuthController} from '../controllers/auth.controller'
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware'
import { SessionController } from '../controllers/auth_session.controller';
import { checkSessionStatus } from '../middleware/checkSessionStatus.middleware';

const authRoutes = Router()

// Đăng nhập bằng Email + mật khẩu
authRoutes.post("/login/email", AuthController.loginByEmail);
authRoutes.post("/login/phone", AuthController.loginByPhone);

// Mở khóa tài khoản
authRoutes.post('/unlock-account', AuthController.unlockAccount);

// Làm mới token
authRoutes.post('/refresh-token', AuthController.refreshToken);

// Đăng xuất
authRoutes.post('/logout', AuthController.logout);

// Quên mật khẩu & Đặt lại mật khẩu
authRoutes.post('/forgot-password', AuthController.forgotPassword);
authRoutes.post('/reset-password', AuthController.resetPassword);

// Đăng ký tài khoản
authRoutes.post('/register/email', AuthController.registerByEmail);
authRoutes.post('/register/phone', AuthController.registerByPhone);

// Xác thực Email
authRoutes.post('/verify-email', AuthController.verifyEmail);

// Quản lý session
authRoutes.use('/sessions', verifyAccessToken, checkSessionStatus);
authRoutes.get('/sessions', SessionController.getSessions);
authRoutes.post('/sessions/logout-all', SessionController.logoutAll);
authRoutes.delete('/sessions/:sessionId', SessionController.logoutSession);




export default authRoutes;