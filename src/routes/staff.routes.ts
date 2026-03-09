import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../middleware/authorizePermissions.middleware';
import { uploadImage as upload } from '../middleware/upload.middleware';

const staffRoutes = Router();

// THÔNG TIN CHUNG NHÂN SỰ Y TẾ (STAFF)

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Lấy danh sách nhân sự y tế (Bác sĩ, Y tá, NV Kho...)
 *     description: |
 *       **Vai trò được phép:** những người có quyền STAFF_VIEW.
 *       Mặc định không trả về PATIENT. Dùng chung bộ lọc filter như User.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại (Mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng nhân sự mỗi trang (Mặc định 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, email, sdt
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Lọc theo Mã role (Code) ví dụ DOCTOR, NURSE, PHARMACIST...
 *     responses:
 *       200:
 *         description: Thành công
 */
staffRoutes.get('/', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_VIEW')], StaffController.getStaffs);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   get:
 *     summary: Chi tiết thông tin nhân sự y tế
 *     description: Lấy chi tiết thông tin nhân sự kèm chức vụ nhánh/phân khoa, học vị bsi...
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thành công
 *       404:
 *         description: Không tìm thấy nhân sự
 */
staffRoutes.get('/:staffId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_VIEW')], StaffController.getStaffById);

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Tạo hồ sơ nhân sự y tế mới
 *     description: |
 *       Tạo tài khoản và gán trực tiếp vai trò (Role) + Chi nhánh (Branch/Department).
 *       **Lưu ý:** Bắt buộc truyền ít nhất 1 role_code vào mảng `roles` (vd: `['DOCTOR']`).
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, full_name, roles]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test.doctor@clinic.com"
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               password:
 *                 type: string
 *                 description: "Nếu bỏ trống sẽ tự phát sinh"
 *                 example: "Pwd1234@"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Test"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1980-01-01"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079080001234"
 *               address:
 *                 type: string
 *                 example: "123 Đường A, Quận B, TP.HCM"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOCTOR"]
 *               branch_id:
 *                 type: string
 *                 description: "ID Chi nhánh sẽ phân công làm việc chính"
 *                 example: "BRANCH_123"
 *               department_id:
 *                 type: string
 *                 description: "ID Phòng ban (tùy chọn)"
 *                 example: "DEPT_456"
 *               role_title:
 *                 type: string
 *                 description: "Chức vụ tại nhánh"
 *                 example: "Trưởng khoa Nội"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
staffRoutes.post('/', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_CREATE')], StaffController.createStaff);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   put:
 *     summary: Cập nhật thông tin cơ bản nhân sự
 *     description: Cập nhật Profile và Email/SDT (Role và các mapping khác nằm ở API riêng)
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
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
 *               email:
 *                 type: string
 *                 example: "test.doctor.updated@clinic.com"
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Test Updated"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1980-01-01"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079080001234"
 *               address:
 *                 type: string
 *                 example: "123 Đường A, Quận B, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateStaff);

/**
 * @swagger
 * /api/staff/{staffId}/signature:
 *   patch:
 *     summary: Cập nhật file ảnh chữ ký số
 *     description: Tải lên file ảnh chứa chữ ký số (.png, .jpg)
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
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
 *         description: Cập nhật chữ ký thành công
 */
staffRoutes.patch('/:staffId/signature', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE'), upload.single('file')], StaffController.updateSignature);

// ==========================================
// THÔNG TIN CHUYÊN MÔN BÁC SĨ (Dành cho DOCTOR)
// ==========================================

/**
 * @swagger
 * /api/staff/{staffId}/doctor-info:
 *   put:
 *     summary: Khai báo / Cập nhật chuyên môn Bác sĩ
 *     description: |
 *       - Dành riêng cho nhân sự đã có Role = 'DOCTOR'.
 *       - Gọi API này để gán Specialty (Chuyên khoa), Title (Chức danh - Học vị) và giá khám tiêu chuẩn.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [specialty_id]
 *             properties:
 *               specialty_id:
 *                 type: string
 *                 example: "SPEC_001"
 *               title:
 *                 type: string
 *                 example: "ThS. Bs. CKII"
 *               biography:
 *                 type: string
 *                 example: "Hơn 20 năm kinh nghiệm trong lĩnh vực Tim mạch, từng tu nghiệp tại Pháp."
 *               consultation_fee:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId/doctor-info', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateDoctorInfo);

// ==========================================
// QUẢN LÝ BẰNG CẤP / CHỨNG CHỈ (LICENSES)
// ==========================================

/**
 * @swagger
 * /api/staff/{staffId}/licenses:
 *   get:
 *     summary: Lấy danh sách bằng cấp/chứng chỉ
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thành công
 */
staffRoutes.get('/:staffId/licenses', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_VIEW')], StaffController.getLicensesByUserId);

/**
 * @swagger
 * /api/staff/{staffId}/licenses:
 *   post:
 *     summary: Thêm bằng cấp/chứng chỉ hành nghề
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [license_type, license_number, issue_date]
 *             properties:
 *               license_type:
 *                 type: string
 *                 description: "Loại (VD: Chứng chỉ hành nghề, Bằng Đại học)"
 *                 example: "Chứng chỉ hành nghề khám bệnh, chữa bệnh"
 *               license_number:
 *                 type: string
 *                 description: "Số hiệu"
 *                 example: "010045/HCM-CCHN"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: "2015-10-30"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-10-30"
 *               issued_by:
 *                 type: string
 *                 description: "Nơi cấp"
 *                 example: "Sở Y Tế TP.HCM"
 *               document_url:
 *                 type: string
 *                 description: "Link file scan"
 *                 example: "https://example.com/scan.pdf"
 *     responses:
 *       201:
 *         description: Thêm thành công
 */
staffRoutes.post('/:staffId/licenses', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_CREATE', 'STAFF_UPDATE')], StaffController.createLicense);

/**
 * @swagger
 * /api/staff/{staffId}/licenses/{licenseId}:
 *   put:
 *     summary: Trọng Số Bằng cấp/Chứng chỉ
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: licenseId
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
 *               license_type:
 *                 type: string
 *                 example: "Chứng chỉ hành nghề"
 *               license_number:
 *                 type: string
 *                 example: "010045/HCM-CCHN"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: "2015-10-30"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-10-30"
 *               issued_by:
 *                 type: string
 *                 example: "Sở Y Tế Hà Nội"
 *               document_url:
 *                 type: string
 *                 example: "https://example.com/scan.pdf"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId/licenses/:licenseId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateLicense);

/**
 * @swagger
 * /api/staff/{staffId}/licenses/{licenseId}:
 *   delete:
 *     summary: Xóa Bằng cấp/Chứng chỉ
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: licenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
staffRoutes.delete('/:staffId/licenses/:licenseId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE', 'STAFF_DELETE')], StaffController.deleteLicense);

// QUẢN LÝ TRẠNG THÁI VÀ VAI TRÒ

/**
 * @swagger
 * /api/staff/{staffId}/status:
 *   put:
 *     summary: Cập nhật trạng thái nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** những người có quyền STAFF_UPDATE.
 *       (ACTIVE, INACTIVE, BANNED)
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BANNED]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId/status', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateStaffStatus);

/**
 * @swagger
 * /api/staff/{staffId}/roles:
 *   post:
 *     summary: Gán vai trò cho nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** những người có quyền STAFF_UPDATE.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 description: Mã Role (VD DOCTOR, NURSE)
 *     responses:
 *       200:
 *         description: Cấp quyền thành công
 */
staffRoutes.post('/:staffId/roles', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.assignStaffRole);

/**
 * @swagger
 * /api/staff/{staffId}/roles/{roleId}:
 *   delete:
 *     summary: Thu hồi vai trò của nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** những người có quyền STAFF_UPDATE.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 */
staffRoutes.delete('/:staffId/roles/:roleId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.removeStaffRole);


// ==========================================
// QUẢN LÝ CHI NHÁNH / KHÁM CHỮA BỆNH
// ==========================================

/**
 * @swagger
 * /api/staff/{staffId}/branches:
 *   post:
 *     summary: Gán nhân sự vào chi nhánh / phòng ban
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** những người có quyền STAFF_UPDATE.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId]
 *             properties:
 *               branchId:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               roleTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phân công thành công
 */
staffRoutes.post('/:staffId/branches', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.assignStaffFacility);

/**
 * @swagger
 * /api/staff/{staffId}/branches/{branchId}:
 *   delete:
 *     summary: Xóa phân công nhân sự khỏi chi nhánh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** những người có quyền STAFF_UPDATE.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xóa phân công thành công
 */
staffRoutes.delete('/:staffId/branches/:branchId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.removeStaffFacility);

export default staffRoutes;
