import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleBookingService } from '../../services/Remote Consultation/tele-booking.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_BOOKING_SUCCESS, TELE_BOOKING_ERRORS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.2 — Đặt lịch tư vấn & khám từ xa
 * 12 handler chia 4 nhóm: Tìm BS & Slot, Đặt lịch, Thanh toán, Quản lý
 */
export class TeleBookingController {

    // ═══ NHÓM 1: Tìm BS & Slot ═══

    /** GET /booking/doctors — DS bác sĩ khả dụng */
    static getAvailableDoctors = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { specialty_id, facility_id, date, type_id, shift_id } = req.query;
            const doctors = await TeleBookingService.findAvailableDoctors({
                specialty_id: specialty_id as string,
                facility_id: facility_id as string,
                date: date as string,
                type_id: type_id as string | undefined,
                shift_id: shift_id as string | undefined,
            });
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.DOCTORS_FETCHED, data: doctors });
    });

    /** GET /booking/slots — DS khung giờ trống */
    static getAvailableSlots = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { date, doctor_id, shift_id } = req.query;
            const slots = await TeleBookingService.findAvailableSlots(
                date as string, doctor_id as string | undefined, shift_id as string | undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SLOTS_FETCHED, data: slots });
    });

    /** GET /booking/check-doctor — Kiểm tra chi tiết availability BS */
    static checkDoctorAvailability = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { doctor_id, date } = req.query;
            const data = await TeleBookingService.checkDoctorAvailability(doctor_id as string, date as string);
            if (!data) {
                res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: TELE_BOOKING_ERRORS.DOCTOR_NOT_FOUND.message });
                return;
            }
            res.status(HTTP_STATUS.OK).json({ success: true, data });
    });

    // ═══ NHÓM 2: Đặt lịch ═══

    /** POST /booking — Tạo phiên đặt lịch */
    static createBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const session = await TeleBookingService.createBooking(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_CREATED, data: session });
    });

    /** PUT /booking/:sessionId — Cập nhật phiên */
    static updateBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const session = await TeleBookingService.updateBooking(String(req.params.sessionId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_UPDATED, data: session });
    });

    /** POST /booking/:sessionId/confirm — Xác nhận phiên */
    static confirmBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const session = await TeleBookingService.confirmBooking(String(req.params.sessionId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_CONFIRMED, data: session });
    });

    /** POST /booking/:sessionId/cancel — Hủy phiên */
    static cancelBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const { cancellation_reason } = req.body;
            const session = await TeleBookingService.cancelBooking(String(req.params.sessionId), cancellation_reason || 'Không rõ lý do', userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_CANCELLED, data: session });
    });

    // ═══ NHÓM 3: Thanh toán ═══

    /** POST /booking/:sessionId/payment — Khởi tạo thanh toán */
    static initiatePayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleBookingService.initiatePayment(String(req.params.sessionId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.PAYMENT_INITIATED, data: result });
    });

    /** POST /booking/:sessionId/payment-callback — Callback thanh toán */
    static paymentCallback = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const session = await TeleBookingService.paymentCallback(String(req.params.sessionId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.PAYMENT_CONFIRMED, data: session });
    });

    // ═══ NHÓM 4: Tra cứu ═══

    /** GET /booking/:sessionId — Chi tiết phiên */
    static getBookingDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const session = await TeleBookingService.getBookingById(String(req.params.sessionId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: session });
    });

    /** GET /booking — Danh sách phiên (ADMIN/DOCTOR) */
    static listBookings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const filters = {
                patient_id: req.query.patient_id as string | undefined,
                doctor_id: req.query.doctor_id as string | undefined,
                specialty_id: req.query.specialty_id as string | undefined,
                facility_id: req.query.facility_id as string | undefined,
                type_id: req.query.type_id as string | undefined,
                status: req.query.status as string | undefined,
                payment_status: req.query.payment_status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                keyword: req.query.keyword as string | undefined,
                page: parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE,
                limit: Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT),
            };
            const result = await TeleBookingService.listBookings(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit } });
    });

    /** GET /booking/my-bookings — Lịch sử của BN đang đăng nhập */
    static getMyBookings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            // Lấy patientId từ query, nếu không có thì lấy profile mặc định
            let patientId = req.query.patientId as string | undefined;
            if (!patientId && req.query.patient_id) {
                patientId = req.query.patient_id as string;
            }
            if (!patientId) {
                const { pool } = require('../../config/postgresdb');
                const patientResult = await pool.query(`SELECT id::varchar AS patient_id FROM patients WHERE account_id = $1 LIMIT 1`, [userId]);
                patientId = patientResult.rows[0]?.patient_id;
            }
            if (!patientId) {
                res.status(HTTP_STATUS.OK).json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20 } });
                return;
            }

            const filters = {
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                status: req.query.status as string | undefined,
                page: parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE,
                limit: Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT),
            };
            const result = await TeleBookingService.getMyBookings(patientId, filters as any);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit } });
    });
}
