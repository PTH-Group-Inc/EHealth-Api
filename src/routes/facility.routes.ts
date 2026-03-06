import { Router } from 'express';
import { FacilityController } from '../controllers/facility.controller';

const facilityRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Facility Management
 *   description: Quản lý Cơ sở, Chi nhánh, Phòng ban
 */

/**
 * @swagger
 * /api/facilities:
 *   get:
 *     summary: Lấy danh sách Cơ sở Y tế (Dropdown)
 *     description: Lấy danh sách các Facility trạng thái ACTIVE để hiển thị trên Dropdown bộ lọc / Form.
 *     tags: [Facility Management]
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       facilities_id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 */
facilityRoutes.get('/', FacilityController.getFacilitiesForDropdown);

export default facilityRoutes;
