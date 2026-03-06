import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';

const permissionRoutes = Router();

permissionRoutes.use(verifyAccessToken);
const requireAdmin = authorizeRoles('ADMIN', 'SYSTEM');

/**
 * @swagger
 * tags:
 *   name: Role & Permission Management
 *   description: API Quản lý vai trò & phân quyền
 */

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: Lấy danh sách Quyền (Permissions)
 *     description: API trả về danh sách các quyền hạn trong hệ thống để gán cho Role.
 *     tags: [1.3 Quản lý vai trò & phân quyền (Role & Permission Management)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã (code) hoặc mô tả
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Lọc theo tên phân hệ (VD PATIENT_MANAGEMENT)
 *     responses:
 *       200:
 *         description: Thành công
 */
permissionRoutes.get('/', requireAdmin, PermissionController.getPermissions);

/**
 * @swagger
 * /api/permissions/{permissionId}:
 *   get:
 *     summary: Lấy chi tiết Quyền theo ID
 *     tags: [1.3 Quản lý vai trò & phân quyền (Role & Permission Management)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy quyền
 */
permissionRoutes.get('/:permissionId', requireAdmin, PermissionController.getPermissionById);

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     summary: Tạo quyền hạn mới
 *     tags: [1.3 Quản lý vai trò & phân quyền (Role & Permission Management)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, module]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "INVOICE_CREATE"
 *               module:
 *                 type: string
 *                 example: "BILLING"
 *               description:
 *                 type: string
 *                 example: "Quyền tạo hóa đơn thanh toán"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc trùng mã Code
 */
permissionRoutes.post('/', requireAdmin, PermissionController.createPermission);

/**
 * @swagger
 * /api/permissions/{permissionId}:
 *   patch:
 *     summary: Cập nhật quyền (Module, Mô tả)
 *     tags: [1.3 Quản lý vai trò & phân quyền (Role & Permission Management)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
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
 *               module:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
permissionRoutes.patch('/:permissionId', requireAdmin, PermissionController.updatePermission);

/**
 * @swagger
 * /api/permissions/{permissionId}:
 *   delete:
 *     summary: Xóa quyền
 *     tags: [1.3 Quản lý vai trò & phân quyền (Role & Permission Management)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Đang có Role sử dụng quyền này, không thể xóa
 */
permissionRoutes.delete('/:permissionId', requireAdmin, PermissionController.deletePermission);

export default permissionRoutes;
