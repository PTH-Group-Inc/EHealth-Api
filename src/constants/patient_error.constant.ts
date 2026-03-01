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
    INVALID_FILTER_STATUS: {
        httpCode: 400,
        code: 'PATIENT_INVALID_FILTER_STATUS',
        message: 'Giá trị lọc trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE, INACTIVE, DECEASED.',
    },
    INVALID_FILTER_GENDER: {
        httpCode: 400,
        code: 'PATIENT_INVALID_FILTER_GENDER',
        message: 'Giá trị lọc giới tính không hợp lệ.',
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
    MISSING_PHONE_NUMBER: {
        httpCode: 400,
        code: 'PATIENT_MISSING_PHONE_NUMBER',
        message: 'Bắt buộc phải cung cấp số điện thoại liên lạc của bệnh nhân.',
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
    },
    LINK_FAILED: {
        httpCode: 400,
        code: 'LINK_FAILED',
        message: 'Thông tin xác minh không khớp hoặc hồ sơ không khả dụng để liên kết.',
    },
    ACCOUNT_ALREADY_LINKED: {
        httpCode: 409,
        code: 'ACCOUNT_ALREADY_LINKED',
        message: 'Tài khoản này đã được liên kết với một hồ sơ bệnh nhân khác. Mỗi tài khoản chỉ được liên kết 1 hồ sơ duy nhất.',
    },
    DECEASED_LOCKED: {
        httpCode: 409,
        code: 'PATIENT_DECEASED_LOCKED',
        message: 'Không thể sửa thông tin hành chính của hồ sơ đã báo tử.',
    },
    INVALID_STATUS: {
        httpCode: 400,
        code: 'PATIENT_INVALID_STATUS',
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE, INACTIVE, DECEASED.',
    },
    MISSING_STATUS_REASON: {
        httpCode: 400,
        code: 'PATIENT_MISSING_STATUS_REASON',
        message: 'Vui lòng nhập lý do khi chuyển trạng thái sang ngưng hoạt động hoặc tử vong.',
    },
    CONSTRAINT_VIOLATION: {
        httpCode: 409,
        code: 'PATIENT_CONSTRAINT_VIOLATION',
        message: 'Không thể khóa! Hồ sơ đang có lịch hẹn chờ khám hoặc nợ viện phí chưa thanh toán.',
    },
    EMPTY_PAYLOAD: {
        httpCode: 400,
        code: 'PATIENT_EMPTY_PAYLOAD',
        message: 'Không có dữ liệu hợp lệ để cập nhật.',
    },
    CONTACT_NOT_FOUND: {
        httpCode: 404,
        code: 'PATIENT_CONTACT_NOT_FOUND',
        message: 'Không tìm thấy thông tin liên hệ chính để cập nhật.',
    },
    PHONE_CONFLICT: {
        httpCode: 409,
        code: 'PATIENT_PHONE_CONFLICT',
        message: 'Số điện thoại này đã được sử dụng bởi một hồ sơ khác.',
    },
    DECEASED_LOCKED_CONTACT: {
        httpCode: 409,
        code: 'PATIENT_DECEASED_LOCKED_CONTACT',
        message: 'Không thể cập nhật liên hệ cho bệnh nhân đã báo tử.',
    },
    MISSING_FIELDS: {
        httpCode: 400,
        code: 'PATIENT_MISSING_FIELDS',
        message: 'Họ tên, Mối quan hệ và Số điện thoại là bắt buộc.',
    },
    INVALID_RELATIONSHIP: {
        httpCode: 400,
        code: 'PATIENT_INVALID_RELATIONSHIP',
        message: 'Mối quan hệ không hợp lệ.',
    },
    DECEASED_LOCKED_RELATION: {
        httpCode: 409,
        code: 'PATIENT_DECEASED_LOCKED_RELATION',
        message: 'Không thể thêm người nhà cho bệnh nhân đã báo tử.',
    },
    STATUS_UNCHANGED: {
        httpCode: 200,
        code: 'PATIENT_STATUS_UNCHANGED',
        message: 'Trạng thái không có sự thay đổi.',
    },
    DECEASED_STATUS_LOCKED: {
        httpCode: 409,
        code: 'PATIENT_DECEASED_STATUS_LOCKED',
        message: 'Không thể thay đổi trạng thái của hồ sơ bệnh nhân đã báo tử.',
    }
} as const;