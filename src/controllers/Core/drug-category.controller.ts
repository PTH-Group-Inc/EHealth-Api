import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DrugCategoryService } from '../../services/Core/drug-category.service';
import { CreateDrugCategoryInput, UpdateDrugCategoryInput } from '../../models/Core/drug-category.model';

export class DrugCategoryController {
    /**
     * Lấy danh sách nhóm thuốc
     */
    static getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await DrugCategoryService.getCategories(search, page, limit);

            res.status(200).json({
                success: true,
                ...result
            });
    });

    /**
     * Lấy chi tiết 1 nhóm thuốc theo ID
     */
    static getCategoryById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await DrugCategoryService.getCategoryById(id);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Tạo mới một nhóm thuốc
     */
    static createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreateDrugCategoryInput = req.body;
            const data = await DrugCategoryService.createCategory(input);

            res.status(201).json({
                success: true,
                data
            });
    });

    /**
     * Cập nhật thông tin nhóm thuốc
     */
    static updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdateDrugCategoryInput = req.body;

            const data = await DrugCategoryService.updateCategory(id, input);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Xóa nhóm thuốc
     */
    static deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await DrugCategoryService.deleteCategory(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa nhóm danh mục thuốc thành công.'
            });
    });

    /**
     * Xuất danh sách nhóm thuốc ra file Excel
     */
    static exportCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const buffer = await DrugCategoryService.exportCategories();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Pharmacy_DrugCategories.xlsx');

            res.status(200).send(buffer);
    });

    /**
     * Nhập danh sách nhóm thuốc từ file Excel
     */
    static importCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error_code: 'FILE_MISSING',
                    message: 'Vui lòng đính kèm file Excel.'
                });
                return;
            }

            const result = await DrugCategoryService.importCategories(req.file.buffer);

            res.status(200).json({
                success: true,
                message: 'Đã xử lý file Excel thành công.',
                ...result
            });
    });
}
