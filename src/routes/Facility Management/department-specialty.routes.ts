import { Router } from 'express';
import { DepartmentSpecialtyController } from '../../controllers/Facility Management/department-specialty.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
const router = Router();

// GET routes → PUBLIC (tra cứu chuyên khoa theo phòng ban / chi nhánh / cơ sở)
// CUD routes → yêu cầu verifyAccessToken + checkSessionStatus

/**
 * @swagger
 * tags:
 *   name: 2.3.1 Gán chuyên khoa - Phòng ban
 *   description: |
 *     Quản lý liên kết giữa Khoa/Phòng ban và Chuyên khoa.
 *     Một phòng ban có thể chứa nhiều chuyên khoa, một chuyên khoa có thể thuộc nhiều phòng ban.
 *     Hỗ trợ truy vấn chuyên khoa theo phòng ban, chi nhánh hoặc cơ sở y tế.
 */

/**
 * @swagger
 * /api/department-specialties/{departmentId}/specialties:
 *   get:
 *     summary: Lấy danh sách chuyên khoa thuộc 1 phòng ban
 *     description: |
 *       **Phân quyền:** Không yêu cầu (PUBLIC)
 *
 *       **Vai trò được phép:** Tất cả (bao gồm khách vãng lai)
 *
 *       Trả về danh sách tất cả chuyên khoa đã được gán cho phòng ban chỉ định.
 *       Chỉ trả về chuyên khoa chưa bị xóa mềm (deleted_at IS NULL).
 *     operationId: getSpecialtiesByDepartment
 *     tags: [2.3.1 Gán chuyên khoa - Phòng ban]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DEPT_123456"
 *         description: ID của phòng ban (departments_id)
 *     responses:
 *       200:
 *         description: Danh sách chuyên khoa thuộc phòng ban
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
 *                       department_specialty_id:
 *                         type: string
 *                         example: "DSPC_260328_abc1234567"
 *                       department_id:
 *                         type: string
 *                         example: "DEPT_123456"
 *                       specialty_id:
 *                         type: string
 *                         example: "SPC_2603_a1b2c3d4"
 *                       specialty_code:
 *                         type: string
 *                         example: "CARDIOLOGY"
 *                       specialty_name:
 *                         type: string
 *                         example: "Khoa Tim Mạch"
 *                       specialty_description:
 *                         type: string
 *                         example: "Chuyên điều trị các bệnh lý về tim mạch"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Phòng ban không tồn tại (DSP_001)
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:departmentId/specialties', DepartmentSpecialtyController.getSpecialtiesByDepartment);

/**
 * @swagger
 * /api/department-specialties/by-branch/{branchId}:
 *   get:
 *     summary: Lấy danh sách chuyên khoa theo chi nhánh
 *     description: |
 *       **Phân quyền:** Không yêu cầu (PUBLIC)
 *
 *       **Vai trò được phép:** Tất cả (bao gồm khách vãng lai)
 *
 *       Truy vấn tổng hợp: Trả về danh sách chuyên khoa DISTINCT từ tất cả phòng ban ACTIVE thuộc chi nhánh.
 *       Hữu ích cho Mobile App khi muốn hiển thị chuyên khoa theo chi nhánh cho bệnh nhân.
 *     operationId: getSpecialtiesByBranch
 *     tags: [2.3.1 Gán chuyên khoa - Phòng ban]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           example: "BRN_123456"
 *         description: ID của chi nhánh (branches_id)
 *     responses:
 *       200:
 *         description: Danh sách chuyên khoa tại chi nhánh (đã loại trùng)
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
 *                       specialty_id:
 *                         type: string
 *                         example: "SPC_2603_a1b2c3d4"
 *                       specialty_code:
 *                         type: string
 *                         example: "CARDIOLOGY"
 *                       specialty_name:
 *                         type: string
 *                         example: "Khoa Tim Mạch"
 *                       department_code:
 *                         type: string
 *                         example: "KHOA_NOI"
 *                       department_name:
 *                         type: string
 *                         example: "Khoa Nội Tổng Hợp"
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/by-branch/:branchId', DepartmentSpecialtyController.getSpecialtiesByBranch);

/**
 * @swagger
 * /api/department-specialties/by-facility/{facilityId}:
 *   get:
 *     summary: Lấy danh sách chuyên khoa theo cơ sở y tế
 *     description: |
 *       **Phân quyền:** Không yêu cầu (PUBLIC)
 *
 *       **Vai trò được phép:** Tất cả (bao gồm khách vãng lai)
 *
 *       Truy vấn tổng hợp: Trả về danh sách chuyên khoa DISTINCT từ tất cả phòng ban ACTIVE
 *       thuộc tất cả chi nhánh ACTIVE của cơ sở y tế.
 *       Hữu ích cho Mobile App khi muốn hiển thị "Cơ sở X có những chuyên khoa nào?".
 *     operationId: getSpecialtiesByFacility
 *     tags: [2.3.1 Gán chuyên khoa - Phòng ban]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_001"
 *         description: ID của cơ sở y tế (facilities_id)
 *     responses:
 *       200:
 *         description: Danh sách chuyên khoa tại cơ sở (đã loại trùng)
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
 *                       specialty_id:
 *                         type: string
 *                         example: "SPC_2603_a1b2c3d4"
 *                       specialty_code:
 *                         type: string
 *                         example: "CARDIOLOGY"
 *                       specialty_name:
 *                         type: string
 *                         example: "Khoa Tim Mạch"
 *                       department_code:
 *                         type: string
 *                         example: "KHOA_NOI"
 *                       department_name:
 *                         type: string
 *                         example: "Khoa Nội Tổng Hợp"
 *                       branch_id:
 *                         type: string
 *                         example: "BRN_123456"
 *                       branch_name:
 *                         type: string
 *                         example: "Chi nhánh Quận 1"
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/by-facility/:facilityId', DepartmentSpecialtyController.getSpecialtiesByFacility);

/**
 * @swagger
 * /api/department-specialties/{departmentId}/specialties:
 *   post:
 *     summary: Gán danh sách chuyên khoa vào phòng ban
 *     description: |
 *       Gán (Replace) toàn bộ danh sách chuyên khoa cho phòng ban.
 *       Chiến lược: Xoá hết mapping cũ → Gán mới theo danh sách `specialty_ids` gửi lên.
 *       Phù hợp với UI dạng checkbox (chọn tất cả rồi Submit).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (verifyAccessToken + checkSessionStatus)
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     operationId: assignDepartmentSpecialties
 *     tags: [2.3.1 Gán chuyên khoa - Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DEPT_123456"
 *         description: ID của phòng ban
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialty_ids
 *             properties:
 *               specialty_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["SPC_2603_a1b2c3d4", "SPC_2603_e5f6g7h8"]
 *                 description: Danh sách specialties_id cần gán
 *     responses:
 *       200:
 *         description: Gán thành công
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
 *                   example: "Đã gán 3 chuyên khoa cho phòng ban thành công."
 *                 assigned:
 *                   type: number
 *                   example: 3
 *                 skipped:
 *                   type: number
 *                   example: 0
 *       400:
 *         description: |
 *           - Danh sách rỗng (DSP_004)
 *           - specialty_id không hợp lệ (DSP_002)
 *       404:
 *         description: Phòng ban không tồn tại (DSP_001)
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/:departmentId/specialties', verifyAccessToken, checkSessionStatus, DepartmentSpecialtyController.assignSpecialties);

/**
 * @swagger
 * /api/department-specialties/{departmentId}/specialties/{specialtyId}:
 *   delete:
 *     summary: Gỡ 1 chuyên khoa khỏi phòng ban
 *     description: |
 *       Xoá liên kết giữa 1 chuyên khoa và phòng ban.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (verifyAccessToken + checkSessionStatus)
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     operationId: removeDepartmentSpecialty
 *     tags: [2.3.1 Gán chuyên khoa - Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DEPT_123456"
 *         description: ID của phòng ban
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SPC_2603_a1b2c3d4"
 *         description: ID của chuyên khoa cần gỡ
 *     responses:
 *       200:
 *         description: Gỡ thành công
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
 *                   example: "Đã gỡ chuyên khoa khỏi phòng ban thành công."
 *       404:
 *         description: Không tìm thấy liên kết (DSP_003)
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:departmentId/specialties/:specialtyId', verifyAccessToken, checkSessionStatus, DepartmentSpecialtyController.removeSpecialty);

export default router;
