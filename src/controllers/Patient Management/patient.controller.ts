import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../../services/Patient Management/patient.service';
import {
    CreatePatientInput,
    UpdatePatientInput
} from '../../models/Patient Management/patient.model';
import { PATIENT_CONFIG } from '../../constants/patient.constant';

export class PatientController {
    /**
     * Lấy danh sách hồ sơ bệnh nhân
     */
    static async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { search, status, gender, page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatients(
                search,
                status,
                gender,
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân
     */
    static async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientService.getPatientById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới hồ sơ bệnh nhân
     */
    static async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreatePatientInput = req.body;
            const data = await PatientService.createPatient(input);
            res.status(201).json({
                success: true,
                message: 'Tạo hồ sơ bệnh nhân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin hành chính bệnh nhân
     */
    static async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdatePatientInput = req.body;
            const data = await PatientService.updatePatient(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật hồ sơ bệnh nhân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE)
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { status } = req.body as { status: string };
            const data = await PatientService.updateStatus(id, status);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái hồ sơ bệnh nhân thành: ${status}.`,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản Mobile App
     */
    static async linkAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { account_id } = req.body as { account_id: string };
            const data = await PatientService.linkAccount(id, account_id);
            res.status(200).json({
                success: true,
                message: 'Liên kết tài khoản thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân
     */
    static async unlinkAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientService.unlinkAccount(id);
            res.status(200).json({
                success: true,
                message: 'Đã hủy liên kết tài khoản.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm hồ sơ bệnh nhân
     */
    static async deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await PatientService.deletePatient(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa hồ sơ bệnh nhân thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
