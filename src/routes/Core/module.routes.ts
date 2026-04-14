import { Router } from 'express';
import { ModuleController } from '../../controllers/Core/module.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';

const moduleRoutes = Router();

moduleRoutes.use(verifyAccessToken);

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Lấy danh sách các Module riêng biệt
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       API trả về mảng danh sách tên các Module có sẵn trong hệ thống phục vụ việc nhóm quyền hạn.
 *     tags: [1.3.4 Phân quyền theo module]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách module thành công
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
 *                   description: Danh sách tên các module trong hệ thống
 *                   items:
 *                     type: object
 *                     properties:
 *                       module_id:
 *                         type: string
 *                         example: "MOD_001"
 *                       name:
 *                         type: string
 *                         description: Tên module/phân hệ
 *                         example: "PATIENT_MANAGEMENT"
 *                       description:
 *                         type: string
 *                         description: Mô tả module
 *                         example: "Quản lý bệnh nhân"
 *                   example:
 *                     - name: "PATIENT_MANAGEMENT"
 *                       description: "Quản lý bệnh nhân"
 *                     - name: "BILLING"
 *                       description: "Quản lý thanh toán"
 *                     - name: "APPOINTMENT"
 *                       description: "Quản lý lịch khám"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
moduleRoutes.get('/', ModuleController.getModules);

/**
 * @swagger
 * /api/modules/{moduleName}/permissions:
 *   get:
 *     summary: Lấy danh sách Quyền của một Module cụ thể
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Trả về tất cả quyền (permissions) được gán trong một module cụ thể.
 *     tags: [1.3.4 Phân quyền theo module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên của module/phân hệ
 *         example: "PATIENT_MANAGEMENT"
 *     responses:
 *       200:
 *         description: Lấy danh sách quyền của module thành công
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
 *                   description: Danh sách quyền của module
 *                   items:
 *                     type: object
 *                     properties:
 *                       permissions_id:
 *                         type: string
 *                         example: "PERM_001"
 *                       code:
 *                         type: string
 *                         example: "PATIENT_VIEW"
 *                       module:
 *                         type: string
 *                         example: "PATIENT_MANAGEMENT"
 *                       description:
 *                         type: string
 *                         example: "Xem thông tin bệnh nhân"
 *                   example:
 *                     - code: "PATIENT_VIEW"
 *                       module: "PATIENT_MANAGEMENT"
 *                       description: "Xem thông tin bệnh nhân"
 *                     - code: "PATIENT_CREATE"
 *                       module: "PATIENT_MANAGEMENT"
 *                       description: "Tạo bệnh nhân mới"
 *                     - code: "PATIENT_UPDATE"
 *                       module: "PATIENT_MANAGEMENT"
 *                       description: "Cập nhật thông tin bệnh nhân"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Module không tồn tại
 *       500:
 *         description: Lỗi máy chủ
 */
moduleRoutes.get('/:moduleName/permissions', ModuleController.getPermissionsByModule);

export default moduleRoutes;
