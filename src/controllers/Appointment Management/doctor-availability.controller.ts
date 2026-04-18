import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DoctorAvailabilityService } from '../../services/Appointment Management/doctor-availability.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DOCTOR_AVAILABILITY_SUCCESS } from '../../constants/doctor-availability.constant';

/**
 * Controller API xem lịch khả dụng bác sĩ (read-only).
 */
export class DoctorAvailabilityController {

    /**
     * GET /api/doctor-availability/:doctorId — Lịch làm việc tổng hợp
     */
    static getDoctorSchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const doctorId = req.params.doctorId as string;
            const startDate = req.query.start_date as string;
            const endDate = req.query.end_date as string;

            const data = await DoctorAvailabilityService.getDoctorSchedule(doctorId, startDate, endDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.SCHEDULE_FETCHED,
                data,
            });
    });

    /**
     * GET /api/doctor-availability/:doctorId/conflicts — Kiểm tra xung đột
     */
    static checkConflicts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const doctorId = req.params.doctorId as string;
            const workingDate = req.query.working_date as string;
            const shiftId = req.query.shift_id as string;

            const result = await DoctorAvailabilityService.checkConflicts(doctorId, workingDate, shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.CONFLICT_CHECKED,
                data: result,
            });
    });

    /**
     * GET /api/doctor-availability/by-specialty/:specialtyId — BS theo chuyên khoa
     */
    static getDoctorsBySpecialty = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const specialtyId = req.params.specialtyId as string;
            const date = req.query.date as string;
            const shiftId = req.query.shift_id as string | undefined;

            const data = await DoctorAvailabilityService.getDoctorsBySpecialty(specialtyId, date, shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.BY_SPECIALTY_FETCHED,
                data,
            });
    });

    /**
     * GET /api/doctor-availability/by-date/:date — Tổng quan ngày
     */
    static getDoctorOverviewByDate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.params.date as string;

            const data = await DoctorAvailabilityService.getDoctorOverviewByDate(date);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.BY_DATE_FETCHED,
                data,
            });
    });

    /**
     * GET /api/doctor-availability/:doctorId/facilities — Lịch đa cơ sở
     */
    static getDoctorMultiFacilitySchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const doctorId = req.params.doctorId as string;
            const startDate = req.query.start_date as string;
            const endDate = req.query.end_date as string;

            const data = await DoctorAvailabilityService.getDoctorMultiFacilitySchedule(doctorId, startDate, endDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.FACILITIES_FETCHED,
                data,
            });
    });
}
