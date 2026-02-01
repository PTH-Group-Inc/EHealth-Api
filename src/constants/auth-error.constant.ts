export const AUTH_ERRORS = {
    INVALID_INPUT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Thiếu thông tin đăng nhập',
    },

    INVALID_EMAIL_FORMAT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Email không đúng định dạng',
    },

    INVALID_PHONE_FORMAT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Số điện thoại không đúng định dạng',
    },

    INVALID_PASSWORD_FORMAT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Mật khẩu không hợp lệ',
    },
    INVALID_CREDENTIAL: {
        httpCode: 401,
        code: 'AUTH_002',
        message: 'Tài khoản hoặc mật khẩu không chính xác',
    },
    ACCOUNT_NOT_ACTIVE: {
        httpCode: 403,
        code: 'AUTH_003',
        message: 'Tài khoản đã bị khóa hoặc chưa kích hoạt',
    },
    INVALID_DEVICE: {
        httpCode: 400,
        code: 'AUTH_006',
        message: 'Thiết bị đăng nhập không hợp lệ',
    },
    UNAUTHORIZED: {
        httpCode: 401,
        code: 'AUTH_401',
        message: 'Không tồn tại quyền truy cập',
    },

    SESSION_NOT_FOUND: {
        httpCode: 404,
        code: 'AUTH_404',
        message: 'Session không tồn tại',
    },
} as const;