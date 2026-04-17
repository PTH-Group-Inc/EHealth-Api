import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { ApiPermissionService } from '../../services/Core/api-permission.service';
import { CreateApiPermissionInput, UpdateApiPermissionInput, ApiPermissionQueryFilter } from '../../models/Core/api-permission.model';
import { AppError } from '../../utils/app-error.util';

export class ApiPermissionController {
    /**
     * Lấy danh sách API Permissions
     */
    static getApiPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filter: ApiPermissionQueryFilter = {
                search: req.query.search as string,
                module: req.query.module as string,
                method: req.query.method as string,
                status: req.query.status as 'ACTIVE' | 'INACTIVE'
            };

            const apis = await ApiPermissionService.getAllApiPermissions(filter);
            res.status(200).json({
                success: true,
                data: apis
            });
    });

    /**
     * Tạo mới cấu hình API
     */
    static createApiPermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: CreateApiPermissionInput = req.body;
            if (!input.method || !input.endpoint) {
                throw new AppError(400, 'INVALID_INPUT', 'Yêu cầu điền đầy đủ Method và Endpoint');
            }

            const apiParam = await ApiPermissionService.createApiPermission(input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Tạo cấu hình định tuyến API thành công',
                data: apiParam
            });
    });

    /**
     * Cập nhật thông tin cấu hình API
     */
    static updateApiPermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: UpdateApiPermissionInput = req.body;
            const apiId = req.params.apiId as string;

            const apiParam = await ApiPermissionService.updateApiPermission(apiId, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật API Endpoint thành công',
                data: apiParam
            });
    });

    /**
     * Xóa thông tin API
     */
    static deleteApiPermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const apiId = req.params.apiId as string;

            await ApiPermissionService.deleteApiPermission(apiId, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Đã xóa API Endpoint cấu hình thành công'
            });
    });
}
