// CLOUDINARY CONFIG
export const CLOUDINARY_CONFIG = {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    /** Tên thư mục mặc định lưu ảnh trên Cloudinary */
    DEFAULT_FOLDER: 'project_uploads',
    /** Giới hạn dung lượng file (5MB) */
    MAX_FILE_SIZE: 5 * 1024 * 1024,
} as const;

export const UPLOAD_MESSAGES = {
    FILE_MISSING: 'Không tìm thấy file tải lên.',
    INVALID_FORMAT: 'Chỉ cho phép định dạng hình ảnh!',
    UPLOAD_SUCCESS: 'Tải ảnh lên thành công!',
    UPLOAD_FAILED: 'Không thể tải ảnh lên hệ thống.',
} as const;

// SYSTEM ERRORS
export const SYSTEM_ERRORS = {
    FACILITY_NOT_FOUND: {
        httpCode: 404,
        code: 'SYS_001',
        message: 'Không tìm thấy thông tin cơ sở y tế.',
    },
    INVALID_IMAGE_FORMAT: {
        httpCode: 400,
        code: 'SYS_002',
        message: UPLOAD_MESSAGES.INVALID_FORMAT,
    },
    IMAGE_TOO_LARGE: {
        httpCode: 400,
        code: 'SYS_003',
        message: `File ảnh vượt quá giới hạn ${CLOUDINARY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    },
    UPLOAD_FAILED: {
        httpCode: 500,
        code: 'SYS_004',
        message: UPLOAD_MESSAGES.UPLOAD_FAILED,
    },
} as const;

// LOGO CONFIG
export const LOGO_CONFIG = {
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
    CLOUDINARY_FOLDER: 'ehealth/logos',
} as const;

// WORKING HOURS & SLOT CONFIG

/** Keys cố định dùng trong bảng system_settings cho slot config */
export const SLOT_CONFIG_KEYS = {
    DURATION_MINUTES: 'SLOT_DURATION_MINUTES',
    MAX_PATIENTS: 'SLOT_MAX_PATIENTS',
} as const;

/** Giá trị mặc định khi chưa có cấu hình slot trong DB */
export const DEFAULT_SLOT_CONFIG = {
    duration_minutes: 15,
    max_patients_per_slot: 1,
} as const;

/** Nhãn tiếng Việt cho từng ngày trong tuần */
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
};

export const WORKING_HOURS_ERRORS = {
    INVALID_TIME_RANGE: {
        httpCode: 400,
        code: 'SYS_WH_001',
        message: 'Giờ đóng cửa phải sau giờ mở cửa.',
    },
    INVALID_DAY_OF_WEEK: {
        httpCode: 400,
        code: 'SYS_WH_002',
        message: 'day_of_week phải là số nguyên từ 0 (Chủ nhật) đến 6 (Thứ 7).',
    },
    INVALID_SLOT_DURATION: {
        httpCode: 400,
        code: 'SYS_WH_003',
        message: 'Thời lượng slot phải là bội số của 5 và nằm trong khoảng 5–120 phút.',
    },
    INVALID_MAX_PATIENTS: {
        httpCode: 400,
        code: 'SYS_WH_004',
        message: 'Số bệnh nhân tối đa mỗi slot phải từ 1 đến 20.',
    },
} as const;

// BUSINESS RULES

/** Key chuẩn cho 8 business rules được quản lý qua API */
export const BUSINESS_RULE_KEYS = {
    CANCEL_APPOINTMENT_BEFORE_HOURS: 'CANCEL_APPOINTMENT_BEFORE_HOURS',
    MAX_BOOKING_PER_DAY_PER_PATIENT: 'MAX_BOOKING_PER_DAY_PER_PATIENT',
    MAX_ADVANCE_BOOKING_DAYS: 'MAX_ADVANCE_BOOKING_DAYS',
    MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY: 'MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY',
    ALLOW_PATIENT_SELF_CANCEL: 'ALLOW_PATIENT_SELF_CANCEL',
    MAX_LOGIN_ATTEMPTS: 'MAX_LOGIN_ATTEMPTS',
    LOCK_ACCOUNT_DURATION_MINUTES: 'LOCK_ACCOUNT_DURATION_MINUTES',
    REQUIRE_EMAIL_VERIFICATION: 'REQUIRE_EMAIL_VERIFICATION',
} as const;

/** Schema validation cho từng rule: type + range cho phép */
export const BUSINESS_RULE_SCHEMAS: Record<string, {
    type: 'number' | 'boolean';
    min?: number;
    max?: number;
}> = {
    CANCEL_APPOINTMENT_BEFORE_HOURS: { type: 'number', min: 1, max: 168 },
    MAX_BOOKING_PER_DAY_PER_PATIENT: { type: 'number', min: 1, max: 10 },
    MAX_ADVANCE_BOOKING_DAYS: { type: 'number', min: 1, max: 365 },
    MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY: { type: 'number', min: 1, max: 100 },
    ALLOW_PATIENT_SELF_CANCEL: { type: 'boolean' },
    MAX_LOGIN_ATTEMPTS: { type: 'number', min: 3, max: 20 },
    LOCK_ACCOUNT_DURATION_MINUTES: { type: 'number', min: 5, max: 1440 },
    REQUIRE_EMAIL_VERIFICATION: { type: 'boolean' },
};

export const BUSINESS_RULE_ERRORS = {
    RULE_NOT_FOUND: {
        httpCode: 404,
        code: 'SYS_BR_001',
        message: 'Quy định nghiệp vụ không tồn tại.',
    },
    INVALID_RULE_VALUE: {
        httpCode: 400,
        code: 'SYS_BR_002',
        message: 'Giá trị quy định không hợp lệ (sai type hoặc vượt ngoài giới hạn cho phép).',
    },
    INVALID_RULE_KEY: {
        httpCode: 400,
        code: 'SYS_BR_003',
        message: 'Khóa quy định không tồn tại hoặc không được phép chỉnh sửa qua API.',
    },
} as const;

// SECURITY SETTINGS (1.4.4)
/** Tất cả keys bảo mật – gồm 3 reuse từ 1.4.3 + 5 mới */
export const SECURITY_SETTING_KEYS = {
    MAX_LOGIN_ATTEMPTS: 'MAX_LOGIN_ATTEMPTS',
    LOCK_ACCOUNT_DURATION_MINUTES: 'LOCK_ACCOUNT_DURATION_MINUTES',
    REQUIRE_EMAIL_VERIFICATION: 'REQUIRE_EMAIL_VERIFICATION',
    PASSWORD_MIN_LENGTH: 'PASSWORD_MIN_LENGTH',
    SESSION_DURATION_DAYS: 'SESSION_DURATION_DAYS',
    REQUIRE_2FA_ROLES: 'REQUIRE_2FA_ROLES',
    ACCESS_TOKEN_EXPIRY_MINUTES: 'ACCESS_TOKEN_EXPIRY_MINUTES',
    REFRESH_TOKEN_EXPIRY_DAYS: 'REFRESH_TOKEN_EXPIRY_DAYS',
} as const;

/** Fallback mặc định khi key chưa có trong DB */
export const DEFAULT_SECURITY_CONFIG = {
    max_login_attempts: 7,
    lock_duration_minutes: 30,
    require_email_verification: true,
    password_min_length: 8,
    session_duration_days: 14,
    require_2fa_roles: [] as string[],
    access_token_expiry_minutes: 15,
    refresh_token_expiry_days: 14,
} as const;

export const SECURITY_SETTING_ERRORS = {
    INVALID_PASSWORD_LENGTH: {
        httpCode: 400,
        code: 'SYS_SEC_001',
        message: 'Độ dài mật khẩu tối thiểu phải từ 8–32 ký tự.',
    },
    INVALID_SESSION_DURATION: {
        httpCode: 400,
        code: 'SYS_SEC_002',
        message: 'Thời hạn phiên đăng nhập phải từ 1–365 ngày.',
    },
    INVALID_TOKEN_EXPIRY: {
        httpCode: 400,
        code: 'SYS_SEC_003',
        message: 'Thời hạn token phải từ 5–1440 phút (access) hoặc 1–365 ngày (refresh).',
    },
} as const;
