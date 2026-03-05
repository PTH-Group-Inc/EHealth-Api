"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
/**
 * Middleware kiểm tra quyền truy cập dựa trên mảng Roles.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const auth = req.auth;
        // Kiểm tra
        if (!auth || !auth.roles || !Array.isArray(auth.roles)) {
            return res.status(401).json({
                success: false,
                error_code: 'UNAUTHORIZED_ROLE',
                message: 'Không tìm thấy thông tin quyền hạn của người dùng.'
            });
        }
        // Kiểm tra xem roles của user
        const hasPermission = auth.roles.some((role) => allowedRoles.includes(role));
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error_code: 'FORBIDDEN_ACCESS',
                message: 'Bạn không có quyền thực hiện thao tác này.'
            });
        }
        // Hợp lệ 
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
