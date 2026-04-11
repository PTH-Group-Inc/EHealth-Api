import { Router } from 'express';
import { AppointmentController } from '../../controllers/Appointment Management/appointment.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
export const appointmentRoutes = Router();

// =====================================================================
// 3.1.1. QUẢN LÝ LỊCH KHÁM (Appointment CRUD)
// =====================================================================

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Đặt lịch khám mới (xếp hàng tự động)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CREATE.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo lịch khám mới theo cơ chế **xếp hàng tự động (queue-based)**.
 *       - Bệnh nhân chỉ cần chọn: **cơ sở (branch)**, **ca khám (shift)**, **ngày khám**, **kênh đặt**.
 *       - **Hệ thống tự động gán:**
 *         1. **Slot**: khung giờ đầu tiên còn chỗ trong ca (FIFO queue)
 *         2. **Bác sĩ**: BS ít tải nhất đang trực ca đó tại chi nhánh
 *         3. **Phòng khám**: phòng CONSULTATION trống tại branch
 *       - Nếu ca đã đầy (tất cả slot hết chỗ) → trả lỗi `SHIFT_FULL`.
 *       - Kênh `DIRECT_CLINIC` / `HOTLINE` tự động chuyển sang `CONFIRMED`.
 *       - **Toàn bộ logic chạy trong Transaction** (tránh race condition khi nhiều BN book cùng lúc).
 *       - Ghi log hành động vào bảng `appointment_audit_logs`.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - branch_id
 *               - shift_id
 *               - appointment_date
 *               - booking_channel
 *             properties:
 *               patient_id:
 *                 type: string
 *                 description: ID bệnh nhân
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               branch_id:
 *                 type: string
 *                 description: ID chi nhánh/cơ sở khám (bắt buộc)
 *                 example: "BR_HCM_001"
 *               shift_id:
 *                 type: string
 *                 description: ID ca khám (VD ca sáng, ca chiều — bắt buộc). Hệ thống sẽ tự xếp BN vào slot trong ca này.
 *                 example: "SH_MORNING"
 *               appointment_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày khám (YYYY-MM-DD, phải >= hôm nay)
 *                 example: "2026-03-20"
 *               booking_channel:
 *                 type: string
 *                 enum: [APP, WEB, HOTLINE, DIRECT_CLINIC, ZALO]
 *                 description: Kênh đặt lịch
 *                 example: "WEB"
 *               reason_for_visit:
 *                 type: string
 *                 description: Lý do khám / triệu chứng sơ bộ
 *                 example: "Đau đầu kéo dài 3 ngày, sốt nhẹ"
 *               symptoms_notes:
 *                 type: string
 *                 description: Ghi chú triệu chứng bổ sung
 *                 example: "Kèm theo chóng mặt buổi sáng"
 *               facility_service_id:
 *                 type: string
 *                 nullable: true
 *                 description: ID dịch vụ tại cơ sở (tuỳ chọn)
 *                 example: "FS_001"
 *     responses:
 *       201:
 *         description: Đặt lịch khám thành công (hệ thống đã tự gán slot + BS + phòng)
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
 *                   example: "Đặt lịch khám thành công"
 *                 warning:
 *                   type: string
 *                   nullable: true
 *                   description: Cảnh báo nếu không tìm được BS đúng chuyên khoa
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments_id:
 *                       type: string
 *                       example: "APT_abc123def45"
 *                     appointment_code:
 *                       type: string
 *                       example: "APP-20260320-A1B2"
 *                     branch_id:
 *                       type: string
 *                       example: "BR_HCM_001"
 *                     slot_id:
 *                       type: string
 *                       description: Slot được hệ thống tự gán (FIFO)
 *                       example: "SLOT_001"
 *                     doctor_id:
 *                       type: string
 *                       description: BS được hệ thống tự gán (ít tải nhất)
 *                       example: "DOC_2603_abc12345"
 *                     room_id:
 *                       type: string
 *                       description: Phòng được hệ thống tự gán
 *                       example: "ROOM_001"
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *       400:
 *         description: |
 *           Các lỗi có thể:
 *           - `MISSING_REQUIRED_FIELDS`: Thiếu patient_id, branch_id, shift_id, appointment_date, booking_channel
 *           - `INVALID_DATE`: Ngày khám < hôm nay
 *           - `SHIFT_FULL`: Tất cả slot trong ca đã đầy
 *           - `INVALID_BOOKING_CHANNEL`: Kênh không hợp lệ
 *       404:
 *         description: |
 *           - `PATIENT_NOT_FOUND`: Bệnh nhân không tồn tại
 *           - `BRANCH_NOT_FOUND`: Chi nhánh không tồn tại
 *           - `SHIFT_NOT_FOUND`: Ca khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
appointmentRoutes.post(
    '/',
    [verifyAccessToken],
    AppointmentController.create
);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Lấy danh sách lịch khám (có phân trang & filter)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách lịch khám kèm phân trang.
 *       - Hỗ trợ filter theo: `status`, `patient_id`, `doctor_id`, `room_id`, `fromDate`, `toDate`, `booking_channel`, `date`, `keyword`, `facility_service_id`.
 *       - Dữ liệu JOIN thêm: Tên bệnh nhân, Tên bác sĩ, Tên phòng, Tên dịch vụ, Thời gian slot.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED]
 *         description: Lọc theo trạng thái
 *         example: "PENDING"
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bệnh nhân
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bác sĩ
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: string
 *         description: Lọc theo phòng khám
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *         example: "2026-03-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *         example: "2026-03-31"
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: booking_channel
 *         schema:
 *           type: string
 *           enum: [WEB, APP, HOTLINE, DIRECT_CLINIC, REFERRAL]
 *         description: Lọc theo kênh đặt lịch
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc chính xác 1 ngày (thay vì fromDate-toDate)
 *         example: "2026-03-15"
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Tìm theo mã lịch khám hoặc tên bệnh nhân
 *         example: "APP-2603"
 *       - in: query
 *         name: facility_service_id
 *         schema:
 *           type: string
 *         description: Lọc theo dịch vụ cơ sở
 *     responses:
 *       200:
 *         description: Lấy danh sách lịch khám thành công
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
appointmentRoutes.get(
    '/',
    [verifyAccessToken],
    AppointmentController.getAll
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Cập nhật thông tin lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Cho phép thay đổi ngày khám, slot, bác sĩ, lý do khám.
 *       - Nếu đổi `slot_id`: hệ thống kiểm tra lại sức chứa slot mới.
 *       - Nếu đổi `doctor_id`: hệ thống validate bác sĩ mới.
 *       - Ghi log thay đổi chi tiết vào `appointment_audit_logs`.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-20"
 *               reason_for_visit:
 *                 type: string
 *                 example: "Đổi lý do: Tái khám theo hẹn"
 *               symptoms_notes:
 *                 type: string
 *                 example: "Triệu chứng giảm so với lần trước"
 *               doctor_id:
 *                 type: string
 *                 example: "DOC_2603_abc12345"
 *               slot_id:
 *                 type: string
 *                 example: "SLOT_002"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Slot mới đã đầy
 *       404:
 *         description: Lịch khám hoặc bác sĩ/slot không tồn tại
 */
appointmentRoutes.put(
    '/:id',
    [verifyAccessToken],
    AppointmentController.update
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Huỷ lịch khám (Soft Cancel)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CANCEL.
 *       **Vai trò được phép:** ADMIN, STAFF, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - **KHÔNG xoá cứng dữ liệu.** Chuyển trạng thái sang `CANCELLED`.
 *       - Bắt buộc phải cung cấp `cancellation_reason` trong body.
 *       - Ghi log huỷ lịch vào `appointment_audit_logs`.
 *       - Không thể huỷ lịch đã `COMPLETED` hoặc đã `CANCELLED`.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancellation_reason
 *             properties:
 *               cancellation_reason:
 *                 type: string
 *                 description: Lý do huỷ lịch (bắt buộc)
 *                 example: "Bệnh nhân xin dời sang tuần sau"
 *     responses:
 *       200:
 *         description: Huỷ lịch khám thành công
 *       400:
 *         description: Thiếu lý do hoặc lịch đã bị huỷ/hoàn tất
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentRoutes.delete(
    '/:id',
    [verifyAccessToken],
    AppointmentController.cancel
);

// =====================================================================
// 3.1.2. GÁN BÁC SĨ & TRA CỨU LỊCH BÁC SĨ
// =====================================================================

/**
 * @swagger
 * /api/appointments/{id}/assign-doctor:
 *   patch:
 *     summary: Gán bác sĩ cho lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Gán hoặc thay đổi bác sĩ được chỉ định cho lịch khám.
 *       - Validate bác sĩ phải tồn tại và đang `is_active = true`.
 *       - Ghi audit log ghi nhận thao tác chỉ định.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 description: ID bác sĩ
 *                 example: "DOC_2603_abc12345"
 *     responses:
 *       200:
 *         description: Gán bác sĩ thành công
 *       400:
 *         description: Thiếu doctor_id
 *       404:
 *         description: Lịch khám hoặc bác sĩ không tồn tại
 */
appointmentRoutes.patch(
    '/:id/assign-doctor',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.assignDoctor
);

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}:
 *   get:
 *     summary: Lấy danh sách lịch khám của một bác sĩ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về các lịch khám được phân công cho bác sĩ (loại trừ CANCELLED, NO_SHOW).
 *       - Dùng cho màn hình "Lịch trình công việc" của bác sĩ.
 *       - Hỗ trợ filter theo khoảng ngày (`fromDate`, `toDate`).
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bác sĩ
 *         example: "DOC_2603_abc12345"
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-10"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-20"
 *     responses:
 *       200:
 *         description: Lấy lịch bác sĩ thành công
 */
appointmentRoutes.get(
    '/doctor/:doctorId',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.getByDoctor
);

// =====================================================================
// 3.1.3. GÁN PHÒNG KHÁM & DỊCH VỤ
// =====================================================================

/**
 * @swagger
 * /api/appointments/{id}/assign-room:
 *   patch:
 *     summary: Gán phòng khám cho lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Điều hướng bệnh nhân vào phòng cụ thể.
 *       - Validate phòng phải tồn tại và đang `status = ACTIVE`.
 *       - Ghi audit log ghi nhận thao tác.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: ID phòng khám (medical_rooms)
 *                 example: "ROOM_001"
 *     responses:
 *       200:
 *         description: Gán phòng khám thành công
 *       404:
 *         description: Lịch khám hoặc phòng khám không tồn tại
 */
appointmentRoutes.patch(
    '/:id/assign-room',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.assignRoom
);

/**
 * @swagger
 * /api/appointments/{id}/assign-service:
 *   patch:
 *     summary: Gán dịch vụ cho lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Gắn kết 1 gói dịch vụ y tế cho lịch hẹn (VD: Khám Tổng Quan 150k, Khám VIP...).
 *       - Validate dịch vụ phải tồn tại và đang `is_active = true`.
 *       - Liên kết trực tiếp tới luồng tạo hóa đơn (Invoice) sau khi khám xong.
 *       - Ghi audit log ghi nhận thao tác.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_service_id
 *             properties:
 *               facility_service_id:
 *                 type: string
 *                 description: ID dịch vụ của cơ sở (facility_services)
 *                 example: "FS_001"
 *     responses:
 *       200:
 *         description: Gán dịch vụ thành công
 *       404:
 *         description: Lịch khám hoặc dịch vụ không tồn tại
 */
appointmentRoutes.patch(
    '/:id/assign-service',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.assignService
);

// =====================================================================
// 3.1.4. CHỌN NGÀY & KHUNG GIỜ KHÁM (Available Slots + Reschedule)
// =====================================================================

/**
 * @swagger
 * /api/appointments/available-slots:
 *   get:
 *     summary: Lấy danh sách slot trống theo ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả appointment_slots đang active, kèm thông tin ca (shift), số đã đặt, sức chứa.
 *       - Nếu truyền `doctor_id`: chỉ trả slot thuộc ca mà BS được xếp lịch làm việc ngày đó.
 *       - Nếu truyền `facility_id`: kiểm tra cơ sở có đóng cửa (ngày lễ / giờ hoạt động) → trả lỗi nếu đóng.
 *       - Slot có `is_available = true` nếu `booked_count < max_capacity`.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày khám (YYYY-MM-DD)
 *         example: "2026-03-20"
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Lọc theo bác sĩ (chỉ slot thuộc ca BS được xếp)
 *         example: "DOC_2603_abc12345"
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *         description: Lọc theo cơ sở (kiểm tra đóng cửa)
 *         example: "FAC_001"
 *     responses:
 *       200:
 *         description: Lấy danh sách slot trống thành công
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
 *                       slot_id:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *                       shift_name:
 *                         type: string
 *                       booked_count:
 *                         type: integer
 *                       max_capacity:
 *                         type: integer
 *                       is_available:
 *                         type: boolean
 *       400:
 *         description: Ngày không hợp lệ hoặc cơ sở đóng cửa
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
appointmentRoutes.get(
    '/available-slots',
    AppointmentController.getAvailableSlots
);

/**
 * @swagger
 * /api/appointments/available-slots-by-department:
 *   get:
 *     summary: Lấy danh sách slot trống theo Khoa (Department)
 *     description: |
 *       **Chức năng:** Trả về lịch khám trống nhóm theo ngày cho một Khoa (Department) cụ thể.
 *       Người dùng chọn Khoa → hệ thống quét slot trống từ ngày bắt đầu (mặc định hôm nay)
 *       trong khoảng N ngày (mặc định 7), kèm danh sách phòng khám thuộc khoa và trạng thái
 *       còn chỗ (`is_available`) để Frontend vẽ lưới đặt lịch.
 *
 *       **Phân quyền:** Yêu cầu xác thực token (đăng nhập).
 *       **Vai trò được phép:** Tất cả (ADMIN, STAFF, DOCTOR, NURSE, PATIENT).
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của Khoa/Phòng ban cần xem lịch trống
 *         example: "DEPT_NOI_001"
 *       - in: query
 *         name: facility_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cơ sở y tế (để kiểm tra ngày lễ / giờ mở cửa)
 *         example: "FAC_001"
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu quét (mặc định = hôm nay)
 *         example: "2026-03-31"
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           minimum: 1
 *           maximum: 30
 *         description: Số ngày muốn quét lịch (mặc định 7, tối đa 30)
 *         example: 7
 *     responses:
 *       200:
 *         description: Trả về mảng lịch nhóm theo ngày, mỗi ngày chứa danh sách slot
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
 *                       date:
 *                         type: string
 *                         example: "2026-03-31"
 *                       is_facility_open:
 *                         type: boolean
 *                         example: true
 *                       slots:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             slot_id:
 *                               type: string
 *                             start_time:
 *                               type: string
 *                               example: "08:00:00"
 *                             end_time:
 *                               type: string
 *                               example: "08:30:00"
 *                             shift_name:
 *                               type: string
 *                               example: "Ca sáng"
 *                             rooms:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   room_id:
 *                                     type: string
 *                                   room_name:
 *                                     type: string
 *                             booked_count:
 *                               type: integer
 *                               example: 2
 *                             max_capacity:
 *                               type: integer
 *                               example: 5
 *                             is_available:
 *                               type: boolean
 *                               example: true
 *       400:
 *         description: Thiếu department_id hoặc facility_id
 *       404:
 *         description: Khoa không tồn tại hoặc ngừng hoạt động
 *       401:
 *         description: Chưa đăng nhập
 */
appointmentRoutes.get(
    '/available-slots-by-department',
    AppointmentController.getAvailableSlotsByDepartment
);


// =====================================================================
// 3.1.3.5. LỊCH KHÁM CỦA TÔI (My Appointments - By Logged-in User)
// =====================================================================

/**
 * @swagger
 * /api/appointments/my-appointments:
 *   get:
 *     summary: Lấy danh sách lịch khám của tôi (theo tài khoản đang đăng nhập)
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token).
 *       **Vai trò được phép:** PATIENT, ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Tự động lấy `user_id` từ JWT Access Token.
 *       - Hệ thống tra cứu **TẤT CẢ** hồ sơ bệnh nhân (`patients.account_id`) liên kết với tài khoản đang đăng nhập.
 *       - **Hỗ trợ 1 user có nhiều hồ sơ BN** (VD: cha đặt lịch cho con, người thân đặt cho người già).
 *       - Trả về **gộp lịch khám từ mọi hồ sơ BN**, kèm phân trang & filter cơ bản.
 *       - Có thể lọc lịch theo 1 hồ sơ BN cụ thể bằng query param `patient_id`.
 *       - **Không cần truyền `patient_id`** nếu muốn xem tất cả — hệ thống tự xác định từ token.
 *       - Nếu tài khoản chưa liên kết với hồ sơ bệnh nhân nào → trả lỗi `PATIENT_PROFILE_NOT_FOUND`.
 *       - Dữ liệu JOIN thêm: Tên bệnh nhân, Mã bệnh nhân, Tên bác sĩ, Tên phòng, Tên chi nhánh, Tên dịch vụ, Thời gian slot.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: |
 *           Lọc lịch khám theo 1 hồ sơ bệnh nhân cụ thể.
 *           Chỉ chấp nhận ID thuộc quyền sở hữu của tài khoản đang đăng nhập.
 *           Bỏ trống để xem lịch của tất cả hồ sơ BN.
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, CANCELLED, NO_SHOW, COMPLETED]
 *         description: Lọc theo trạng thái lịch khám
 *         example: "PENDING"
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD)
 *         example: "2026-03-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD)
 *         example: "2026-03-31"
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
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách lịch khám của tôi thành công
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
 *                   example: "Lấy danh sách lịch khám của tôi thành công"
 *                 patient_id:
 *                   type: string
 *                   description: ID hồ sơ bệnh nhân đầu tiên (backward compatible)
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 patient_ids:
 *                   type: array
 *                   description: Danh sách TẤT CẢ các ID hồ sơ bệnh nhân liên kết với tài khoản
 *                   items:
 *                     type: string
 *                   example: ["550e8400-e29b-41d4-a716-446655440000", "660f9500-f39c-52e5-b827-557766550111"]
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       appointments_id:
 *                         type: string
 *                         example: "APT_abc123def45"
 *                       appointment_code:
 *                         type: string
 *                         example: "APP-20260320-A1B2"
 *                       patient_id:
 *                         type: string
 *                         description: ID hồ sơ bệnh nhân mà lịch này thuộc về
 *                         example: "550e8400-e29b-41d4-a716-446655440000"
 *                       patient_name:
 *                         type: string
 *                         example: "Nguyễn Văn A"
 *                       patient_code:
 *                         type: string
 *                         example: "BN-20260101-0001"
 *                       appointment_date:
 *                         type: string
 *                         example: "2026-03-20"
 *                       status:
 *                         type: string
 *                         example: "CONFIRMED"
 *                       doctor_name:
 *                         type: string
 *                         example: "BS. Nguyễn Văn A"
 *                       room_name:
 *                         type: string
 *                         example: "Phòng Khám Nội 1"
 *                       branch_name:
 *                         type: string
 *                         example: "Chi nhánh HCM"
 *                       service_name:
 *                         type: string
 *                         example: "Khám Tổng Quát"
 *                       slot_start_time:
 *                         type: string
 *                         example: "08:00:00"
 *                       slot_end_time:
 *                         type: string
 *                         example: "08:30:00"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       404:
 *         description: |
 *           - `PATIENT_PROFILE_NOT_FOUND`: Tài khoản chưa liên kết với hồ sơ bệnh nhân
 *       500:
 *         description: Lỗi máy chủ
 */
appointmentRoutes.get(
    '/my-appointments',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.getMyAppointments
);

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   patch:
 *     summary: Đổi lịch khám (ngày + slot)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Thay đổi ngày khám + slot cho lịch khám đã tồn tại.
 *       - Chỉ lịch ở trạng thái `PENDING` hoặc `CONFIRMED` mới được đổi.
 *       - Validate: slot mới is_active, sức chứa, trùng bệnh nhân, trùng bác sĩ.
 *       - Nếu lịch đã gán BS → kiểm tra BS có lịch làm việc ngày/ca mới.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_date
 *               - new_slot_id
 *             properties:
 *               new_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày khám mới
 *                 example: "2026-03-22"
 *               new_slot_id:
 *                 type: string
 *                 description: ID slot mới
 *                 example: "SLT_2603_abc12345"
 *     responses:
 *       200:
 *         description: Đổi lịch khám thành công
 *       400:
 *         description: Slot đầy / BS không có lịch / Trạng thái không cho phép
 *       404:
 *         description: Lịch khám hoặc slot không tồn tại
 */
appointmentRoutes.patch(
    '/:id/reschedule',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.reschedule
);

// =====================================================================
// 3.1.5. KIỂM TRA TRÙNG LỊCH (Conflict Check)
// =====================================================================

/**
 * @swagger
 * /api/appointments/check-conflict:
 *   post:
 *     summary: Kiểm tra trùng lịch (bác sĩ, phòng, bệnh nhân)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Kiểm tra 3 loại xung đột trước khi đặt/đổi lịch:
 *         1. **DOCTOR_CONFLICT**: BS đã có lịch cùng slot + ngày
 *         2. **PATIENT_CONFLICT**: BN đã có lịch cùng slot + ngày
 *         3. **ROOM_CONFLICT**: Phòng đầy (so với capacity) cùng slot + ngày
 *       - API chỉ **kiểm tra và trả kết quả**, KHÔNG chặn đặt lịch.
 *       - Có thể truyền `exclude_appointment_id` khi dùng cho reschedule (loại trừ lịch hiện tại).
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - slot_id
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Ngày khám cần kiểm tra
 *                 example: "2026-03-20"
 *               slot_id:
 *                 type: string
 *                 description: ID slot cần kiểm tra
 *                 example: "SLT_2603_abc12345"
 *               doctor_id:
 *                 type: string
 *                 description: ID bác sĩ (tuỳ chọn)
 *                 example: "DOC_2603_abc12345"
 *               patient_id:
 *                 type: string
 *                 description: ID bệnh nhân (tuỳ chọn)
 *                 example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *               room_id:
 *                 type: string
 *                 description: ID phòng khám (tuỳ chọn)
 *                 example: "RM_HCM_N101"
 *               exclude_appointment_id:
 *                 type: string
 *                 description: ID lịch cần loại trừ (dùng khi reschedule)
 *                 example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Kiểm tra trùng lịch hoàn tất
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
 *                     has_conflict:
 *                       type: boolean
 *                       example: true
 *                     conflicts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [DOCTOR_CONFLICT, PATIENT_CONFLICT, ROOM_CONFLICT]
 *                           message:
 *                             type: string
 *                           existing_appointment_id:
 *                             type: string
 *       400:
 *         description: Thiếu date hoặc slot_id
 */
appointmentRoutes.post(
    '/check-conflict',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.checkConflict
);

// =====================================================================
// 3.1.6. LƯU THÔNG TIN MỤC ĐÍCH KHÁM (Visit Reason)
// =====================================================================

/**
 * @swagger
 * /api/appointments/{id}/visit-reason:
 *   patch:
 *     summary: Cập nhật mục đích khám / triệu chứng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật 2 cột `reason_for_visit` + `symptoms_notes` trong bảng `appointments`.
 *       - Bệnh nhân hoặc tiếp tân có thể bổ sung sau khi đặt lịch.
 *       - Ghi audit log ghi nhận thao tác.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason_for_visit:
 *                 type: string
 *                 description: Lý do khám
 *                 example: "Tái khám huyết áp"
 *               symptoms_notes:
 *                 type: string
 *                 description: Ghi chú triệu chứng
 *                 example: "Chóng mặt, nhức đầu buổi sáng"
 *     responses:
 *       200:
 *         description: Cập nhật mục đích khám thành công
 *       400:
 *         description: Thiếu thông tin
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentRoutes.patch(
    '/:id/visit-reason',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.updateVisitReason
);

/**
 * @swagger
 * /api/appointments/{id}/visit-reason:
 *   get:
 *     summary: Lấy thông tin mục đích khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về `reason_for_visit` + `symptoms_notes` cho 1 lịch khám.
 *       - Dùng cho màn hình tiếp nhận / chuẩn bị khám.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Lấy thông tin mục đích khám thành công
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
 *                     reason_for_visit:
 *                       type: string
 *                       example: "Tái khám huyết áp"
 *                     symptoms_notes:
 *                       type: string
 *                       example: "Chóng mặt, nhức đầu buổi sáng"
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentRoutes.get(
    '/:id/visit-reason',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.getVisitReason
);

// =====================================================================
// 3.1.8. ĐẶT LỊCH HỘ (Receptionist Booking)
// =====================================================================

/**
 * @swagger
 * /api/appointments/book-by-staff:
 *   post:
 *     summary: Lễ tân đặt lịch khám hộ cho bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CREATE.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Lễ tân / nhân viên đặt lịch thay cho bệnh nhân.
 *       - `booking_channel` mặc định = `DIRECT_CLINIC` nếu không truyền.
 *       - Audit log ghi nhận `changed_by` = ID nhân viên đặt hộ.
 *       - `staff_notes` cho phép nhân viên ghi chú thêm (VD: BN VIP, ưu tiên phòng riêng).
 *       - Tái sử dụng toàn bộ validation + conflict check của `POST /api/appointments`.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - appointment_date
 *             properties:
 *               patient_id:
 *                 type: string
 *                 description: ID bệnh nhân
 *                 example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *               appointment_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày khám
 *                 example: "2026-03-20"
 *               booking_channel:
 *                 type: string
 *                 enum: [DIRECT_CLINIC, HOTLINE]
 *                 description: "Kênh đặt (mặc định DIRECT_CLINIC)"
 *                 example: "DIRECT_CLINIC"
 *               reason_for_visit:
 *                 type: string
 *                 description: Lý do khám
 *                 example: "Bệnh nhân gọi điện yêu cầu tái khám"
 *               symptoms_notes:
 *                 type: string
 *                 description: Ghi chú triệu chứng
 *                 example: "Đau lưng kéo dài"
 *               doctor_id:
 *                 type: string
 *                 example: "DOC_2603_abc12345"
 *               slot_id:
 *                 type: string
 *                 example: "SLT_2603_abc12345"
 *               room_id:
 *                 type: string
 *                 example: "RM_HCM_N101"
 *               facility_service_id:
 *                 type: string
 *                 example: "FSRV_KHAMNOI"
 *               staff_notes:
 *                 type: string
 *                 description: Ghi chú nội bộ của nhân viên
 *                 example: "BN là VIP, ưu tiên phòng riêng"
 *     responses:
 *       201:
 *         description: Đặt lịch hộ thành công
 *       400:
 *         description: Thiếu dữ liệu / Slot đầy / Trùng lịch
 *       404:
 *         description: Bệnh nhân / Bác sĩ / Slot không tồn tại
 */
appointmentRoutes.post(
    '/book-by-staff',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.bookByStaff
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Xem chi tiết một lịch khám (kèm Audit Trail)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về toàn bộ thông tin lịch khám bao gồm JOIN bên ngoài (Bệnh nhân, BS, Phòng, DV, Slot).
 *       - Kèm theo mảng `audit_logs`: Lịch sử tất cả thay đổi trạng thái, gán bác sĩ, gán phòng, gán dịch vụ.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch khám
 *         example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Lấy chi tiết lịch khám thành công
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
 *                 audit_logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       appointment_audit_logs_id:
 *                         type: string
 *                       old_status:
 *                         type: string
 *                       new_status:
 *                         type: string
 *                       action_note:
 *                         type: string
 *                       changed_by_name:
 *                         type: string
 *                       created_at:
 *                         type: string
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentRoutes.get(
    '/:id',
    [verifyAccessToken, checkSessionStatus],
    AppointmentController.getById
);
