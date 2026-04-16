import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { FacilityService } from '../../services/Facility Management/facility.service';
import { CreateFacilityInput, UpdateFacilityInfoInput, FacilityQuery } from '../../models/Facility Management/facility.model';

export class FacilityController {
    /**
     * Get list of facilities for dropdown
     */
    static getFacilitiesForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const facilities = await FacilityService.getFacilitiesForDropdown();
            res.status(200).json({
                success: true,
                data: facilities
            });
    });

    /**
     * Dành cho Admin: Lấy danh sách cơ sở y tế có phân trang
     */
    static getFacilities = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const query: FacilityQuery = {
                search: req.query.search as string,
                status: req.query.status as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            };
            const result = await FacilityService.getFacilities(query);
            res.status(200).json({
                success: true,
                data: result.facilities,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total_records: result.total,
                    total_pages: Math.ceil(result.total / query.limit)
                }
            });
    });

    /**
     * Dành cho Admin: Xem chi tiết 1 cơ sở y tế
     */
    static getFacilityById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const facility = await FacilityService.getFacilityById(id);
            res.status(200).json({
                success: true,
                data: facility
            });
    });

    /**
     * Dành cho Admin: Tạo mới cơ sở y tế (Hỗ trợ upload ảnh logo)
     */
    static createFacility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data: CreateFacilityInput = req.body;
            const file = req.file; // multer sẽ gán file vào đây
            const result = await FacilityService.createFacility(data, file);
            res.status(201).json({
                success: true,
                message: 'Tạo mới cơ sở y tế thành công',
                data: result
            });
    });

    /**
     * Dành cho Admin: Cập nhật thông tin cơ sở
     */
    static updateFacility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const data: UpdateFacilityInfoInput = req.body;
            const file = req.file;
            const result = await FacilityService.updateFacility(id, data, file);
            res.status(200).json({
                success: true,
                message: 'Cập nhật cơ sở y tế thành công',
                data: result
            });
    });

    /**
     * Dành cho Admin: Đổi trạng thái cơ sở
     */
    static changeFacilityStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const { status } = req.body;
            await FacilityService.changeFacilityStatus(id, status);
            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái cơ sở thành công'
            });
    });

    /**
     * Dành cho Admin: Xóa mềm cơ sở
     */
    static deleteFacility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            await FacilityService.deleteFacility(id);
            res.status(200).json({
                success: true,
                message: 'Xóa cơ sở y tế thành công'
            });
    });
}
