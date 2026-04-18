import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { PatientService } from '../../services/Patient Management/patient.service';
import { PatientInsuranceService } from '../../services/Patient Management/patient-insurance.service';
import { PatientContactService } from '../../services/Patient Management/patient-contact.service';
import {
    CreatePatientInput,
    UpdatePatientInput
} from '../../models/Patient Management/patient.model';
import { PATIENT_CONFIG } from '../../constants/patient.constant';
import { AuditLogRepository } from '../../repository/Core/audit-log.repository';
import { AppointmentAuditLogRepository } from '../../repository/Appointment Management/appointment-audit-log.repository';

export class PatientController {
    /**
     * Lấy danh sách hồ sơ bệnh nhân
     */
    static getPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { search, status, gender, page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatients(
                search,
                status,
                gender,
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy chi tiết hồ sơ bệnh nhân
     */
    static getPatientById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientService.getPatientById(id);
            res.status(200).json({ success: true, data });
    });

    /**
     * Tạo mới hồ sơ bệnh nhân
     */
    static createPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreatePatientInput = req.body;
            const data = await PatientService.createPatient(input);
            res.status(201).json({
                success: true,
                message: 'Tạo hồ sơ bệnh nhân thành công.',
                data
            });
    });

    /**
     * Cập nhật thông tin hành chính bệnh nhân.
     */
    static updatePatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdatePatientInput = req.body;

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.updatePatient(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật hồ sơ bệnh nhân thành công.',
                data
            });
    });

    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE).
     * Lưu snapshot dữ liệu cũ trước khi cập nhật để phục vụ audit trail y tế.
     */
    static updateStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const { status } = req.body as { status: string };

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.updateStatus(id, status);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái hồ sơ bệnh nhân thành: ${status}.`,
                data
            });
    });

    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản Mobile App.
     * Lưu snapshot dữ liệu cũ trước khi cập nhật để phục vụ audit trail y tế.
     */
    static linkAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const { account_id } = req.body as { account_id: string };

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.linkAccount(id, account_id);
            res.status(200).json({
                success: true,
                message: 'Liên kết tài khoản thành công.',
                data
            });
    });

    /**
     * Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân.
     * Lưu snapshot dữ liệu cũ trước khi cập nhật để phục vụ audit trail y tế.
     */
    static unlinkAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.unlinkAccount(id);
            res.status(200).json({
                success: true,
                message: 'Đã hủy liên kết tài khoản.',
                data
            });
    });

    /**
     * Xóa mềm hồ sơ bệnh nhân.
     * Lưu snapshot dữ liệu cũ trước khi xóa để phục vụ audit trail y tế.
     */
    static deletePatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };

            // Lưu dữ liệu cũ trước khi xóa để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            await PatientService.deletePatient(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa hồ sơ bệnh nhân thành công.'
            });
    });

    /**
     * Tra cứu lịch sử thay đổi hồ sơ của 1 bệnh nhân cụ thể.
     * Phục vụ kiểm tra nội bộ & tuân thủ quy định y tế.
     */
    static getPatientAuditTrail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };

            // Đảm bảo bệnh nhân tồn tại trước khi truy vấn audit trail
            await PatientService.getPatientById(id);

            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const actionType = req.query.action_type as string | undefined;
            const startDate = req.query.start_date as string | undefined;
            const endDate = req.query.end_date as string | undefined;

            const generalData = await AuditLogRepository.getLogs({
                module_name: 'PATIENTS',
                target_id: id,
                action_type: actionType,
                start_date: startDate,
                end_date: endDate,
                page,
                limit
            });

            // Lấy thêm audit của đặt lịch bổ trợ vào timeline
            const appointmentLogs = await AppointmentAuditLogRepository.findByPatientId(id);

            const allEvents = [...generalData.logs];
            appointmentLogs.forEach(log => {
                allEvents.push({
                    log_id: log.appointment_audit_logs_id || log.id,
                    action_type: log.new_status ? `UPDATE_STATUS_${log.new_status}` : 'UPDATE',
                    created_at: log.created_at,
                    module_name: 'APPOINTMENTS',
                    description: `Lịch khám ${log.appointment_code || log.appointment_id}: ${log.old_status || ''} -> ${log.new_status || ''} ${log.action_note ? '(' + log.action_note + ')' : ''}`,
                    user_id: log.changed_by,
                    user_email: log.changed_by_name || 'Hệ thống'
                });
            });

            // Sắp xếp lại theo created_at DESC (mới nhất trước)
            allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Vì đã merge thêm dữ liệu, việc phân trang có thể không còn chính xác tuyệt đối như query,
            // nhưng client timeline cần xử lý mảng này. Ta tính lại tổng fake.
            const mergedTotal = generalData.total + appointmentLogs.length;

            res.status(200).json({
                success: true,
                message: 'Lấy lịch sử thay đổi hồ sơ bệnh nhân thành công.',
                data: allEvents,
                pagination: {
                    total: mergedTotal,
                    page,
                    limit,
                    total_pages: Math.ceil(mergedTotal / limit)
                }
            });
    });

    /**
     * Lấy danh sách thẻ bảo hiểm của 1 bệnh nhân (nested route)
     */
    static getPatientInsurances = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const { page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getInsurances(
                patientId,
                page ? parseInt(page) : 1,
                limit ? parseInt(limit) : 20
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Thêm thẻ bảo hiểm cho bệnh nhân (nested route, patientId từ params)
     */
    static addPatientInsurance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const input = { ...req.body, patient_id: patientId };

            const data = await PatientInsuranceService.createInsurance(input);
            res.status(201).json({
                success: true,
                message: 'Thêm thẻ bảo hiểm cho bệnh nhân thành công.',
                data
            });
    });

    /**
     * Cập nhật cờ has_insurance cho bệnh nhân
     */
    static updateInsuranceStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const { has_insurance } = req.body as { has_insurance: boolean };

            await PatientService.updateInsuranceStatus(id, has_insurance);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái bảo hiểm bệnh nhân thành: ${has_insurance ? 'CÓ' : 'KHÔNG CÓ'} bảo hiểm.`
            });
    });

    /**
     * Danh sách bệnh nhân CÓ bảo hiểm
     */
    static getPatientsWithInsurance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatientsWithInsurance(
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Danh sách bệnh nhân KHÔNG CÓ bảo hiểm
     */
    static getPatientsWithoutInsurance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatientsWithoutInsurance(
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    // ==================== MODULE 2.4.3 & 2.4.4: Liên hệ khẩn cấp & Đại diện pháp lý ====================

    /**
     * Lấy danh sách liên hệ khẩn cấp của bệnh nhân
     */
    static getEmergencyContacts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getEmergencyContacts(patientId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy người đại diện pháp lý hiện tại của bệnh nhân
     */
    static getLegalRepresentative = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getLegalRepresentative(patientId);
            res.status(200).json({ success: true, data });
    });

    // 2.4.6: Phân biệt người thân – liên hệ khẩn cấp

    /**
     * Lấy tất cả người liên hệ của bệnh nhân
     */
    static getAllRelations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getAllRelations(patientId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy danh sách người thân thông thường (không khẩn cấp, không đại diện pháp lý)
     */
    static getNormalRelatives = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getNormalRelatives(patientId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy danh sách người giám hộ
     */
    static getGuardians = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getGuardians(patientId);
            res.status(200).json({ success: true, data });
    });

    /**
     * Lọc bệnh nhân theo tag(s)
     */
    static filterByTags = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const tagIdsRaw = req.query.tagIds as string;
            const matchAll = req.query.matchAll === 'true';
            const page = parseInt(req.query.page as string, 10) || PATIENT_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string, 10) || PATIENT_CONFIG.DEFAULT_LIMIT;

            const tagIds = tagIdsRaw ? tagIdsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
            const data = await PatientService.filterByTags(tagIds, matchAll, page, limit);
            res.status(200).json({ success: true, ...data });
    });


    /** Tìm kiếm nâng cao bệnh nhân */
    static advancedSearch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { keyword, status, gender, page, limit } = req.query as Record<string, string>;
            const ageMin = req.query.ageMin ? parseInt(req.query.ageMin as string, 10) : undefined;
            const ageMax = req.query.ageMax ? parseInt(req.query.ageMax as string, 10) : undefined;

            const data = await PatientService.advancedSearch(
                keyword, status, gender, ageMin, ageMax,
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );
            res.status(200).json({ success: true, ...data });
    });

    /** Lấy danh sách hồ sơ bệnh nhân qua ID tài khoản (User ID) */
    static getPatientsByAccountId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { accountId } = req.params as { accountId: string };
            const data = await PatientService.getPatientsByAccountId(accountId);
            res.status(200).json({ success: true, data });
    });

    /** Tìm kiếm nhanh (Autocomplete) */
    static quickSearch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const q = (req.query.q as string) || '';
            const data = await PatientService.quickSearch(q);
            res.status(200).json({ success: true, data });
    });

    /** Tra cứu tóm tắt hồ sơ bệnh nhân */
    static getPatientSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientService.getPatientSummary(id);
            res.status(200).json({ success: true, data });
    });
}
