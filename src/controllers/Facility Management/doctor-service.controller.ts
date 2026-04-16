import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DoctorServiceLogic } from '../../services/Facility Management/doctor-service.service';
import { DoctorRepository } from '../../repository/Facility Management/doctor.repository';
import { AssignDoctorServicesInput } from '../../models/Facility Management/doctor-service.model';

export class DoctorServiceController {
    /**
     * Lấy danh sách bác sĩ đang hoạt động (is_active = true) từ bảng doctors.
     */
    static getActiveDoctors = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DoctorRepository.getActiveDoctors();
            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy danh sách dịch vụ được gán cho bác sĩ
     */
    static getServicesByDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { doctorId } = req.params as { doctorId: string };
            const data = await DoctorServiceLogic.getServicesByDoctorId(doctorId);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Lấy danh sách bác sĩ thực hiện 1 dịch vụ cơ sở
     */
    static getDoctorsByFacilityService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { facilityServiceId } = req.params as { facilityServiceId: string };
            const data = await DoctorServiceLogic.getDoctorsByFacilityServiceId(facilityServiceId);

            res.status(200).json({
                success: true,
                data
            });
    });

    /**
     * Gán danh sách dịch vụ cơ sở cho bác sĩ (Replace strategy)
     */
    static assignServices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { doctorId } = req.params as { doctorId: string };
            const input: AssignDoctorServicesInput = req.body;
            const userId = (req as any).user?.userId || '';

            const result = await DoctorServiceLogic.assignServices(
                doctorId,
                input.facility_service_ids,
                input.is_primary ?? true,
                userId
            );

            res.status(200).json({
                success: true,
                message: `Đã gán ${result.assigned} dịch vụ cho bác sĩ thành công.`,
                ...result
            });
    });

    /**
     * Gỡ 1 dịch vụ khỏi bác sĩ
     */
    static removeService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { doctorId, facilityServiceId } = req.params as { doctorId: string; facilityServiceId: string };

            await DoctorServiceLogic.removeService(doctorId, facilityServiceId);

            res.status(200).json({
                success: true,
                message: 'Đã gỡ dịch vụ khỏi bác sĩ thành công.'
            });
    });
}
