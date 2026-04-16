import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { PatientInsuranceService } from '../../services/Patient Management/patient-insurance.service';
import {
    CreatePatientInsuranceInput,
    UpdatePatientInsuranceInput
} from '../../models/Patient Management/patient-insurance.model';
import { PATIENT_INSURANCE_CONFIG } from '../../constants/patient-insurance.constant';
import { AuditLogRepository } from '../../repository/Core/audit-log.repository';

export class PatientInsuranceController {
    /**
     * Lấy danh sách thẻ bảo hiểm
     */
    static getInsurances = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getInsurances(
                patient_id,
                page ? parseInt(page) : PATIENT_INSURANCE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_INSURANCE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Chi tiết thẻ bảo hiểm
     */
    static getInsuranceById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await PatientInsuranceService.getInsuranceById(id);
            res.status(200).json({ success: true, data });
    });

    /**
     * Thêm thẻ bảo hiểm mới
     */
    static createInsurance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreatePatientInsuranceInput = req.body;
            const data = await PatientInsuranceService.createInsurance(input);
            res.status(201).json({
                success: true,
                message: 'Thêm thẻ bảo hiểm thành công.',
                data
            });
    });

    /**
     * Cập nhật thẻ bảo hiểm.
     */
    static updateInsurance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdatePatientInsuranceInput = req.body;

            const oldData = await PatientInsuranceService.getInsuranceById(id);
            (req as any).auditOldValue = oldData;

            const data = await PatientInsuranceService.updateInsurance(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thẻ bảo hiểm thành công.',
                data
            });
    });

    /**
     * Xóa thẻ bảo hiểm.
     */
    static deleteInsurance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };

            const oldData = await PatientInsuranceService.getInsuranceById(id);
            (req as any).auditOldValue = oldData;

            await PatientInsuranceService.deleteInsurance(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa thẻ bảo hiểm thành công.'
            });
    });

    /**
     * Danh sách thẻ bảo hiểm còn hiệu lực
     */
    static getActiveInsurances = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getActiveInsurances(
                patient_id,
                page ? parseInt(page) : PATIENT_INSURANCE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_INSURANCE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Danh sách thẻ bảo hiểm đã hết hạn
     */
    static getExpiredInsurances = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getExpiredInsurances(
                patient_id,
                page ? parseInt(page) : PATIENT_INSURANCE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_INSURANCE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Lịch sử thay đổi thẻ bảo hiểm (từ bảng audit_logs)
     */
    static getInsuranceHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };

            // Đảm bảo thẻ tồn tại
            await PatientInsuranceService.getInsuranceById(id);

            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            const data = await AuditLogRepository.getLogs({
                module_name: 'INSURANCE',
                target_id: id,
                page,
                limit
            });

            res.status(200).json({
                success: true,
                message: 'Lấy lịch sử thay đổi thẻ bảo hiểm thành công.',
                data: data.logs,
                pagination: {
                    total: data.total,
                    page,
                    limit,
                    total_pages: Math.ceil(data.total / limit)
                }
            });
    });
}
