import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MasterDataService } from '../../services/Core/master-data.service';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Core/master-data.model';

export class MasterDataController {
    /**
     * Lấy danh sách nhóm danh mục nền
     */
    static getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await MasterDataService.getCategories(search, page, limit);

            res.status(200).json({
                success: true,
                ...result // Trải phẳng data, total, page, limit, totalPages ra ngoài
            });
    });

    /**
     * Lấy chi tiết 1 nhóm danh mục theo ID
     */
    static getCategoryById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await MasterDataService.getCategoryById(id);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Tạo mới một nhóm danh mục
     */
    static createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreateCategoryInput = req.body;
            const data = await MasterDataService.createCategory(input);

            res.status(201).json({
                success: true,
                data
            });
    });

    /**
     * Cập nhật thông tin nhóm danh mục (Partial Update)
     */
    static updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdateCategoryInput = req.body;

            const data = await MasterDataService.updateCategory(id, input);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Xóa mềm nhóm danh mục
     */
    static deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await MasterDataService.deleteCategory(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa nhóm danh mục thành công.'
            });
    });

    /**
     * Xuất danh sách nhóm danh mục ra file Excel
     */
    static exportCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const buffer = await MasterDataService.exportCategories();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=MasterData_Categories.xlsx');

            res.status(200).send(buffer);
    });

    /**
     * Nhập danh sách nhóm danh mục từ file Excel
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

            const result = await MasterDataService.importCategories(req.file.buffer);

            res.status(200).json({
                success: true,
                message: 'Đã xử lý file Excel thành công.',
                ...result
            });
    });
}