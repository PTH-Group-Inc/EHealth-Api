import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { BranchService } from '../../services/Facility Management/branch.service';
import { CreateBranchInput, UpdateBranchInput, BranchQuery } from '../../models/Facility Management/branch.model';

export class BranchController {
    /**
     * Get list of branches for dropdown (ACTIVE only)
     */
    static getBranchesForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branches = await BranchService.getBranchesForDropdown();
            res.status(200).json({
                success: true,
                data: branches
            });
    });

    /**
     * Dành cho Admin: Lấy danh sách chi nhánh phân trang bộ lọc
     */
    static getBranches = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const query: BranchQuery = {
                search: req.query.search as string,
                facility_id: req.query.facility_id as string,
                status: req.query.status as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            };
            const result = await BranchService.getBranches(query);
            res.status(200).json({
                success: true,
                data: result.branches,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total_records: result.total,
                    total_pages: Math.ceil(result.total / query.limit)
                }
            });
    });

    /**
     * Xem chi tiết 1 chi nhánh
     */
    static getBranchById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const branch = await BranchService.getBranchById(id);
            res.status(200).json({
                success: true,
                data: branch
            });
    });

    /**
     * Tạo chi nhánh mới
     */
    static createBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data: CreateBranchInput = req.body;
            const result = await BranchService.createBranch(data);
            res.status(201).json({
                success: true,
                message: 'Tạo mới chi nhánh thành công',
                data: result
            });
    });

    /**
     * Cập nhật thông tin chi nhánh
     */
    static updateBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const data: UpdateBranchInput = req.body;
            const result = await BranchService.updateBranch(id, data);
            res.status(200).json({
                success: true,
                message: 'Cập nhật chi nhánh thành công',
                data: result
            });
    });

    /**
     * Đổi trạng thái chi nhánh
     */
    static changeBranchStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const { status } = req.body;
            await BranchService.changeBranchStatus(id, status);
            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái chi nhánh thành công'
            });
    });

    /**
     * Xóa mềm chi nhánh
     */
    static deleteBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            await BranchService.deleteBranch(id);
            res.status(200).json({
                success: true,
                message: 'Xóa chi nhánh y tế thành công'
            });
    });
}
