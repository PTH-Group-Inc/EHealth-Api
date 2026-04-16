import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MasterDataItemService } from '../../services/Core/master-data-item.service';
import { CreateItemInput, UpdateItemInput } from '../../models/Core/master-data-item.model';

export class MasterDataItemController {
    /**
     * Lấy danh sách items có phân trang (Admin)
     */
    static getItems = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string | undefined;
            const categoryCode = req.query.categoryCode as string | undefined;
            const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
            const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);

            const result = await MasterDataItemService.getItems(search, categoryCode, page, limit);

            res.status(200).json({
                success: true,
                ...result
            });
    });

    /**
     * Lấy danh sách items đang active của một nhóm danh mục
     */
    static getActiveItemsByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { categoryCode } = req.params as { categoryCode: string };
            const data = await MasterDataItemService.getActiveItemsByCategory(categoryCode);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Lấy chi tiết 1 item theo ID
     */
    static getItemById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await MasterDataItemService.getItemById(id);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Tạo mới một item thuộc một category
     */
    static createItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { categoryCode } = req.params as { categoryCode: string };
            const input: CreateItemInput = req.body;

            const data = await MasterDataItemService.createItem(categoryCode, input);

            res.status(201).json({
                success: true,
                data
            });
    });

    /**
     * Cập nhật thông tin item
     */
    static updateItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdateItemInput = req.body;

            const data = await MasterDataItemService.updateItem(id, input);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Xóa mềm item
     */
    static deleteItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await MasterDataItemService.deleteItem(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa (vô hiệu hóa) chi tiết danh mục thành công.'
            });
    });

    /**
     * Xuất danh sách items của 1 nhóm danh mục ra file Excel
     */
    static exportItems = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { categoryCode } = req.params as { categoryCode: string };
            const buffer = await MasterDataItemService.exportItems(categoryCode);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=MasterData_Items_${categoryCode}.xlsx`);

            res.status(200).send(buffer);
    });

    /**
     * Nhập danh sách items cho 1 nhóm danh mục từ file Excel
     */
    static importItems = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { categoryCode } = req.params as { categoryCode: string };

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error_code: 'FILE_MISSING',
                    message: 'Vui lòng đính kèm file Excel.'
                });
                return;
            }

            const result = await MasterDataItemService.importItems(categoryCode, req.file.buffer);

            res.status(200).json({
                success: true,
                message: 'Đã xử lý file Excel thành công.',
                ...result
            });
    });
}
