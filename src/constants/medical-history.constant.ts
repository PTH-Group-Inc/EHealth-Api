/**
 * Hằng số cho Module 2.2 — Quản lý Lịch sử khám & Điều trị (Medical History - Read-Only)
 */

/** Loại lượt khám */
export const ENCOUNTER_TYPE = {
    OUTPATIENT: 'OUTPATIENT',
    INPATIENT: 'INPATIENT',
    EMERGENCY: 'EMERGENCY',
    TELEMED: 'TELEMED',
} as const;

/** Trạng thái lượt khám */
export const ENCOUNTER_STATUS = {
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_FOR_RESULTS: 'WAITING_FOR_RESULTS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
} as const;

/** Loại chẩn đoán */
export const DIAGNOSIS_TYPE = {
    PRIMARY: 'PRIMARY',
    SECONDARY: 'SECONDARY',
    PRELIMINARY: 'PRELIMINARY',
    FINAL: 'FINAL',
} as const;

/** Mã lỗi */
export const MEDICAL_HISTORY_ERRORS = {
    ENCOUNTER_NOT_FOUND: {
        success: false,
        code: 'MH_001',
        message: 'Không tìm thấy lượt khám này.',
    },
    PATIENT_NOT_FOUND: {
        success: false,
        code: 'MH_002',
        message: 'Không tìm thấy hồ sơ bệnh nhân.',
    },
    INVALID_DATE_RANGE: {
        success: false,
        code: 'MH_003',
        message: 'Khoảng thời gian không hợp lệ (from phải trước to).',
    },
    PATIENT_PROFILE_NOT_LINKED: {
        success: false,
        code: 'MH_004',
        message: 'Tài khoản chưa được liên kết với hồ sơ bệnh nhân nào.',
    },
};

/** Thông báo thành công */
export const MEDICAL_HISTORY_SUCCESS = {
    MY_HISTORY_FETCHED: 'Lấy lịch sử khám bệnh của tôi thành công.',
};

/** Cấu hình phân trang */
export const MEDICAL_HISTORY_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    TIMELINE_DEFAULT_LIMIT: 50,
};
