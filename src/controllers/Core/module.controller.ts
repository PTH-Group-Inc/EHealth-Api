import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { PermissionService } from '../../services/Core/permission.service';

export class ModuleController {
    /**
     * Lấy danh sách các Feature Module (Quyền hệ thống được gộp theo module)
     */
    static getModules = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const modules = await PermissionService.getDistinctModules();
            res.status(200).json({
                success: true,
                data: modules
            });
    });

    /**
     * Lấy danh sách Quyền của một Module cụ thể
     */
    static getPermissionsByModule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const moduleName = req.params.moduleName as string;

            // Tận dụng hàm getPermissions có sẵn của PermissionService kèm filter module
            const permissions = await PermissionService.getPermissions({ module: moduleName });

            res.status(200).json({
                success: true,
                data: permissions
            });
    });
}
