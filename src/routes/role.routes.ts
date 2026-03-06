import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';

const roleRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Master Data
 *   description: API danh mục nền (Dropdowns)
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Lấy danh sách Roles (Vai trò)
 *     description: API trả về mảng danh mục vai trò như Bác sĩ, Y tá, Lễ tân để render Dropdown bộ lọc.
 *     tags: [Master Data]
 *     responses:
 *       200:
 *         description: Trả về thành công
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
 *                       roles_id:
 *                         type: string
 *                         example: ROLE_1
 *                       code:
 *                         type: string
 *                         example: DOCTOR
 *                       name:
 *                         type: string
 *                         example: "Bác Sĩ"
 *                       description:
 *                         type: string
 *                         example: "Bác sĩ điều trị và kê đơn"
 *                       is_system:
 *                         type: boolean
 *                         example: true
 */
roleRoutes.get('/', RoleController.getAllRoles);

export default roleRoutes;
