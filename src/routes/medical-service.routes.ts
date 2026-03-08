import { Router } from 'express';
import { MasterServiceController } from '../controllers/service.controller';
import { FacilityServiceController } from '../controllers/facility-service.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';
import { uploadExcel } from '../middleware/upload.middleware';

const router = Router();

// Middleware chung cho nhóm API này
const requireAdmin = [
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'SYSTEM')
];

const requireAdminOrManager = [
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'SYSTEM', 'STAFF')
];

const requireMedicalStaff = [
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'SYSTEM', 'DOCTOR', 'NURSE', 'STAFF')
];

/**
 * 1. DANH MỤC DỊCH VỤ CHUẨN QUỐC GIA (MASTER SERVICES)
 */

/**
 * @swagger
 * tags:
 *   name: 1.5.4 Quản lý danh mục dịch vụ chuẩn
 *   description: Quản lý danh mục gốc các dịch vụ y tế (chưa bao gồm giá)
 */

/**
 * @swagger
 * /api/medical-services/master:
 *   get:
 *     summary: Lấy danh sách dịch vụ chuẩn
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc mã
 *       - in: query
 *         name: serviceGroup
 *         schema:
 *           type: string
 *           example: KHAM
 *         description: Nhóm dịch vụ (KHAM, XN, CDHA, THUTHUAT)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ chuẩn
 */
router.get('/master', requireMedicalStaff, MasterServiceController.getServices);

/**
 * @swagger
 * /api/medical-services/master/export:
 *   get:
 *     summary: Xuất danh sách dịch vụ chuẩn ra file Excel
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về file Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/master/export', requireAdminOrManager, MasterServiceController.exportServices);

/**
 * @swagger
 * /api/medical-services/master/import:
 *   post:
 *     summary: Import danh sách dịch vụ chuẩn bằng file Excel
 *     description: Tải lên file Excel (.xlsx). Yêu cầu cột "Mã Dịch Vụ (*)" và "Tên Dịch Vụ (*)".
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 */
router.post('/master/import', requireAdminOrManager, uploadExcel.single('file'), MasterServiceController.importServices);

/**
 * @swagger
 * /api/medical-services/master/{id}:
 *   get:
 *     summary: Lấy chi tiết dịch vụ chuẩn
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết dịch vụ
 *       404:
 *         description: Không tìm thấy (SRV_001)
 */
router.get('/master/:id', requireMedicalStaff, MasterServiceController.getServiceById);

/**
 * @swagger
 * /api/medical-services/master:
 *   post:
 *     summary: Tạo dịch vụ chuẩn mới
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: "XN_MAU_TONG_QUAT"
 *               name:
 *                 type: string
 *                 example: "Xét nghiệm máu tổng quát 32 chỉ số"
 *               service_group:
 *                 type: string
 *                 example: "XN"
 *               description:
 *                 type: string
 *                 example: "Bao gồm công thức máu, sinh hóa, miễn dịch cơ bản"
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Khởi tạo thành công
 *       400:
 *         description: Lỗi trùng mã (SRV_002)
 */
router.post('/master', requireAdmin, MasterServiceController.createService);

/**
 * @swagger
 * /api/medical-services/master/{id}:
 *   put:
 *     summary: Cập nhật dịch vụ chuẩn
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *                 example: "Xét nghiệm máu tổng quát nâng cao"
 *               service_group:
 *                 type: string
 *                 example: "XN"
 *               description:
 *                 type: string
 *                 example: "Đã cập nhật mô tả"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy (SRV_001)
 */
router.put('/master/:id', requireAdminOrManager, MasterServiceController.updateService);

/**
 * @swagger
 * /api/medical-services/master/{id}/status:
 *   patch:
 *     summary: Khóa / Mở khóa dịch vụ chuẩn
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/master/:id/status', requireAdminOrManager, MasterServiceController.toggleServiceStatus);

/**
 * @swagger
 * /api/medical-services/master/{id}:
 *   delete:
 *     summary: Xóa mềm dịch vụ chuẩn
 *     tags: [1.5.4 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/master/:id', requireAdminOrManager, MasterServiceController.deleteService);

/**
 * =========================================================================
 * 2. CẤU HÌNH DỊCH VỤ TẠI CƠ SỞ (FACILITY SERVICES)
 * Nhóm API này dùng để cấu hình giá, thời gian thủ thuật, gán vào Khoa/Phòng
 * =========================================================================
 */

/**
 * @swagger
 * tags:
 *   name: 1.5.5 Quản lý dịch vụ cơ sở
 *   description: Cấu hình giá tiền, phòng ban thực hiện tại từng cơ sở
 */

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ tại 1 cơ sở
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Lọc theo khoa phòng (VD Khoa Nội)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên dịch vụ
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ kèm giá
 */
router.get('/facilities/:facilityId/services', requireMedicalStaff, FacilityServiceController.getFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services/export:
 *   get:
 *     summary: Xuất danh sách dịch vụ cơ sở ra file Excel
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về file Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/facilities/:facilityId/services/export', requireAdminOrManager, FacilityServiceController.exportFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services/import:
 *   post:
 *     summary: Import danh sách dịch vụ cơ sở bằng file Excel
 *     description: Tải lên file Excel (.xlsx). Yêu cầu cột "Mã Dịch Vụ Chuẩn (*)" và "Giá Cơ Bản (VNĐ) (*)". Phải thuộc 1 cơ sở cụ thể.
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 */
router.post('/facilities/:facilityId/services/import', requireAdminOrManager, uploadExcel.single('file'), FacilityServiceController.importFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/active-services:
 *   get:
 *     summary: API load nhanh dịch vụ đang Hoạt động cho Dropdown Bác sĩ
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách tối đa 50 dịch vụ khớp tiêu chí
 */
router.get('/facilities/:facilityId/active-services', requireMedicalStaff, FacilityServiceController.getActiveFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/services/{id}:
 *   get:
 *     summary: Lấy chi tiết cấu hình dịch vụ cơ sở
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết
 *       404:
 *         description: Không tìm thấy (FSRV_001)
 */
router.get('/facilities/services/:id', requireMedicalStaff, FacilityServiceController.getFacilityServiceById);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services:
 *   post:
 *     summary: Thêm dịch vụ vào cơ sở
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_id
 *               - base_price
 *             properties:
 *               service_id:
 *                 type: string
 *                 example: "SRV_MASTER_SA_BUNG"
 *                 description: ID dịch vụ chuẩn
 *               department_id:
 *                 type: string
 *                 example: "DEPT_HCM_CDHA"
 *                 description: Nên gán vào khoa Chẩn đoán hình ảnh
 *               base_price:
 *                 type: number
 *                 example: 300000
 *               insurance_price:
 *                 type: number
 *                 example: 120000
 *               estimated_duration_minutes:
 *                 type: number
 *                 example: 20
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi trùng lặp hoặc sai ID (FSRV_002, SRV_001)
 */
router.post('/facilities/:facilityId/services', requireAdminOrManager, FacilityServiceController.createFacilityService);

/**
 * @swagger
 * /api/medical-services/facilities/services/{id}:
 *   put:
 *     summary: Sửa cấu hình (Đổi giá, đổi phòng) cho dịch vụ cơ sở
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               department_id:
 *                 type: string
 *                 example: "DEPT_HCM_NOI"
 *               base_price:
 *                 type: number
 *                 example: 500000
 *               insurance_price:
 *                 type: number
 *                 example: 150000
 *               estimated_duration_minutes:
 *                 type: number
 *                 example: 30
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/facilities/services/:id', requireAdminOrManager, FacilityServiceController.updateFacilityService);

/**
 * @swagger
 * /api/medical-services/facilities/services/{id}/status:
 *   patch:
 *     summary: Ngưng/Bật cung cấp dịch vụ tại cơ sở
 *     tags: [1.5.5 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Ngưng cung cấp thành công
 */
router.patch('/facilities/services/:id/status', requireAdminOrManager, FacilityServiceController.toggleFacilityServiceStatus);

export default router;
