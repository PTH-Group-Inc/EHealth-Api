import { Router } from 'express';
import { NotificationRoleConfigController } from '../controllers/notification-role-config.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';

const notificationRoleConfigRoutes = Router();

// Toàn bộ chức năng cài đặt này chỉ dành cho ADMIN/SYSTEM
notificationRoleConfigRoutes.use(verifyAccessToken, checkSessionStatus, authorizeRoles('ADMIN', 'SYSTEM'));

/**
 * @swagger
 * tags:
 *   name: 1.7.3 Cấu hình Thông báo theo Vai trò
 *   description: Thiết lập cấu trúc Role nào nhận thông báo qua kênh nào (Chỉ dành cho ADMIN/SYSTEM)
 */

/**
 * @swagger
 * /api/notifications/role-configs:
 *   get:
 *     summary: Xem khung ma trận Cấu hình
 *     description: Lấy danh sách toàn bộ các Role hiện hành kèm theo danh sách các nhóm thông báo tương ứng. Kết quả được Group by Role.
 *     tags: [1.7.3 Cấu hình Thông báo theo Vai trò]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về cục Matrix
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role_id:
 *                         type: string
 *                         example: ROL_123
 *                       role_code:
 *                         type: string
 *                         example: PATIENT
 *                       role_name:
 *                         type: string
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             config_id:
 *                               type: string
 *                             category_id:
 *                               type: string
 *                             category_code:
 *                               type: string
 *                               example: APPOINTMENT
 *                             allow_inapp:
 *                               type: boolean
 *                               example: true
 *                             allow_email:
 *                               type: boolean
 *                             allow_push:
 *                               type: boolean
 */
notificationRoleConfigRoutes.get('/', NotificationRoleConfigController.getConfigs);

/**
 * @swagger
 * /api/notifications/role-configs/{roleId}/{categoryId}:
 *   put:
 *     summary: Cầu hình chi tiết nhận gửi 1 category của 1 role
 *     tags: [1.7.3 Cấu hình Thông báo theo Vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allow_inapp:
 *                 type: boolean
 *                 example: true
 *               allow_email:
 *                 type: boolean
 *                 example: false
 *               allow_push:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tùy chỉnh OK
 */
notificationRoleConfigRoutes.put('/:roleId/:categoryId', NotificationRoleConfigController.updateConfig);

export default notificationRoleConfigRoutes;
