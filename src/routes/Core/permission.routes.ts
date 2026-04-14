import { Router } from 'express';
import { PermissionController } from '../../controllers/Core/permission.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';

const permissionRoutes = Router();

permissionRoutes.use(verifyAccessToken);

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: Lấy danh sách Quyền (Permissions)
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       API trả về danh sách các quyền hạn trong hệ thống để gán cho Role.
 *     tags: [1.3.2 Quản lý danh sách quyền]
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
 *         description: Lấy danh sách quyền thành công
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
 *                       permissions_id:
 *                         type: string
 *                         example: "PERM_001"
 *                       code:
 *                         type: string
 *                         example: "INVOICE_CREATE"
 *                       module:
 *                         type: string
 *                         example: "BILLING"
 *                       description:
 *                         type: string
 *                         example: "Quyền tạo hóa đơn thanh toán"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
permissionRoutes.get('/', PermissionController.getPermissions);

/**
 * @swagger
 * /api/permissions/{permissionId}:
 *   get:
 *     summary: Lấy chi tiết Quyền theo ID
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.2 Quản lý danh sách quyền]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của quyền cần lấy
 *         example: "PERM_001"
 *     responses:
 *       200:
 *         description: Lấy chi tiết quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     permissions_id:
 *                       type: string
 *                       example: "PERM_001"
 *                     code:
 *                       type: string
 *                       example: "INVOICE_CREATE"
 *                     module:
 *                       type: string
 *                       example: "BILLING"
 *                     description:
 *                       type: string
 *                       example: "Quyền tạo hóa đơn thanh toán"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy quyền
 *       500:
 *         description: Lỗi máy chủ
 */
permissionRoutes.get('/:permissionId', PermissionController.getPermissionById);

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     summary: Tạo quyền hạn mới
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Tạo một quyền mới trong hệ thống. Mã Code phải là duy nhất (unique).
 *     tags: [1.3.2 Quản lý danh sách quyền]
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
 *                 description: Mã quyền (duy nhất, không dấu, in hoa)
 *                 example: "INVOICE_CREATE"
 *               module:
 *                 type: string
 *                 description: Tên phân hệ/module quản lý (ví dụ BILLING, PATIENT_MANAGEMENT)
 *                 example: "BILLING"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Mô tả chi tiết về quyền
 *                 example: "Quyền tạo hóa đơn thanh toán"
 *           example:
 *             code: "INVOICE_CREATE"
 *             module: "BILLING"
 *             description: "Quyền tạo hóa đơn thanh toán"
 *     responses:
 *       201:
 *         description: Tạo quyền mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tạo quyền thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     permissions_id:
 *                       type: string
 *                       example: "PERM_NEW_001"
 *                     code:
 *                       type: string
 *                       example: "INVOICE_CREATE"
 *                     module:
 *                       type: string
 *                       example: "BILLING"
 *                     description:
 *                       type: string
 *                       example: "Quyền tạo hóa đơn thanh toán"
 *       400:
 *         description: |
 *           - `MISSING_REQUIRED_FIELDS`: Thiếu code hoặc module
 *           - `DUPLICATE_CODE`: Mã Code đã tồn tại
 *           - `INVALID_CODE`: Mã Code không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
permissionRoutes.post('/', PermissionController.createPermission);

/**
 * @swagger
 * /api/permissions/{permissionId}:
 *   patch:
 *     summary: Cập nhật quyền (Module, Mô tả)
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Cập nhật thông tin của quyền. Mã Code không thể thay đổi sau khi tạo.
 *     tags: [1.3.2 Quản lý danh sách quyền]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của quyền cần cập nhật
 *         example: "PERM_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module:
 *                 type: string
 *                 description: Tên phân hệ/module quản lý mới
 *                 example: "BILLING_ADVANCED"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Mô tả chi tiết về quyền
 *                 example: "Quyền tạo và quản lý hóa đơn nâng cao"
 *           example:
 *             module: "BILLING"
 *             description: "Quyền tạo hóa đơn thanh toán"
 *     responses:
 *       200:
 *         description: Cập nhật quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cập nhật quyền thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     permissions_id:
 *                       type: string
 *                       example: "PERM_001"
 *                     code:
 *                       type: string
 *                       example: "INVOICE_CREATE"
 *                     module:
 *                       type: string
 *                       example: "BILLING"
 *                     description:
 *                       type: string
 *                       example: "Quyền tạo hóa đơn thanh toán"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy quyền
 *       500:
 *         description: Lỗi máy chủ
 */
permissionRoutes.patch('/:permissionId', PermissionController.updatePermission);

/**
 * @swagger
 * /api/permissions/{permissionId}:
 *   delete:
 *     summary: Xóa quyền
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Xóa một quyền khỏi hệ thống. Không thể xóa quyền đang được sử dụng bởi bất kỳ vai trò nào.
 *     tags: [1.3.2 Quản lý danh sách quyền]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của quyền cần xóa
 *         example: "PERM_001"
 *     responses:
 *       200:
 *         description: Xóa quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Xóa quyền thành công"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy quyền
 *       409:
 *         description: Đang có Role sử dụng quyền này, không thể xóa
 *       500:
 *         description: Lỗi máy chủ
 */
permissionRoutes.delete('/:permissionId', PermissionController.deletePermission);

export default permissionRoutes;
