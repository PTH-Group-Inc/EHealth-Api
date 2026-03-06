import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';

export class RoleController {
    /**
     * Get All Roles
     */
    static async getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const roles = await RoleService.getAllRoles();
            res.status(200).json({
                success: true,
                data: roles
            });
        } catch (error) {
            next(error);
        }
    }
}
