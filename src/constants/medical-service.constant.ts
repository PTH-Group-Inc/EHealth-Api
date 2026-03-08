/**
 * Mã lỗi cho Danh mục dịch vụ chuẩn
 */
export const SERVICE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'SRV_001',
        message: 'Không tìm thấy dịch vụ y tế chuẩn này.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'SRV_002',
        message: 'Mã dịch vụ y tế chuẩn (code) đã tồn tại. Vui lòng chọn mã khác.',
    },
};

/**
 * Mã lỗi cho Dịch vụ tại cơ sở
 */
export const FACILITY_SERVICE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'FSRV_001',
        message: 'Không tìm thấy cấu hình dịch vụ này tại cơ sở.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'FSRV_002',
        message: 'Dịch vụ chuẩn này đã được cấu hình giá tại cơ sở. Vui lòng cập nhật thay vì tạo mới.',
    },
    FACILITY_NOT_FOUND: {
        success: false,
        code: 'FSRV_003',
        message: 'Không tìm thấy cơ sở y tế này.',
    },
    DEPARTMENT_NOT_FOUND: {
        success: false,
        code: 'FSRV_004',
        message: 'Không tìm thấy phòng ban / khoa này.',
    },
};

export const SERVICE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
