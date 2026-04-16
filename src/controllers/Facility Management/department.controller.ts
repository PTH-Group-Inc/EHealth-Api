import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DepartmentService } from '../../services/Facility Management/department.service';
import { DEPARTMENT_MESSAGES } from '../../constants/department.constant';

export class DepartmentController {
    static getDepartments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page?.toString() || '1');
            const limit = parseInt(req.query.limit?.toString() || '10');
            const search = req.query.search?.toString();
            const branch_id = req.query.branch_id?.toString();
            const status = req.query.status?.toString();

            const result = await DepartmentService.getDepartments({ page, limit, search, branch_id, status });

            res.status(200).json({
                success: true,
                data: {
                    items: result.data,
                    pagination: {
                        page,
                        limit,
                        total_records: result.total,
                        total_pages: Math.ceil(result.total / limit)
                    }
                }
            });
    });

    static getDepartmentsForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branch_id = req.query.branch_id?.toString() || '';
            const result = await DepartmentService.getDepartmentsForDropdown(branch_id);
            res.status(200).json({
                success: true,
                data: result
            });
    });

    static getDepartmentById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id?.toString();
            if (!id) throw new Error("ID Khoa/Phòng ban lả bắt buộc");
            const result = await DepartmentService.getDepartmentById(id);
            res.status(200).json({
                success: true,
                data: result
            });
    });

    static createDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branchData = req.body;
            const result = await DepartmentService.createDepartment(branchData);
            res.status(201).json({
                success: true,
                message: DEPARTMENT_MESSAGES.CREATE_SUCCESS,
                data: result
            });
    });

    static updateDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id?.toString();
            if (!id) throw new Error("ID Khoa/Phòng ban lả bắt buộc");
            const updates = req.body;
            const result = await DepartmentService.updateDepartment(id, updates);
            res.status(200).json({
                success: true,
                message: DEPARTMENT_MESSAGES.UPDATE_SUCCESS,
                data: result
            });
    });

    static changeDepartmentStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id?.toString();
            if (!id) throw new Error("ID Khoa/Phòng ban lả bắt buộc");
            const status = req.body.status;
            await DepartmentService.changeDepartmentStatus(id, status);
            res.status(200).json({
                success: true,
                message: DEPARTMENT_MESSAGES.STATUS_UPDATE_SUCCESS
            });
    });

    static deleteDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id?.toString();
            if (!id) throw new Error("ID Khoa/Phòng ban lả bắt buộc");
            await DepartmentService.deleteDepartment(id);
            res.status(200).json({
                success: true,
                message: DEPARTMENT_MESSAGES.DELETE_SUCCESS
            });
    });
}
