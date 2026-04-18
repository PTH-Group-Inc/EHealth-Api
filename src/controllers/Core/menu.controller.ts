import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { MenuService } from '../../services/Core/menu.service';
import { CreateMenuInput, UpdateMenuInput, MenuQueryFilter } from '../../models/Core/menu.model';
import { AppError } from '../../utils/app-error.util';

export class MenuController {
    /**
     * Lấy danh sách toàn bộ Menu hệ thống
     */
    static getMenus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filter: MenuQueryFilter = {
                search: req.query.search as string,
                parent_id: req.query.parent_id as string,
                status: req.query.status as 'ACTIVE' | 'INACTIVE'
            };

            const menus = await MenuService.getAllMenus(filter);
            res.status(200).json({
                success: true,
                data: menus
            });
    });

    /**
     * Tạo mới Menu
     */
    static createMenu = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: CreateMenuInput = req.body;
            if (!input.code || !input.name) {
                throw new AppError(400, 'INVALID_INPUT', 'Vui lòng cung cấp mã code và tên Menu');
            }

            const menu = await MenuService.createMenu(input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Tạo Menu thành công',
                data: menu
            });
    });

    /**
     * Cập nhật Menu
     */
    static updateMenu = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: UpdateMenuInput = req.body;

            const menu = await MenuService.updateMenu(req.params.menuId as string, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật Menu thành công',
                data: menu
            });
    });

    /**
     * Xóa mềm Menu
     */
    static deleteMenu = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await MenuService.deleteMenu(req.params.menuId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Xóa Menu thành công'
            });
    });
}
