import { Request, Response, NextFunction } from 'express';
import { DepartmentSpecialtyService } from '../../services/Facility Management/department-specialty.service';
import { AssignDepartmentSpecialtiesInput } from '../../models/Facility Management/department-specialty.model';

export class DepartmentSpecialtyController {
    /**
     * Lấy danh sách chuyên khoa thuộc 1 phòng ban
     */
    static async getSpecialtiesByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { departmentId } = req.params as { departmentId: string };
            const data = await DepartmentSpecialtyService.getSpecialtiesByDepartmentId(departmentId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách chuyên khoa theo chi nhánh
     */
    static async getSpecialtiesByBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { branchId } = req.params as { branchId: string };
            const data = await DepartmentSpecialtyService.getSpecialtiesByBranchId(branchId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách chuyên khoa theo cơ sở
     */
    static async getSpecialtiesByFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { facilityId } = req.params as { facilityId: string };
            const data = await DepartmentSpecialtyService.getSpecialtiesByFacilityId(facilityId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán danh sách chuyên khoa vào phòng ban (Replace strategy)
     */
    static async assignSpecialties(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { departmentId } = req.params as { departmentId: string };
            const input: AssignDepartmentSpecialtiesInput = req.body;

            const result = await DepartmentSpecialtyService.assignSpecialties(departmentId, input.specialty_ids);

            res.status(200).json({
                success: true,
                message: `Đã gán ${result.assigned} chuyên khoa cho phòng ban thành công.`,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gỡ 1 chuyên khoa khỏi phòng ban
     */
    static async removeSpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { departmentId, specialtyId } = req.params as { departmentId: string; specialtyId: string };

            await DepartmentSpecialtyService.removeSpecialty(departmentId, specialtyId);

            res.status(200).json({
                success: true,
                message: 'Đã gỡ chuyên khoa khỏi phòng ban thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
