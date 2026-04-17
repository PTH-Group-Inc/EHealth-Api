import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { SpecialtyServiceLogic } from '../../services/Facility Management/specialty-service.service';
import { AssignSpecialtyServicesInput } from '../../models/Facility Management/specialty-service.model';

export class SpecialtyServiceController {
    /**
     * Lấy danh sách dịch vụ gán cho chuyên khoa
     */
    static getServicesBySpecialty = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { specialtyId } = req.params as { specialtyId: string };
            const { facilityId } = req.query as { facilityId?: string };
            const data = await SpecialtyServiceLogic.getServicesBySpecialtyId(specialtyId, facilityId);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Lấy danh sách chuyên khoa gán cho 1 dịch vụ
     */
    static getSpecialtiesByService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { serviceId } = req.params as { serviceId: string };
            const data = await SpecialtyServiceLogic.getSpecialtiesByServiceId(serviceId);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Gán danh sách dịch vụ vào chuyên khoa (Replace strategy)
     */
    static assignServices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { specialtyId } = req.params as { specialtyId: string };
            const input: AssignSpecialtyServicesInput = req.body;

            const result = await SpecialtyServiceLogic.assignServices(specialtyId, input.service_ids);

            res.status(200).json({
                success: true,
                message: `Đã gán ${result.assigned} dịch vụ cho chuyên khoa thành công.`,
                ...result
            });
    });

    /**
     * Gỡ 1 dịch vụ khỏi chuyên khoa
     */
    static removeService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { specialtyId, serviceId } = req.params as { specialtyId: string; serviceId: string };

            await SpecialtyServiceLogic.removeService(specialtyId, serviceId);

            res.status(200).json({
                success: true,
                message: 'Đã gỡ dịch vụ khỏi chuyên khoa thành công.'
            });
    });
}
