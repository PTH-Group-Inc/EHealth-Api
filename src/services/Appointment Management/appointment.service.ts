// src/services/Appointment Management/appointment.service.ts
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentAuditLogRepository } from '../../repository/Appointment Management/appointment-audit-log.repository';
import { AppointmentChangeRepository } from '../../repository/Appointment Management/appointment-change.repository';
import { AppointmentCoordinationRepository } from '../../repository/Appointment Management/appointment-coordination.repository';
import { EncounterRepository } from '../../repository/EMR/encounter.repository';
import { FacilityStatusService } from '../Facility Management/facility-status.service';
import { BookingConfigService } from '../Facility Management/booking-config.service';
import { NotificationEngineService } from '../Core/notification-engine.service';
import { AppointmentCoordinationService } from './appointment-coordination.service';
import { BranchRepository } from '../../repository/Facility Management/branch.repository';
import { pool } from '../../config/postgresdb';
import { CreateAppointmentInput, UpdateAppointmentInput, Appointment } from '../../models/Appointment Management/appointment.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    APPOINTMENT_STATUS, APPOINTMENT_ERRORS, DEFAULT_MAX_PATIENTS_PER_SLOT,
    RESCHEDULABLE_STATUSES, UPDATABLE_STATUSES, AUTO_CONFIRM_CHANNELS,
    CONFLICT_TYPE, APPOINTMENT_SUCCESS, BOOKING_CHANNEL, APPOINTMENT_WARNINGS,
    DEFAULT_DEPARTMENT_SLOT_DAYS, MAX_DEPARTMENT_SLOT_DAYS
} from '../../constants/appointment.constant';
import { APPOINTMENT_TEMPLATE_CODES } from '../../constants/appointment-confirmation.constant';
import { CHANGE_TYPE, POLICY_RESULT, CHANGE_ERRORS } from '../../constants/appointment-change.constant';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger.config';


export class AppointmentService {

    /**
     * Đặt lịch khám mới
     */
    static async createAppointment(data: CreateAppointmentInput, userId?: string): Promise<Appointment & { warning?: string | null }> {
        // VALIDATE CÁC TRƯỜNG BẮT BUỘC
        if (!data.patient_id || !data.branch_id || (!data.slot_id && !data.shift_id) || !data.appointment_date || !data.booking_channel) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS',
                'Thiếu thông tin bắt buộc: patient_id, branch_id, (slot_id hoặc shift_id), appointment_date, booking_channel');
        }

        // Validate ngày khám >= hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(data.appointment_date);
        if (targetDate < today) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE', APPOINTMENT_ERRORS.INVALID_DATE);
        }

        // Validate booking_channel hợp lệ
        const validChannels = Object.values(BOOKING_CHANNEL);
        if (!validChannels.includes(data.booking_channel as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_BOOKING_CHANNEL',
                `Kênh đặt lịch không hợp lệ. Các giá trị cho phép: ${validChannels.join(', ')}`);
        }

        // Validate bệnh nhân
        const patientOk = await AppointmentRepository.patientExists(data.patient_id);
        if (!patientOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', APPOINTMENT_ERRORS.PATIENT_NOT_FOUND);
        }

        // Validate chi nhánh
        const branchOk = await AppointmentRepository.branchExists(data.branch_id);
        if (!branchOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'BRANCH_NOT_FOUND', APPOINTMENT_ERRORS.BRANCH_NOT_FOUND);
        }

        // Validate slot và lấy shift_id, hoặc ngược lại
        if (data.slot_id) {
            const shiftId = await AppointmentRepository.getShiftIdBySlot(data.slot_id);
            if (!shiftId) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', 'Slot không tồn tại hoặc đã bị xoá');
            }
            data.shift_id = shiftId;
        } else if (data.shift_id) {
            const shiftOk = await AppointmentRepository.shiftExists(data.shift_id);
            if (!shiftOk) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Ca khám không tồn tại hoặc đã bị xoá');
            }
        }

        // Validate dịch vụ (nếu có)
        if (data.facility_service_id) {
            const realFacilityServiceId = await AppointmentRepository.resolveFacilityService(data.facility_service_id, data.branch_id);
            if (!realFacilityServiceId) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', APPOINTMENT_ERRORS.SERVICE_NOT_FOUND);
            }
            data.facility_service_id = realFacilityServiceId;
        }

        // === SMART ALLOCATE + INSERT TRONG TRANSACTION (tránh race condition) ===
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Xếp hàng: tìm slot tiếp theo + gán BS (theo chuyên khoa) + phòng
            const allocResult = await this.smartAllocate(data, client);

            /** Auto-confirm cho kênh DIRECT_CLINIC / HOTLINE */
            const initialStatus = AUTO_CONFIRM_CHANNELS.includes(data.booking_channel)
                ? APPOINTMENT_STATUS.CONFIRMED
                : APPOINTMENT_STATUS.PENDING;

            const appointment = await AppointmentRepository.create(data, {
                appointment_id: '',
                changed_by: userId,
                old_status: null,
                new_status: initialStatus,
                action_note: initialStatus === APPOINTMENT_STATUS.CONFIRMED
                    ? `Tạo lịch khám và tự động xác nhận (kênh: ${data.booking_channel})`
                    : `Tạo lịch khám mới qua kênh ${data.booking_channel}`
            }, initialStatus);

            await client.query('COMMIT');

            // Gửi thông báo (fire-and-forget, ngoài transaction)
            this.sendAppointmentNotification(
                appointment.appointments_id,
                APPOINTMENT_TEMPLATE_CODES.CREATED,
                {}
            );

            return { ...appointment, warning: allocResult.warning || null };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy danh sách lịch khám (có phân trang, filter)
     */
    static async getAppointments(filters: {
        status?: string; patient_id?: string; doctor_id?: string;
        room_id?: string; fromDate?: string; toDate?: string;
        booking_channel?: string; date?: string; keyword?: string;
        facility_service_id?: string;
        page?: number; limit?: number;
    }): Promise<{ data: Appointment[]; total: number }> {
        return await AppointmentRepository.findAll(filters);
    }

    /**
     * Lấy lịch khám của chính người dùng đang đăng nhập.
     * Hỗ trợ 1 user liên kết nhiều hồ sơ BN — gộp tất cả lịch khám.
     * Có thể lọc theo patient_id cụ thể nếu cần.
     */
    static async getMyAppointments(userId: string, filters: {
        status?: string; fromDate?: string; toDate?: string;
        patient_id?: string;
        page?: number; limit?: number;
    }): Promise<{ data: Appointment[]; total: number; patient_ids: string[]; patient_id: string }> {
        const result = await AppointmentRepository.findByAccountId(userId, filters);
        if (result.patient_ids.length === 0) {
            throw new AppError(
                HTTP_STATUS.NOT_FOUND,
                'PATIENT_PROFILE_NOT_FOUND',
                APPOINTMENT_ERRORS.PATIENT_PROFILE_NOT_FOUND
            );
        }
        return {
            data: result.data,
            total: result.total,
            patient_ids: result.patient_ids,
            patient_id: result.patient_ids[0]
        };
    }

    /**
     * Lấy chi tiết 1 lịch khám (kèm audit logs)
     */
    static async getAppointmentById(id: string): Promise<{ appointment: Appointment; auditLogs: any[] }> {
        const appointment = await AppointmentRepository.findById(id);
        if (!appointment) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        const auditLogs = await AppointmentAuditLogRepository.findByAppointmentId(id);
        return { appointment, auditLogs };
    }

    /**
     * Cập nhật lịch khám
     */
    static async updateAppointment(id: string, data: UpdateAppointmentInput, userId?: string): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        /** A3: Chặn update khi status không phải PENDING/CONFIRMED */
        if (!(UPDATABLE_STATUSES as readonly string[]).includes(existing.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_UPDATE_STATUS', APPOINTMENT_ERRORS.CANNOT_UPDATE_STATUS);
        }

        // Nếu đổi slot, validate lại sức chứa
        if (data.slot_id && data.slot_id !== existing.slot_id) {
            const slotOk = await AppointmentRepository.slotExists(data.slot_id);
            if (!slotOk) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', APPOINTMENT_ERRORS.SLOT_NOT_FOUND);
            }
            const targetDate = data.appointment_date || existing.appointment_date;
            const currentCount = await AppointmentRepository.countActiveBySlotAndDate(data.slot_id, targetDate);
            const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
            const maxPatients = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;
            if (currentCount >= maxPatients) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SLOT_FULL', APPOINTMENT_ERRORS.SLOT_FULL);
            }
        }

        // Nếu đổi bác sĩ, validate
        if (data.doctor_id && data.doctor_id !== existing.doctor_id) {
            const doctorOk = await AppointmentRepository.doctorExists(data.doctor_id);
            if (!doctorOk) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', APPOINTMENT_ERRORS.DOCTOR_NOT_FOUND);
            }
        }

        // Mô tả thay đổi cho audit
        const changes: string[] = [];
        if (data.appointment_date && data.appointment_date !== existing.appointment_date) changes.push(`Đổi ngày khám: ${existing.appointment_date} → ${data.appointment_date}`);
        if (data.doctor_id && data.doctor_id !== existing.doctor_id) changes.push(`Đổi bác sĩ`);
        if (data.slot_id && data.slot_id !== existing.slot_id) changes.push(`Đổi khung giờ`);
        if (data.reason_for_visit !== undefined) changes.push(`Cập nhật lý do khám`);

        const updated = await AppointmentRepository.update(id, data, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: existing.status,
            action_note: changes.length > 0 ? changes.join('; ') : 'Cập nhật thông tin lịch khám'
        });

        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi cập nhật CSDL');
        return updated;
    }

    /**
     * Huỷ lịch khám (nâng cấp: enforce policy + change log)
     */
    static async cancelAppointment(id: string, cancellationReason: string, userId?: string, userRoles?: string[]): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        if (existing.status === APPOINTMENT_STATUS.CANCELLED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_CANCELLED', APPOINTMENT_ERRORS.ALREADY_CANCELLED);
        }
        if (existing.status === APPOINTMENT_STATUS.COMPLETED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_CANCEL_COMPLETED', APPOINTMENT_ERRORS.CANNOT_CANCEL_COMPLETED);
        }
        if (existing.status === APPOINTMENT_STATUS.NO_SHOW) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_CANCEL_NO_SHOW', CHANGE_ERRORS.CANNOT_CANCEL_NO_SHOW);
        }
        if (existing.status === APPOINTMENT_STATUS.IN_PROGRESS) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_CANCEL_IN_PROGRESS', CHANGE_ERRORS.CANNOT_CANCEL_IN_PROGRESS);
        }

        // Kiểm tra chính sách hủy lịch
        const isAdmin = userRoles?.includes('ADMIN') || false;
        let policyResult: string = POLICY_RESULT.ALLOWED;
        let policyChecked = false;

        if (existing.slot_id) {
            policyChecked = true;
            const policyCheck = await this.checkCancelPolicyInternal(existing);
            if (!policyCheck.allowed && !isAdmin) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANCEL_POLICY_BLOCKED',
                    `${CHANGE_ERRORS.CANCEL_POLICY_BLOCKED}. Yêu cầu hủy tối thiểu ${policyCheck.policy_hours} giờ trước giờ khám`);
            }
            policyResult = policyCheck.allowed ? POLICY_RESULT.ALLOWED : POLICY_RESULT.LATE_CANCEL;
        }

        const cancelled = await AppointmentRepository.cancel(id, cancellationReason, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: APPOINTMENT_STATUS.CANCELLED,
            action_note: `Huỷ lịch: ${cancellationReason}`
        }, userId);

        if (!cancelled) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'CANCEL_FAILED', 'Lỗi hệ thống khi huỷ lịch');

        /** Fix #3: Dọn dẹp encounter đang mở nếu có (CHECKED_IN appointment có thể đã tạo encounter) */
        try {
            const encounter = await EncounterRepository.findActiveByAppointmentId(id);
            if (encounter) {
                await EncounterRepository.updateStatus(encounter.encounters_id, 'CANCELLED');
                if (encounter.room_id) {
                    await EncounterRepository.updateRoomStatus(encounter.room_id, 'AVAILABLE', null);
                }
            }
        } catch (err: any) {
            logger.error('[CANCEL_APPOINTMENT] Lỗi dọn dẹp encounter:', err.message);
        }

        // Ghi change log
        await AppointmentChangeRepository.createChangeLog({
            id: `ACHG_${uuidv4().substring(0, 12)}`,
            appointment_id: id,
            change_type: CHANGE_TYPE.CANCEL,
            approval_status: 'APPROVED',
            old_date: existing.appointment_date,
            old_slot_id: existing.slot_id,
            reason: cancellationReason,
            changed_by: userId,
            approved_by: userId || null,
            approved_by_type: 'USER',
            approved_at: new Date().toISOString(),
            policy_checked: policyChecked,
            policy_result: policyResult as string,
        });

        // Gửi thông báo huỷ lịch tới bệnh nhân (fire-and-forget)
        this.sendAppointmentNotification(
            id,
            APPOINTMENT_TEMPLATE_CODES.CANCELLED,
            { cancellation_reason: cancellationReason }
        );

        return cancelled;
    }

    /**
     * Kiểm tra chính sách hủy lịch (internal helper)
     */
    private static async checkCancelPolicyInternal(appointment: Appointment): Promise<{
        allowed: boolean;
        policy_hours: number;
        hours_remaining: number;
    }> {
        // Lấy cấu hình cancellation_allowed_hours
        let policyHours = 12; // default
        try {
            const config = await BookingConfigService.getResolvedConfig('default');
            policyHours = config.cancellation_allowed_hours ?? 12;
        } catch {
            // Fallback to default
        }

        // Tính thời điểm giới hạn
        const slotStartTime = appointment.slot_start_time || '00:00:00';
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${slotStartTime}`);
        const deadlineMs = appointmentDateTime.getTime() - (policyHours * 60 * 60 * 1000);
        const nowMs = Date.now();
        const hoursRemaining = Math.max(0, (appointmentDateTime.getTime() - nowMs) / (60 * 60 * 1000));

        return {
            allowed: nowMs <= deadlineMs,
            policy_hours: policyHours,
            hours_remaining: Math.round(hoursRemaining * 10) / 10,
        };
    }

    /**
     * Gán bác sĩ cho lịch khám
     */
    static async assignDoctor(id: string, doctorId: string, userId?: string): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        const doctorOk = await AppointmentRepository.doctorExists(doctorId);
        if (!doctorOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', APPOINTMENT_ERRORS.DOCTOR_NOT_FOUND);
        }

        const updated = await AppointmentRepository.assignDoctor(id, doctorId, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: existing.status,
            action_note: `Chỉ định bác sĩ: ${doctorId}`
        });

        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống');

        /** Fix #6: Sync BS sang encounter nếu appointment đang IN_PROGRESS */
        if (existing.status === 'IN_PROGRESS') {
            try {
                const encounter = await EncounterRepository.findActiveByAppointmentId(id);
                if (encounter) {
                    await EncounterRepository.updateDoctor(encounter.encounters_id, doctorId);
                }
            } catch (err: any) {
                logger.error('[ASSIGN_DOCTOR] Lỗi sync encounter:', err.message);
            }
        }

        return updated;
    }

    /**
     * Gán phòng khám
     */
    static async assignRoom(id: string, roomId: string, userId?: string): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        const roomOk = await AppointmentRepository.roomIsActive(roomId);
        if (!roomOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ROOM_NOT_FOUND', APPOINTMENT_ERRORS.ROOM_NOT_FOUND);
        }

        const updated = await AppointmentRepository.assignRoom(id, roomId, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: existing.status,
            action_note: `Gán phòng khám: ${roomId}`
        });

        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống');

        /** Fix #6: Sync phòng sang encounter nếu appointment đang IN_PROGRESS */
        if (existing.status === 'IN_PROGRESS') {
            try {
                const encounter = await EncounterRepository.findActiveByAppointmentId(id);
                if (encounter) {
                    // Giải phóng phòng cũ của encounter
                    if (encounter.room_id) {
                        await EncounterRepository.updateRoomStatus(encounter.room_id, 'AVAILABLE', null);
                    }
                    await EncounterRepository.updateRoom(encounter.encounters_id, roomId);
                    await EncounterRepository.updateRoomStatus(roomId, 'OCCUPIED', id);
                }
            } catch (err: any) {
                logger.error('[ASSIGN_ROOM] Lỗi sync encounter:', err.message);
            }
        }

        return updated;
    }

    /**
     * Gán dịch vụ
     */
    static async assignService(id: string, facilityServiceId: string, userId?: string): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        const realFacilityServiceId = await AppointmentRepository.resolveFacilityService(facilityServiceId, existing.branch_id);
        if (!realFacilityServiceId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', APPOINTMENT_ERRORS.SERVICE_NOT_FOUND);
        }
        facilityServiceId = realFacilityServiceId;

        const updated = await AppointmentRepository.assignService(id, facilityServiceId, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: existing.status,
            action_note: `Gán dịch vụ: ${facilityServiceId}`
        });

        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống');
        return updated;
    }

    /**
     * Lấy lịch khám theo bác sĩ
     */
    static async getAppointmentsByDoctor(doctorId: string, filters?: { fromDate?: string; toDate?: string }): Promise<Appointment[]> {
        return await AppointmentRepository.findByDoctorId(doctorId, filters);
    }

    /**
     * Lễ tân đặt lịch hộ cho bệnh nhân (thêm metadata người đặt)
     */
    static async bookByStaff(data: CreateAppointmentInput, staffUserId: string, staffNotes?: string): Promise<Appointment> {
        // Mặc định kênh đặt nếu không truyền
        if (!data.booking_channel) {
            data.booking_channel = 'DIRECT_CLINIC';
        }

        // Tạo lịch bình thường (tái sử dụng toàn bộ validation + conflict check)
        const appointment = await this.createAppointment(data, staffUserId);

        return appointment;
    }

    /**
     * Lấy danh sách slot trống theo ngày — chấp nhận branch_id hoặc facility_id
     * Nếu chỉ có facility_id, tự tìm branch mặc định.
     */
    static async getAvailableSlots(date: string, doctorId?: string, branchId?: string, facilityId?: string): Promise<any[]> {

        // Fix #1: Auto-resolve facility_id → branch_id nếu branchId không phải branch thực
        if (branchId) {
            // Thử tìm branch trước
            let branch = await BranchRepository.findBranchById(branchId);
            if (!branch) {
                // branchId có thể là facility_id (FE gửi nhầm) → thử resolve
                const branches = await BranchRepository.findAllBranches(undefined, branchId, 'ACTIVE', 0, 1);
                if (branches.branches.length > 0) {
                    branch = branches.branches[0];
                    branchId = branch.branches_id;
                } else if (facilityId) {
                    // Fallback: dùng facilityId nếu có
                    const branchesByFac = await BranchRepository.findAllBranches(undefined, facilityId, 'ACTIVE', 0, 1);
                    if (branchesByFac.branches.length > 0) {
                        branch = branchesByFac.branches[0];
                        branchId = branch.branches_id;
                    }
                }
                if (!branch) {
                    throw new AppError(HTTP_STATUS.NOT_FOUND, 'BRANCH_NOT_FOUND', 'Chi nhánh không tồn tại');
                }
            }
            facilityId = branch.facility_id;
        } else if (facilityId) {
            // Chỉ có facility_id → tìm branch mặc định
            const branches = await BranchRepository.findAllBranches(undefined, facilityId, 'ACTIVE', 0, 1);
            if (branches.branches.length > 0) {
                branchId = branches.branches[0].branches_id;
            } else {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'BRANCH_NOT_FOUND', 'Không tìm thấy chi nhánh thuộc cơ sở này');
            }
        } else {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS',
                'Vui lòng truyền branch_id hoặc facility_id để xác định cơ sở');
        }

        // Validate ngày >= hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        if (targetDate < today) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE', APPOINTMENT_ERRORS.INVALID_DATE);
        }

        // Kiểm tra cơ sở đóng cửa bằng FacilityStatusService
        let openTime: string | null = null;
        let closeTime: string | null = null;
        if (facilityId) {
            const facilityStatus = await FacilityStatusService.determineFacilityStatus(facilityId, date);
            if (!facilityStatus.is_open) {
                return [{ is_facility_open: false, _facilityClosedFlag: true }];
            }
            openTime = facilityStatus.open_time || null;
            closeTime = facilityStatus.close_time || null;
        }

        // Lấy slot + thông tin capacity
        let slots = await AppointmentRepository.findAvailableSlots(date, doctorId, facilityId);
        const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
        const maxPatients = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;

        // Lọc slot theo giờ hoạt động cơ sở (chỉ trả slot nằm trong open_time–close_time)
        const now = new Date();
        const isToday = targetDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        if (openTime && closeTime) {
            slots = slots.filter(slot => {
                const slotStart = slot.start_time?.substring(0, 5);
                let slotEnd = slot.end_time?.substring(0, 5);

                if (slotEnd <= slotStart) slotEnd = '24:00';
                const facilityOpen = openTime!.substring(0, 5);
                const facilityClose = closeTime!.substring(0, 5);

                // Lọc theo giờ mở cửa
                if (slotStart < facilityOpen || slotEnd > facilityClose) {
                    return false;
                }

                // Nếu là hôm nay, lọc bỏ các slot quá khứ
                if (isToday && slotStart <= currentTimeStr) {
                    return false;
                }

                return true;
            });
        } else if (isToday) {
            // Nếu không có facilityId, vẫn phải lọc bỏ slot quá khứ nếu là hôm nay
            slots = slots.filter(slot => {
                const slotStart = slot.start_time?.substring(0, 5);
                return slotStart > currentTimeStr;
            });
        }

        return slots.map(slot => ({
            ...slot,
            max_capacity: maxPatients,
            is_available: slot.booked_count < maxPatients
        }));
    }

    /**
     * Đổi lịch khám (nâng cấp: yêu cầu reason + change log)
     */
    static async rescheduleAppointment(
        id: string,
        newDate: string,
        newSlotId: string,
        userId?: string,
        rescheduleReason?: string,
        options?: { skipChangeLog?: boolean }
    ): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        // Chỉ PENDING/CONFIRMED mới được đổi
        if (!(RESCHEDULABLE_STATUSES as readonly string[]).includes(existing.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'RESCHEDULE_NOT_ALLOWED', APPOINTMENT_ERRORS.RESCHEDULE_NOT_ALLOWED);
        }

        // Validate slot mới
        const slotOk = await AppointmentRepository.slotExists(newSlotId);
        if (!slotOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', APPOINTMENT_ERRORS.SLOT_NOT_FOUND);
        }

        // Kiểm tra sức chứa slot mới
        const currentCount = await AppointmentRepository.countActiveBySlotAndDate(newSlotId, newDate);
        const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
        const maxPatients = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;
        if (currentCount >= maxPatients) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SLOT_FULL', APPOINTMENT_ERRORS.SLOT_FULL);
        }

        // Kiểm tra trùng bệnh nhân ở slot mới (loại trừ appointment hiện tại)
        const patientConflict = await AppointmentRepository.findPatientConflict(existing.patient_id, newDate, newSlotId, id);
        if (patientConflict) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PATIENT_CONFLICT', APPOINTMENT_ERRORS.CONFLICT_PATIENT);
        }

        // Kiểm tra bác sĩ có lịch làm việc ở ngày/ca mới (nếu đã gán BS)
        if (existing.doctor_id) {
            const shiftId = await AppointmentRepository.getShiftIdBySlot(newSlotId);
            if (shiftId) {
                const doctorAvailable = await AppointmentRepository.isDoctorAvailableOnDate(existing.doctor_id, newDate, shiftId);
                if (!doctorAvailable) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DOCTOR_NOT_AVAILABLE', APPOINTMENT_ERRORS.DOCTOR_NOT_AVAILABLE);
                }
            }

            // Kiểm tra trùng bác sĩ ở slot mới
            const doctorConflict = await AppointmentRepository.findDoctorConflict(existing.doctor_id, newDate, newSlotId, id);
            if (doctorConflict) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DOCTOR_CONFLICT', APPOINTMENT_ERRORS.CONFLICT_DOCTOR);
            }
        }

        // Lưu thông tin cũ trước khi update
        const oldDate = existing.appointment_date;
        const oldSlotId = existing.slot_id;
        const oldSlotInfo = existing.slot_id || 'chưa chọn';

        const updated = await AppointmentRepository.reschedule(id, newDate, newSlotId, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: existing.status,
            action_note: `Đổi lịch: ${existing.appointment_date} (slot ${oldSlotInfo}) → ${newDate} (slot ${newSlotId})${rescheduleReason ? `. Lý do: ${rescheduleReason}` : ''}`
        });

        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi đổi lịch');

        if (!options?.skipChangeLog) {
            await AppointmentChangeRepository.createChangeLog({
                id: `ACHG_${uuidv4().substring(0, 12)}`,
                appointment_id: id,
                change_type: CHANGE_TYPE.RESCHEDULE,
                approval_status: 'APPROVED',
                old_date: oldDate,
                old_slot_id: oldSlotId,
                new_date: newDate,
                new_slot_id: newSlotId,
                reason: rescheduleReason,
                changed_by: userId,
                approved_by: userId || null,
                approved_by_type: 'USER',
                approved_at: new Date().toISOString(),
                policy_checked: false,
                policy_result: POLICY_RESULT.ALLOWED,
            });
        }

        // Gửi thông báo đổi lịch tới bệnh nhân (fire-and-forget)
        this.sendAppointmentNotification(
            id,
            APPOINTMENT_TEMPLATE_CODES.RESCHEDULED,
            { new_date: newDate, new_slot_id: newSlotId }
        );

        return updated;
    }

    /**
     * Kiểm tra trùng lịch (bác sĩ, phòng, bệnh nhân)
     */
    static async checkConflict(data: {
        date: string; slot_id: string;
        doctor_id?: string; patient_id?: string; room_id?: string;
        exclude_appointment_id?: string;
    }): Promise<{ has_conflict: boolean; conflicts: any[] }> {
        const conflicts: any[] = [];

        // Kiểm tra bác sĩ trùng
        if (data.doctor_id) {
            const doctorConflict = await AppointmentRepository.findDoctorConflict(data.doctor_id, data.date, data.slot_id, data.exclude_appointment_id);
            if (doctorConflict) {
                conflicts.push({
                    type: CONFLICT_TYPE.DOCTOR,
                    message: `Bác sĩ đã có lịch khám lúc ${doctorConflict.start_time}-${doctorConflict.end_time} ngày ${data.date}`,
                    existing_appointment_id: doctorConflict.appointments_id,
                    existing_appointment_code: doctorConflict.appointment_code
                });
            }
        }

        // Kiểm tra bệnh nhân trùng
        if (data.patient_id) {
            const patientConflict = await AppointmentRepository.findPatientConflict(data.patient_id, data.date, data.slot_id, data.exclude_appointment_id);
            if (patientConflict) {
                conflicts.push({
                    type: CONFLICT_TYPE.PATIENT,
                    message: `Bệnh nhân đã có lịch khám cùng khung giờ ${patientConflict.start_time}-${patientConflict.end_time}`,
                    existing_appointment_id: patientConflict.appointments_id,
                    existing_appointment_code: patientConflict.appointment_code
                });
            }
        }

        // Kiểm tra phòng trùng (so với capacity)
        if (data.room_id) {
            const roomBookings = await AppointmentRepository.countRoomBookings(data.room_id, data.date, data.slot_id, data.exclude_appointment_id);
            const roomCapacity = await AppointmentRepository.getRoomCapacity(data.room_id);
            if (roomBookings >= roomCapacity) {
                conflicts.push({
                    type: CONFLICT_TYPE.ROOM,
                    message: `Phòng khám đã đầy (${roomBookings}/${roomCapacity}) trong khung giờ này`,
                    booked_count: roomBookings,
                    max_capacity: roomCapacity
                });
            }
        }

        return { has_conflict: conflicts.length > 0, conflicts };
    }

    /**
     * Cập nhật mục đích khám
     */
    static async updateVisitReason(id: string, reasonForVisit?: string, symptomsNotes?: string, userId?: string): Promise<Appointment> {
        const existing = await AppointmentRepository.findById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        const updated = await AppointmentRepository.updateVisitReason(id, reasonForVisit, symptomsNotes, {
            appointment_id: id,
            changed_by: userId,
            old_status: existing.status,
            new_status: existing.status,
            action_note: 'Cập nhật mục đích khám / triệu chứng'
        });

        if (!updated) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_VISIT_REASON', APPOINTMENT_ERRORS.MISSING_VISIT_REASON);
        return updated;
    }

    /**
     * Lấy thông tin mục đích khám
     */
    static async getVisitReason(id: string): Promise<{ reason_for_visit: string | null; symptoms_notes: string | null }> {
        const result = await AppointmentRepository.findVisitReason(id);
        if (!result) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        return result;
    }

    /**
     * Gửi thông báo appointment (fire-and-forget)
     * Không throw lỗi — chỉ log warning nếu thất bại
     */
    private static async sendAppointmentNotification(
        appointmentId: string,
        templateCode: string,
        extraVariables: Record<string, any> = {}
    ): Promise<void> {
        try {
            const apt = await AppointmentRepository.findWithPatientAccount(appointmentId);
            if (!apt || !apt.account_id) {
                return; // Bệnh nhân chưa có tài khoản → bỏ qua
            }

            await NotificationEngineService.triggerEvent({
                template_code: templateCode,
                target_user_id: apt.account_id,
                variables: {
                    patient_name: apt.patient_name || 'Bệnh nhân',
                    appointment_code: apt.appointment_code,
                    appointment_date: apt.appointment_date,
                    slot_time: (apt as any).slot_time || '',
                    doctor_name: apt.doctor_name || 'Chưa chỉ định',
                    ...extraVariables,
                },
            });
        } catch (error: any) {
            logger.error(`[NOTIFICATION] Lỗi gửi ${templateCode} cho appointment ${appointmentId}:`, error.message);
        }
    }

    /**
     * Xếp hàng tự động: gán slot (FIFO) + BS đúng chuyên khoa (ít tải nhất) + phòng.
     */
    private static async smartAllocate(
        data: CreateAppointmentInput, client?: import('pg').PoolClient
    ): Promise<{ warning?: string }> {
        // 1. Kiểm tra sức chứa
        const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
        const maxPerSlot = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;

        if (!data.slot_id) {
            if (!data.shift_id) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SLOT_AND_SHIFT', 'Thiếu thông tin slot_id và shift_id');
            // Tự động gán slot nếu chỉ truyền shift_id
            const availableSlot = await AppointmentRepository.findNextAvailableSlot(data.shift_id, data.appointment_date, maxPerSlot, client);
            if (!availableSlot) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SHIFT_FULL', 'Ca khám đã hết khung giờ trống, vui lòng chọn ca khác.');
            }
            data.slot_id = availableSlot.slot_id;
        } else {
            const currentCount = await AppointmentRepository.countActiveBySlotAndDate(
                data.slot_id, data.appointment_date, client
            );
            if (currentCount >= maxPerSlot) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SLOT_FULL', 'Khung giờ này đã hết chỗ, vui lòng chọn khung giờ khác.');
            }
        }

        // 2. Xác định chuyên khoa: ưu tiên specialty_id trực tiếp, fallback tra từ dịch vụ
        let specialtyId: string | undefined;

        // Ưu tiên 1: specialty_id do frontend gửi trực tiếp (đặt theo chuyên khoa)
        if (data.specialty_id) {
            specialtyId = data.specialty_id;
        }
        // Ưu tiên 2: tra chuyên khoa từ dịch vụ (facility_service_id → specialty_services)
        if (!specialtyId && data.facility_service_id) {
            specialtyId = await AppointmentRepository.getSpecialtyByFacilityService(
                data.facility_service_id
            ) ?? undefined;
        }

        // 3. Gán BS đúng chuyên khoa + ít tải nhất tại branch
        let warning: string | undefined;
        const doctor = await AppointmentCoordinationRepository.getLeastLoadedDoctorForShiftAtBranch(
            data.appointment_date, data.shift_id, data.branch_id, specialtyId
        );
        if (doctor) {
            data.doctor_id = doctor.doctor_id;
        } else if (specialtyId) {
            // Có yêu cầu chuyên khoa nhưng không tìm được BS → cảnh báo
            warning = APPOINTMENT_WARNINGS.NO_SPECIALTY_DOCTOR;
        }
        // Không throw — lịch vẫn tạo được, staff gán BS sau

        // 4. Gán phòng đúng khoa (ưu tiên) hoặc phòng trống bất kỳ (fallback)
        const room = await AppointmentRepository.findAvailableRoom(data.branch_id, specialtyId);
        if (room) {
            data.room_id = room.medical_rooms_id;
        }

        return { warning };
    }

    /**
     * Lấy danh sách slot trống theo khoa (department) trong khoảng n ngày.
     * Dùng cho màn hình "Đặt lịch theo Khoa" trên App/Web.
     */
    static async getAvailableSlotsByDepartment(filters: {
        department_id: string;
        facility_id: string;
        start_date?: string;
        days?: number;
    }): Promise<any[]> {
        const { department_id, facility_id } = filters;

        // Validate bắt buộc
        if (!department_id || !facility_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DEPARTMENT_FILTER',
                APPOINTMENT_ERRORS.MISSING_DEPARTMENT_FILTER);
        }

        // Validate department tồn tại
        const deptOk = await AppointmentRepository.departmentExists(department_id);
        if (!deptOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DEPARTMENT_NOT_FOUND',
                APPOINTMENT_ERRORS.DEPARTMENT_NOT_FOUND);
        }

        // Xác định ngày bắt đầu (default = hôm nay, timezone VN)
        const now = new Date();
        const startDate = filters.start_date
            ? new Date(filters.start_date)
            : now;
        startDate.setHours(0, 0, 0, 0);

        // Clamp số ngày trong giới hạn cho phép
        const days = Math.min(
            Math.max(filters.days || DEFAULT_DEPARTMENT_SLOT_DAYS, 1),
            MAX_DEPARTMENT_SLOT_DAYS
        );

        // Lấy max_patients_per_slot từ cấu hình
        const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
        const maxPatients = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;

        // Lấy danh sách phòng thuộc department (cố định cho mọi ngày)
        const rooms = await AppointmentRepository.findRoomsByDepartment(department_id);

        // Lặp qua từng ngày
        const result: any[] = [];
        for (let i = 0; i < days; i++) {
            const targetDate = new Date(startDate);
            targetDate.setDate(targetDate.getDate() + i);
            const year = targetDate.getFullYear();
            const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
            const day = targetDate.getDate().toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Kiểm tra cơ sở có mở cửa không
            let isFacilityOpen = true;
            let openTime: string | null = null;
            let closeTime: string | null = null;

            try {
                const facilityStatus = await FacilityStatusService.determineFacilityStatus(facility_id, dateStr);
                isFacilityOpen = facilityStatus.is_open;
                openTime = facilityStatus.open_time || null;
                closeTime = facilityStatus.close_time || null;
            } catch {
                isFacilityOpen = true; // Fallback: coi như mở
            }

            if (!isFacilityOpen) {
                result.push({ date: dateStr, is_facility_open: false, slots: [] });
                continue;
            }

            // Query slot kèm booked_count
            const rawSlots = await AppointmentRepository.findAvailableSlotsByDepartmentForDate(
                department_id, facility_id, dateStr, maxPatients
            );

            // Xác định xem ngày đang xét có phải hôm nay không
            const isToday = targetDate.toDateString() === now.toDateString();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            let slots = rawSlots.map(slot => ({
                slot_id: slot.slot_id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                shift_id: slot.shift_id,
                shift_code: slot.shift_code,
                shift_name: slot.shift_name,
                rooms,
                booked_count: slot.booked_count,
                max_capacity: maxPatients,
                is_available: slot.booked_count < maxPatients,
            }));

            if (openTime && closeTime) {
                slots = slots.filter(slot => {
                    const slotStart = slot.start_time?.substring(0, 5);
                    let slotEnd = slot.end_time?.substring(0, 5);

                    if (slotEnd <= slotStart) slotEnd = '24:00';
                    const facilityOpen = openTime!.substring(0, 5);
                    const facilityClose = closeTime!.substring(0, 5);

                    // Lọc theo giờ mở cửa
                    if (slotStart < facilityOpen || slotEnd > facilityClose) {
                        return false;
                    }

                    // Nếu là hôm nay, lọc bỏ các slot quá khứ
                    if (isToday && slotStart <= currentTimeStr) {
                        return false;
                    }

                    return true;
                });
            } else if (isToday) {
                // Nếu không có facilityId hoặc thiếu openTime/closeTime, vẫn lọc bỏ slot quá khứ nếu là hôm nay
                slots = slots.filter(slot => {
                    const slotStart = slot.start_time?.substring(0, 5);
                    return slotStart > currentTimeStr;
                });
            }

            result.push({ date: dateStr, is_facility_open: true, slots });
        }
        return result;
    }

    /**
     * Submit user review for a completed appointment
     */
    static async submitReview(id: string, rating: number, feedback: string): Promise<Appointment> {
        const appointment = await AppointmentRepository.findById(id);
        if (!appointment) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        if (appointment.status !== 'COMPLETED') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'APPOINTMENT_NOT_COMPLETED', 'Cuộc hẹn phải hoàn thành mới được đánh giá.');
        }

        const result = await AppointmentRepository.submitReview(id, rating, feedback);
        if (!result) {
            throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Không thể lưu đánh giá');
        }
        return result;
    }
}
