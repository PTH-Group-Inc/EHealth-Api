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
    }
} as const;