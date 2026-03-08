import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.util';
import { AuthenticatedRequest } from '../middleware/verifyAccessToken.middleware';

export const verifyApiPermission = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const userRoles = authReq.auth?.roles; // Mảng role code từ JWT Payload: ['ADMIN', 'DOCTOR']

        if (!userRoles || userRoles.length === 0) {
            return next(new AppError(403, 'FORBIDDEN_API_ACCESS', 'Bạn không có vai trò nào được gán để truy cập API này'));
        }

        // Lấy HTTP Method và Path hiện tại
        const method = req.method;

        // baseUrl: (VD: /api/users), path: (VD: /:id) -> Tái tạo lại route definition if available
        // Nếu dùng Req.path, nó sẽ là URL thực tế (VD: /api/users/123).
        // URLPattern sẽ nhận /api/users/123 và khớp với pattern /api/users/:id trong Cache
        const requestPath = req.originalUrl.split('?')[0];

        const hasAccess = ApiPermissionCache.checkAccess(userRoles, method, requestPath);

        if (!hasAccess) {
            return next(
                new AppError(
                    403,
                    'FORBIDDEN_API_ACCESS',
                    `Vai trò của bạn không có quyền thực hiện phương thức ${method} tới đường dẫn này`
                )
            );
        }

        next();
    } catch (error) {
        next(new AppError(500, 'API_GUARD_ERROR', 'Lỗi hệ thống khi phân giải quyền API'));
    }
};
