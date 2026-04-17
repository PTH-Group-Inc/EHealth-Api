import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { PermissionService } from '../../services/Core/permission.service';
import { CreatePermissionInput, UpdatePermissionInput, PermissionQueryFilter } from '../../models/Core/permission.model';
import { AppError } from '../../utils/app-error.util';

export class PermissionController {
    /**
     * Lấy danh sách Quyền hạn
     */
    static getPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filter: PermissionQueryFilter = {
                search: req.query.search as string,
                module: req.query.module as string
            };

            const permissions = await PermissionService.getPermissions(filter);
            res.status(200).json({
                success: true,
                data: permissions
            });
    });

    /**
     * Lấy chi tiết Quyền hạn
     */
    static getPermissionById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const permission = await PermissionService.getPermissionById(req.params.permissionId as string);
            res.status(200).json({
                success: true,
                data: permission
            });
    });

    /**
     * Tạo Quyền mới
     */
    static createPermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: CreatePermissionInput = {
                code: req.body.code,
                module: req.body.module,
                description: req.body.description
            };

            const newPermission = await PermissionService.createPermission(input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Tạo quyền mới thành công',
                data: newPermission
            });
    });

    /**
     * Cập nhật Quyền hạn
     */
    static updatePermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: UpdatePermissionInput = {
                module: req.body.module,
                description: req.body.description
            };

            const updatedPermission = await PermissionService.updatePermission(req.params.permissionId as string, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật quyền thành công',
                data: updatedPermission
            });
    });

    /**
     * Xóa Quyền
     */
    static deletePermission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await PermissionService.deletePermission(req.params.permissionId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Xóa quyền thành công'
            });
    });
}
