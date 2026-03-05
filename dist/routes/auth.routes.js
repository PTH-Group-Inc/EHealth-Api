"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const verifyAccessToken_middleware_1 = require("../middleware/verifyAccessToken.middleware");
const auth_session_controller_1 = require("../controllers/auth_session.controller");
const checkSessionStatus_middleware_1 = require("../middleware/checkSessionStatus.middleware");
const authRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /api/auth/login/email:
 *   post:
 *     summary: Đăng nhập bằng Email
 *     description: |
 *       Đăng nhập với email và mật khẩu.
 *
 *       **Lưu ý về Device Info:**
 *       - Nếu gửi `clientInfo.deviceId`: Hệ thống sẽ tìm session cũ của device.
 *         Nếu có thì reuse, không có thì tạo mới (cho phép login từ nhiều device)
 *       - Nếu **không gửi** `clientInfo`: Vẫn cho login bình thường, mỗi lần login tạo session mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             withDevice:
 *               summary: Gửi device info
 *               value:
 *                 email: 'user@example.com'
 *                 password: 'password123'
 *                 clientInfo:
 *                   deviceId: '550e8400-e29b-41d4-a716-446655440000'
 *                   deviceName: 'iPhone 13 Pro'
 *             withoutDevice:
 *               summary: Không gửi device info
 *               value:
 *                 email: 'user@example.com'
 *                 password: 'password123'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post("/login/email", auth_controller_1.AuthController.loginByEmail);
/**
 * @swagger
 * /api/auth/login/phone:
 *   post:
 *     summary: Đăng nhập bằng Số điện thoại
 *     description: |
 *       Đăng nhập với số điện thoại và mật khẩu.
 *
 *       **Lưu ý về Device Info:**
 *       - Nếu gửi `clientInfo.deviceId`: Hệ thống sẽ tìm session cũ của device.
 *         Nếu có thì reuse, không có thì tạo mới (cho phép login từ nhiều device)
 *       - Nếu **không gửi** `clientInfo`: Vẫn cho login bình thường, mỗi lần login tạo session mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['phone', 'password']
 *             properties:
 *               phone:
 *                 type: string
 *                 example: '0123456789'
 *               password:
 *                 type: string
 *                 example: 'password123'
 *               clientInfo:
 *                 type: object
 *                 description: 'Thông tin thiết bị - Tùy chọn'
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     description: 'ID thiết bị (UUID hoặc unique identifier)'
 *                     example: '550e8400-e29b-41d4-a716-446655440000'
 *                   deviceName:
 *                     type: string
 *                     description: 'Tên thiết bị'
 *                     example: 'Samsung Galaxy S21'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Số điện thoại hoặc mật khẩu không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post("/login/phone", auth_controller_1.AuthController.loginByPhone);
/**
 * @swagger
 * /api/auth/register/email:
 *   post:
 *     summary: Đăng ký tài khoản bằng Email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/register/email', auth_controller_1.AuthController.registerByEmail);
/**
 * @swagger
 * /api/auth/register/phone:
 *   post:
 *     summary: Đăng ký tài khoản bằng Số điện thoại
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['phone', 'password', 'name']
 *             properties:
 *               phone:
 *                 type: string
 *                 example: '0123456789'
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Số điện thoại đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/register/phone', auth_controller_1.AuthController.registerByPhone);
/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Xác thực tài khoản (Bằng mã OTP gửi qua Email)
 *     description: API này được gọi sau khi gọi đăng ký thành công. User sẽ nhập mã OTP gồm 6 số gửi vào email để kích hoạt.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['email', 'code']
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: Xác thực tài khoản thành công, tài khoản đã được Active
 *       400:
 *         description: Mã OTP không đúng hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/verify-email', auth_controller_1.AuthController.verifyEmail);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['email']
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email đặt lại mật khẩu đã được gửi
 *       404:
 *         description: Email không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/forgot-password', auth_controller_1.AuthController.forgotPassword);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['otp', 'newPassword']
 *             properties:
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Token không hợp lệ hoặc hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/reset-password', auth_controller_1.AuthController.resetPassword);
/**
 * @swagger
 * /api/auth/unlock-account:
 *   post:
 *     summary: Mở khóa tài khoản
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['accountId']
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: 'USR_2603_...'
 *     responses:
 *       200:
 *         description: Tài khoản đã được mở khóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Email không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/unlock-account', auth_controller_1.AuthController.unlockAccount);
/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới Access Token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['refreshToken']
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token mới đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *       401:
 *         description: Refresh token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/refresh-token', auth_controller_1.AuthController.refreshToken);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['refreshToken']
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token của user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/logout', auth_controller_1.AuthController.logout);
/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Lấy danh sách các phiên đăng nhập
 *     tags: [Authentication - Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phiên đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SessionInfo'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.get('/sessions', verifyAccessToken_middleware_1.verifyAccessToken, checkSessionStatus_middleware_1.checkSessionStatus, auth_session_controller_1.SessionController.getSessions);
/**
 * @swagger
 * /api/auth/sessions/logout-all:
 *   post:
 *     summary: Đăng xuất tất cả các phiên
 *     tags: [Authentication - Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã đăng xuất tất cả phiên
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.post('/sessions/logout-all', verifyAccessToken_middleware_1.verifyAccessToken, checkSessionStatus_middleware_1.checkSessionStatus, auth_session_controller_1.SessionController.logoutAll);
/**
 * @swagger
 * /api/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Đăng xuất một phiên cụ thể
 *     tags: [Authentication - Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phiên cần đăng xuất
 *     responses:
 *       200:
 *         description: Đã đăng xuất phiên
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Phiên không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRoutes.delete('/sessions/:sessionId', verifyAccessToken_middleware_1.verifyAccessToken, checkSessionStatus_middleware_1.checkSessionStatus, auth_session_controller_1.SessionController.logoutSession);
exports.default = authRoutes;
