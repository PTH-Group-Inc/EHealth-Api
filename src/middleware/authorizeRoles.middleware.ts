import { Request, Response, NextFunction } from 'express';
import { AccountRole } from '../models/auth_account.model';

// Mở rộng interface Request để thêm thông tin auth
export interface AuthenticatedRequest extends Request {
    auth?: {
        account_id: string;
        role: string;
        sessionId: string;
        [key: string]: any;
    };
}

/**
 * Middleware kiểm tra quyền truy cập dựa trên Role.
 */
export const authorizeRoles = (...allowedRoles: AccountRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const auth = req.auth;

        // Kiểm tra xem auth đã được xác thực chưa
        if (!auth || !auth.role) {
            return res.status(401).json({
                success: false,
                error_code: 'UNAUTHORIZED_ROLE',
                message: 'Không tìm thấy thông tin quyền hạn của người dùng.'
            });
        }

        // Kiểm tra role của user có nằm trong danh sách cho phép không
        if (!allowedRoles.includes(auth.role as AccountRole)) {
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