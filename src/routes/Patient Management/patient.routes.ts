// src/routes/Patient Management/patient.routes.ts
import { Router } from 'express';
import { PatientController } from '../../controllers/Patient Management/patient.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Lấy danh sách hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách hồ sơ bệnh nhân có phân trang.
 *       Hỗ trợ tìm kiếm theo tên, mã bệnh nhân, số điện thoại, CMND/CCCD.
 *       Hỗ trợ lọc theo trạng thái (ACTIVE/INACTIVE) và giới tính (MALE/FEMALE/OTHER).
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mã BN, SĐT, CMND
 *         example: "Nguyễn"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Lọc theo trạng thái hồ sơ
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         description: Lọc theo giới tính
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatients);

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Lấy chi tiết hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       Trả về thông tin chi tiết hồ sơ bệnh nhân, bao gồm thông tin tài khoản Mobile App đã liên kết (nếu có).
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientById);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Tạo mới hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_CREATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Tạo hồ sơ bệnh nhân mới. Hệ thống tự động:
 *       - Sinh mã bệnh nhân duy nhất (format: BN + YYMM + 5 số).
 *       - Chuẩn hóa tên (Title Case), SĐT (loại bỏ ký tự thừa), email (lowercase).
 *       - Kiểm tra trùng CMND/CCCD.
 *       - Validate ngày sinh không trong tương lai.
 *
 *       **Các trường bắt buộc:** `full_name`, `date_of_birth`, `gender`.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, date_of_birth, gender]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn An"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               email:
 *                 type: string
 *                 example: "nguyenvanan@gmail.com"
 *               id_card_number:
 *                 type: string
 *                 example: "079090123456"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Phường 2, Quận 5"
 *               province_id:
 *                 type: integer
 *                 example: 79
 *               district_id:
 *                 type: integer
 *                 example: 760
 *               ward_id:
 *                 type: integer
 *                 example: 26734
 *               emergency_contact_name:
 *                 type: string
 *                 example: "Nguyễn Thị Bình"
 *               emergency_contact_phone:
 *                 type: string
 *                 example: "0987654321"
 *     responses:
 *       201:
 *         description: Tạo hồ sơ bệnh nhân thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu trường bắt buộc, CMND trùng, ngày sinh sai, ...)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_CREATE'), PatientController.createPatient);

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Cập nhật thông tin hành chính bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Cập nhật thông tin hành chính bệnh nhân: tên, ngày sinh, giới tính, SĐT, email, CMND, địa chỉ, người liên hệ khẩn cấp.
 *       Chỉ các trường được gửi lên mới được cập nhật (partial update).
 *       Hệ thống tự chuẩn hóa dữ liệu và kiểm tra trùng CMND nếu thay đổi.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn An"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               phone_number:
 *                 type: string
 *                 example: "0909876543"
 *               email:
 *                 type: string
 *                 example: "updated@email.com"
 *               id_card_number:
 *                 type: string
 *                 example: "079090654321"
 *               address:
 *                 type: string
 *                 example: "456 Lê Lợi, Quận 1"
 *               province_id:
 *                 type: integer
 *                 example: 79
 *               district_id:
 *                 type: integer
 *                 example: 760
 *               ward_id:
 *                 type: integer
 *                 example: 26734
 *               emergency_contact_name:
 *                 type: string
 *                 example: "Trần Văn C"
 *               emergency_contact_phone:
 *                 type: string
 *                 example: "0912345678"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.updatePatient);

/**
 * @swagger
 * /api/patients/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Chuyển trạng thái hồ sơ bệnh nhân:
 *       - `ACTIVE`: Hồ sơ đang hoạt động, bệnh nhân đang được theo dõi.
 *       - `INACTIVE`: Ngưng theo dõi (ví dụ: bệnh nhân không quay lại tái khám, yêu cầu ngưng dịch vụ).
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
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
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "INACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.patch('/:id/status', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.updateStatus);

/**
 * @swagger
 * /api/patients/{id}/link-account:
 *   patch:
 *     summary: Liên kết hồ sơ bệnh nhân với tài khoản Mobile App
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Liên kết hồ sơ bệnh nhân với một tài khoản Mobile App (`auth_accounts`).
 *       Cho phép 1 tài khoản App quản lý nhiều hồ sơ (ví dụ: Mẹ đặt lịch cho con).
 *       Nếu hồ sơ đã được liên kết với tài khoản khác, API sẽ trả về lỗi.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [account_id]
 *             properties:
 *               account_id:
 *                 type: string
 *                 description: ID tài khoản người dùng (users_id trong auth_accounts)
 *                 example: "usr_abc123"
 *     responses:
 *       200:
 *         description: Liên kết thành công
 *       400:
 *         description: Hồ sơ đã liên kết với tài khoản khác
 *       404:
 *         description: Không tìm thấy hồ sơ hoặc tài khoản
 */
router.patch('/:id/link-account', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.linkAccount);

/**
 * @swagger
 * /api/patients/{id}/unlink-account:
 *   patch:
 *     summary: Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Hủy liên kết tài khoản Mobile App khỏi hồ sơ bệnh nhân. Đặt `account_id` về `NULL`.
 *       Thao tác này không xóa tài khoản hay hồ sơ, chỉ gỡ bỏ mối liên kết.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Hủy liên kết thành công
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.patch('/:id/unlink-account', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.unlinkAccount);

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Xóa hồ sơ bệnh nhân (soft delete)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_DELETE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Xóa mềm (soft delete) hồ sơ bệnh nhân. Dữ liệu không bị mất, chỉ đánh dấu `deleted_at`.
 *       Hồ sơ đã xóa sẽ không xuất hiện trong danh sách tìm kiếm.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DELETE'), PatientController.deletePatient);

export const patientRoutes = router;
