import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { RelationTypeService } from '../../services/Patient Management/relation-type.service';
import {
    CreateRelationTypeInput,
    UpdateRelationTypeInput
} from '../../models/Patient Management/relation-type.model';

export class RelationTypeController {
    /**
     * Lấy danh sách tất cả loại quan hệ
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await RelationTypeService.getAll();
            res.status(200).json({ success: true, data });
    });

    /**
     * Tạo mới loại quan hệ
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreateRelationTypeInput = req.body;
            const data = await RelationTypeService.create(input);
            res.status(201).json({
                success: true,
                message: 'Tạo loại quan hệ thành công.',
                data
            });
    });

    /**
     * Cập nhật loại quan hệ
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdateRelationTypeInput = req.body;
            const data = await RelationTypeService.update(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật loại quan hệ thành công.',
                data
            });
    });

    /**
     * Xóa loại quan hệ (soft delete)
     */
    static delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await RelationTypeService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa loại quan hệ thành công.'
            });
    });
}
