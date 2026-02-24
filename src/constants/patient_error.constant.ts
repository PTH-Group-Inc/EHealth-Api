export const PATIENT_ERROR_CODES = {
    INVALID_NAME: {
        httpCode: 400,
        code: 'PATIENT_INVALID_NAME',
        message: 'Họ tên không hợp lệ',
    },
    INVALID_DOB: {
        httpCode: 400,
        code: 'PATIENT_INVALID_DOB',
        message: 'Ngày sinh không hợp lệ',
    },
    INVALID_GENDER: {
        httpCode: 400,
        code: 'PATIENT_INVALID_GENDER',
        message: 'Giới tính không hợp lệ',
    },
    INVALID_PHONE: {
        httpCode: 400,
        code: 'PATIENT_INVALID_PHONE',
        message: 'SĐT không hợp lệ',
    },
    MISSING_IDENTITY_NUMBER: {
        httpCode: 400,
        code: 'PATIENT_MISSING_IDENTITY_NUMBER',
        message: 'Có identity_type nhưng thiếu identity_number',
    },
    DUPLICATE_STRONG: {
        httpCode: 409,
        code: 'PATIENT_DUPLICATE_STRONG',
        message: 'Bệnh nhân đã tồn tại trong hệ thống.',
    },
    VALIDATION_ERROR: {
        httpCode: 400,
        code: 'PATIENT_VALIDATION_ERROR',
        message: 'Lỗi validate tổng quát',
    },
    DATABASE_ERROR: {
        httpCode: 500,
        code: 'DATABASE_ERROR',
        message: 'Lỗi truy vấn cơ sở dữ liệu.',
    },
    DATABASE_INSERT_ERROR: {
        httpCode: 500,
        code: 'DATABASE_INSERT_ERROR',
        message: 'Lỗi khi tạo mới hồ sơ bệnh nhân trong cơ sở dữ liệu.',
    },
    PATIENT_NOT_FOUND: {
        httpCode: 404,
        code: 'PATIENT_NOT_FOUND',
        message: 'Không tìm thấy hồ sơ bệnh nhân.',
    },
    FORBIDDEN: {
        httpCode: 403,
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền cập nhật thông tin hành chính.',
    },
    CONFLICT_ERR: {
        httpCode: 409,
        code: 'CONFLICT_ERR',
        message: 'Số điện thoại đã được đăng ký cho bệnh nhân khác.',
    },
    TRANSACTION_FAILED: {
        httpCode: 500,
        code: 'TRANSACTION_FAILED',
        message: 'Lỗi đồng bộ dữ liệu khi cập nhật. Vui lòng thử lại.',
    }
} as const;