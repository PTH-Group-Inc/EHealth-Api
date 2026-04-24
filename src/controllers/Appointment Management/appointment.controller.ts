// src/controllers/Appointment Management/appointment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AppointmentService } from '../../services/Appointment Management/appointment.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    APPOINTMENT_ERRORS, APPOINTMENT_SUCCESS
} from '../../constants/appointment.constant';

/**
 * Controller tiếp nhận HTTP Request cho module Lịch khám.
 * Chỉ parse request → gọi Service → trả response. Không chứa business logic.
 */
export class AppointmentController {

    /**
     * POST /api/appointments — Đặt lịch khám mới
     */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, branch_id, shift_id, slot_id, appointment_date, booking_channel } = req.body;
            if (!patient_id || !branch_id || (!slot_id && !shift_id) || !appointment_date || !booking_channel) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS',
                    'Thiếu thông tin bắt buộc: patient_id, branch_id, slot_id, appointment_date, booking_channel');
            }
            const userId = (req as any).auth?.user_id;
            const appointment = await AppointmentService.createAppointment(req.body, userId);
            const { warning, ...appointmentData } = appointment;
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: warning
                    ? `${APPOINTMENT_SUCCESS.CREATED}. Lưu ý: ${warning}`
                    : APPOINTMENT_SUCCESS.CREATED,
                warning: warning || undefined,
                data: appointmentData
            });
    });

    /**
     * POST /api/appointments/pre-book — Đặt cọc lịch khám
     */
    static preBook = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, branch_id, shift_id, slot_id, appointment_date, booking_channel } = req.body;
            if (!patient_id || !branch_id || (!slot_id && !shift_id) || !appointment_date || !booking_channel) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS',
                    'Thiếu thông tin bắt buộc: patient_id, branch_id, slot_id, appointment_date, booking_channel');
            }
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentService.preBookAppointment(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Pre-book thành công, vui lòng thanh toán để xác nhận lịch khám.',
                warning: result.warning || undefined,
                data: result
            });
    });

    /**
     * GET /api/appointments — Danh sách lịch khám
     */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filters = {
                status: req.query.status?.toString(),
                patient_id: req.query.patient_id?.toString(),
                doctor_id: req.query.doctor_id?.toString(),
                room_id: req.query.room_id?.toString(),
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
                booking_channel: req.query.booking_channel?.toString(),
                date: req.query.date?.toString(),
                keyword: req.query.keyword?.toString(),
                facility_service_id: req.query.facility_service_id?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentService.getAppointments(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.LIST_FETCHED,
                data: result.data,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (filters.limit || 20))
                }
            });
    });

    /**
     * GET /api/appointments/my-appointments — Lịch khám của tôi (theo user đang đăng nhập)
     * Hỗ trợ lấy lịch từ tất cả hồ sơ BN liên kết với tài khoản.
     */
    static getMyAppointments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            if (!userId) {
                throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', 'Không xác định được người dùng');
            }
            const filters = {
                status: req.query.status?.toString(),
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
                patient_id: req.query.patient_id?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentService.getMyAppointments(userId, filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.MY_APPOINTMENTS_FETCHED,
                data: result.data,
                patient_id: result.patient_id,
                patient_ids: result.patient_ids,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (filters.limit || 20))
                }
            });
    });

    /**
     * GET /api/appointments/:id — Chi tiết lịch khám
     */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await AppointmentService.getAppointmentById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.DETAIL_FETCHED,
                data: result.appointment,
                audit_logs: result.auditLogs
            });
    });

    /**
     * PUT /api/appointments/:id — Cập nhật lịch khám
     */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.updateAppointment(req.params.id as string, req.body, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.UPDATED,
                data: updated
            });
    });

    /**
     * DELETE /api/appointments/:id — Huỷ lịch khám (soft cancel)
     */
    static cancel = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { cancellation_reason } = req.body;
            if (!cancellation_reason) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCELLATION_REASON', APPOINTMENT_ERRORS.MISSING_CANCELLATION_REASON);
            }
            const userId = (req as any).auth?.user_id;
            const userRoles = (req as any).auth?.roles || [];
            const cancelled = await AppointmentService.cancelAppointment(req.params.id as string, cancellation_reason, userId, userRoles);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.CANCELLED,
                data: cancelled
            });
    });

    /**
     * PATCH /api/appointments/:id/assign-doctor — Gán bác sĩ
     */
    static assignDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { doctor_id } = req.body;
            if (!doctor_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', APPOINTMENT_ERRORS.MISSING_DOCTOR_ID);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.assignDoctor(req.params.id as string, doctor_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.DOCTOR_ASSIGNED,
                data: updated
            });
    });

    /**
     * GET /api/appointments/doctor/:doctorId — Lịch của bác sĩ
     */
    static getByDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filters = {
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
            };
            const appointments = await AppointmentService.getAppointmentsByDoctor(req.params.doctorId as string, filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.LIST_FETCHED,
                data: appointments
            });
    });

    /**
     * PATCH /api/appointments/:id/assign-room — Gán phòng khám
     */
    static assignRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { room_id } = req.body;
            if (!room_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ROOM_ID', APPOINTMENT_ERRORS.MISSING_ROOM_ID);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.assignRoom(req.params.id as string, room_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.ROOM_ASSIGNED,
                data: updated
            });
    });

    /**
     * PATCH /api/appointments/:id/assign-service — Gán dịch vụ
     */
    static assignService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { facility_service_id } = req.body;
            if (!facility_service_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_ID', APPOINTMENT_ERRORS.MISSING_SERVICE_ID);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.assignService(req.params.id as string, facility_service_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.SERVICE_ASSIGNED,
                data: updated
            });
    });

    /**
     * GET /api/appointments/available-slots — Slot trống theo ngày
     */
    static getAvailableSlots = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const date = req.query.date?.toString();
            if (!date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', 'Thiếu tham số date');
            }
            const doctorId = req.query.doctor_id?.toString();
            const branchId = req.query.branch_id?.toString();
            const facilityId = req.query.facility_id?.toString();
            const slots = await AppointmentService.getAvailableSlots(date, doctorId, branchId, facilityId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.SLOTS_FETCHED,
                data: slots
            });
    });

    /**
     * PATCH /api/appointments/:id/reschedule — Đổi lịch khám
     */
    static reschedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { new_date, new_slot_id, reschedule_reason } = req.body;
            if (!new_date || !new_slot_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_RESCHEDULE_DATA', APPOINTMENT_ERRORS.MISSING_RESCHEDULE_DATA);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.rescheduleAppointment(req.params.id as string, new_date, new_slot_id, userId, reschedule_reason);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.RESCHEDULED,
                data: updated
            });
    });

    /**
     * POST /api/appointments/check-conflict — Kiểm tra trùng lịch
     */
    static checkConflict = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { date, slot_id, doctor_id, patient_id, room_id, exclude_appointment_id } = req.body;
            if (!date || !slot_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CONFLICT_DATA', APPOINTMENT_ERRORS.MISSING_CONFLICT_DATA);
            }
            const result = await AppointmentService.checkConflict({
                date, slot_id, doctor_id, patient_id, room_id, exclude_appointment_id
            });
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.CONFLICT_CHECKED,
                data: result
            });
    });

    /**
     * PATCH /api/appointments/:id/visit-reason — Cập nhật mục đích khám
     */
    static updateVisitReason = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { reason_for_visit, symptoms_notes } = req.body;
            if (reason_for_visit === undefined && symptoms_notes === undefined) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_VISIT_REASON', APPOINTMENT_ERRORS.MISSING_VISIT_REASON);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.updateVisitReason(req.params.id as string, reason_for_visit, symptoms_notes, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.VISIT_REASON_UPDATED,
                data: updated
            });
    });

    /**
     * GET /api/appointments/:id/visit-reason — Lấy thông tin mục đích khám
     */
    static getVisitReason = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await AppointmentService.getVisitReason(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.VISIT_REASON_FETCHED,
                data: result
            });
    });

    /**
     * GET /api/patients/:patientId/appointments — Lịch khám của bệnh nhân
     */
    static getByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                patient_id: patientId,
                status: req.query.status?.toString(),
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentService.getAppointments(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.PATIENT_APPOINTMENTS_FETCHED,
                data: result.data,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (filters.limit || 20))
                }
            });
    });

    /**
     * POST /api/patients/:patientId/appointments — Tạo lịch từ hồ sơ BN
     */
    static createByPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = { ...req.body, patient_id: patientId };
            if (!data.booking_channel) data.booking_channel = 'DIRECT_CLINIC';
            const userId = (req as any).auth?.user_id;
            const appointment = await AppointmentService.createAppointment(data, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: APPOINTMENT_SUCCESS.CREATED,
                data: appointment
            });
    });

    /**
     * POST /api/appointments/book-by-staff — Lễ tân đặt lịch hộ
     */
    static bookByStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, appointment_date, booking_channel } = req.body;
            if (!patient_id || !appointment_date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS', APPOINTMENT_ERRORS.MISSING_REQUIRED_FIELDS);
            }
            const staffUserId = (req as any).auth?.user_id;
            const staffNotes = req.body.staff_notes;
            const appointment = await AppointmentService.bookByStaff(req.body, staffUserId, staffNotes);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: APPOINTMENT_SUCCESS.BOOKED_BY_STAFF,
                data: appointment
            });
    });

    /**
     * GET /api/appointments/available-slots-by-department — Slot trống theo khoa
     */
    static getAvailableSlotsByDepartment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const department_id = req.query.department_id?.toString();
            const facility_id = req.query.facility_id?.toString();
            if (!department_id || !facility_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DEPARTMENT_FILTER',
                    APPOINTMENT_ERRORS.MISSING_DEPARTMENT_FILTER);
            }
            const start_date = req.query.start_date?.toString();
            const days = req.query.days ? parseInt(req.query.days.toString()) : undefined;

            const data = await AppointmentService.getAvailableSlotsByDepartment({
                department_id, facility_id, start_date, days
            });
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.DEPARTMENT_SLOTS_FETCHED,
                data
            });
    });
    static submitReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;
            const { rating, feedback } = req.body;

            if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_RATING', 'Điểm đánh giá phải từ 1 đến 5');
            }

            const data = await AppointmentService.submitReview(id as string, rating, (feedback as string) || '');

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Đánh giá lịch khám thành công',
                data
            });
    });

    /**
     * POST /api/appointments/pre-book
     */
    static preBook = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).auth?.user_id || 'system';
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        
        const result = await AppointmentService.preBookAppointment(req.body, userId, clientIP);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: result.warning
                ? `Tạo lịch và yêu cầu thanh toán thành công. Lưu ý: ${result.warning}`
                : 'Tạo lịch và yêu cầu thanh toán thành công.',
            warning: result.warning || undefined,
            data: result
        });
    });

    /**
     * POST /api/appointments/:id/regenerate-qr
     */
    static regenerateQR = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).auth?.user_id || 'system';
        // Note: id is explicitly cast from req.params.id to avoid string | string[] type issues
        const result = await AppointmentService.regenerateQR(req.params.id as string, userId);

        res.json({
            success: true,
            message: 'Tạo lại QR thanh toán thành công.',
            data: result
        });
    });

    /**
     * GET /api/appointments/:id/payment-status
     */
    static getPaymentStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const result = await AppointmentService.getPaymentStatus(req.params.id as string);

        res.json({
            success: true,
            message: 'Lấy trạng thái thanh toán thành công.',
            data: result
        });
    });
}
