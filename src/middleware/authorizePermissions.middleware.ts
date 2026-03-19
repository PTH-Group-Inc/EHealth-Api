import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authorizeRoles.middleware';

/**
 * Middleware kiểm tra quyền truy cập dựa trên mã API Permissions 
 */
export const authorizePermissions = (...requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const auth = req.auth;

        // Bắt buộc phải có token và được verify trước
        if (!auth || !auth.permissions || !Array.isArray(auth.permissions)) {
            return res.status(401).json({
                success: false,
                error_code: 'UNAUTHORIZED_PERMISSION',
                message: 'Không tìm thấy thông tin quyền hạn của người dùng.'
            });
        }


        // Nếu hệ thống muốn mở khóa toàn bộ cho rỗng role ADMIN, có thể uncomment dòng này:
        /*
        if (auth.roles.includes('ADMIN')) {
            return next();
        }
        */

        // Request này không yêu cầu quyền gì cả
        if (requiredPermissions.length === 0) {
            return next();
        }

        // Kiểm tra xem User có ÍT NHẤT MỘT trong những quyền yêu cầu không
        const hasPermission = auth.permissions.some((code: string) => requiredPermissions.includes(code));

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error_code: 'FORBIDDEN_ACCESS',
                message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu một trong các quyền: ${requiredPermissions.join(', ')}`
            });
        }

        // Hợp lệ 
        next();
    };
};
