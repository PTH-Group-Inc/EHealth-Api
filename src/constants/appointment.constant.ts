/**
 * Hằng số cho Module Quản lý Lịch khám (Appointment Management)
 */

/** Trạng thái lịch khám */
export const APPOINTMENT_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CHECKED_IN: 'CHECKED_IN',
    IN_PROGRESS: 'IN_PROGRESS',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
    COMPLETED: 'COMPLETED',
} as const;

/** Các trạng thái coi là "đang hoạt động" (chưa bị huỷ/hoàn tất) */
export const ACTIVE_APPOINTMENT_STATUSES = [
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.CHECKED_IN,
    APPOINTMENT_STATUS.IN_PROGRESS,
];

/** Kênh đặt lịch */
export const BOOKING_CHANNEL = {
    APP: 'APP',
    WEB: 'WEB',
    HOTLINE: 'HOTLINE',
    DIRECT_CLINIC: 'DIRECT_CLINIC',
    ZALO: 'ZALO',
} as const;

/** Giá trị mặc định cho số bệnh nhân tối đa mỗi slot (nếu chưa cấu hình) */
export const DEFAULT_MAX_PATIENTS_PER_SLOT = 1;

/** Prefix cho mã lịch khám tự động */
export const APPOINTMENT_CODE_PREFIX = 'APP';

/** Trạng thái cho phép đổi lịch */
export const RESCHEDULABLE_STATUSES = [
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.CONFIRMED,
];

/** Loại xung đột lịch khám */
export const CONFLICT_TYPE = {
    DOCTOR: 'DOCTOR_CONFLICT',
    ROOM: 'ROOM_CONFLICT',
    PATIENT: 'PATIENT_CONFLICT',
} as const;

/** Thông báo lỗi */
export const APPOINTMENT_ERRORS = {
    NOT_FOUND: 'Lịch khám không tồn tại hoặc đã bị xoá',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại trong hệ thống',
    DOCTOR_NOT_FOUND: 'Bác sĩ không tồn tại hoặc không còn hoạt động',
    SLOT_NOT_FOUND: 'Khung giờ khám không tồn tại hoặc đã bị vô hiệu hoá',
    SLOT_FULL: 'Khung giờ này đã đầy, không thể đặt thêm bệnh nhân',
    ROOM_NOT_FOUND: 'Phòng khám không tồn tại hoặc đã ngừng hoạt động',
    SERVICE_NOT_FOUND: 'Dịch vụ không tồn tại hoặc đã ngừng cung cấp',
    ALREADY_CANCELLED: 'Lịch khám này đã bị huỷ trước đó',
    CANNOT_CANCEL_COMPLETED: 'Không thể huỷ lịch khám đã hoàn tất (COMPLETED)',
    MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc: patient_id, appointment_date, booking_channel',
    MISSING_CANCELLATION_REASON: 'Vui lòng cung cấp lý do huỷ lịch (cancellation_reason)',
    MISSING_DOCTOR_ID: 'Thiếu thông tin bác sĩ (doctor_id)',
    MISSING_ROOM_ID: 'Thiếu thông tin phòng khám (room_id)',
    MISSING_SERVICE_ID: 'Thiếu thông tin dịch vụ (facility_service_id)',
    INVALID_STATUS_TRANSITION: 'Không thể chuyển trạng thái lịch khám theo luồng này',
    INVALID_DATE: 'Ngày khám không hợp lệ (phải >= ngày hiện tại)',
    FACILITY_CLOSED: 'Cơ sở không hoạt động vào ngày này (ngày lễ hoặc ngày đóng cửa)',
    DOCTOR_NOT_AVAILABLE: 'Bác sĩ không có lịch làm việc vào ngày/ca này',
    RESCHEDULE_NOT_ALLOWED: 'Chỉ lịch khám ở trạng thái PENDING hoặc CONFIRMED mới được đổi lịch',
    MISSING_RESCHEDULE_DATA: 'Thiếu thông tin đổi lịch: new_date và new_slot_id',
    MISSING_CONFLICT_DATA: 'Thiếu thông tin kiểm tra: date và slot_id là bắt buộc',
    MISSING_VISIT_REASON: 'Vui lòng cung cấp ít nhất reason_for_visit hoặc symptoms_notes',
    CONFLICT_DOCTOR: 'Bác sĩ đã có lịch khám khác trong cùng khung giờ',
    CONFLICT_PATIENT: 'Bệnh nhân đã có lịch khám khác trong cùng khung giờ',
    CONFLICT_ROOM: 'Phòng khám đã đầy trong khung giờ này',
} as const;

/** Thông báo thành công */
export const APPOINTMENT_SUCCESS = {
    CREATED: 'Đặt lịch khám thành công',
    UPDATED: 'Cập nhật lịch khám thành công',
    CANCELLED: 'Huỷ lịch khám thành công',
    DOCTOR_ASSIGNED: 'Gán bác sĩ cho lịch khám thành công',
    ROOM_ASSIGNED: 'Gán phòng khám cho lịch khám thành công',
    SERVICE_ASSIGNED: 'Gán dịch vụ cho lịch khám thành công',
    LIST_FETCHED: 'Lấy danh sách lịch khám thành công',
    DETAIL_FETCHED: 'Lấy chi tiết lịch khám thành công',
    SLOTS_FETCHED: 'Lấy danh sách slot trống thành công',
    RESCHEDULED: 'Đổi lịch khám thành công',
    CONFLICT_CHECKED: 'Kiểm tra trùng lịch hoàn tất',
    VISIT_REASON_UPDATED: 'Cập nhật mục đích khám thành công',
    VISIT_REASON_FETCHED: 'Lấy thông tin mục đích khám thành công',
    BOOKED_BY_STAFF: 'Lễ tân đặt lịch khám hộ thành công',
    PATIENT_APPOINTMENTS_FETCHED: 'Lấy danh sách lịch khám của bệnh nhân thành công',
} as const;
