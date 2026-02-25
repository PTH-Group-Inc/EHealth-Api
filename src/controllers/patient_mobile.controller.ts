import { Request, Response } from 'express';
import { patientMobileService } from '../services/patient_mobile.service';


export class PatientMobileController {
    /**
     * Liên kết tài khoản người dùng App (CUSTOMER) với hồ sơ bệnh nhân
     */
    static async linkPatient(req: Request, res: Response) {
        try {
            const currentUser = (req as any).auth;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    error_code: 'UNAUTHORIZED',
                    message: 'Không tìm thấy thông tin xác thực (Token không hợp lệ).'
                });
            }

            const payload = {
                patient_code: req.body.patient_code,
                verification_data: req.body.verification_data
            };

            const result = await patientMobileService.linkPatient(payload, currentUser);

            return res.status(200).json({
                success: true,
                message: 'Liên kết hồ sơ bệnh nhân thành công.',
                data: result
            });

        } catch (error: any) {
            if (error && error.httpCode) {
                return res.status(error.httpCode).json({
                    success: false,
                    error_code: error.code,
                    message: error.message
                });
            }

            // Log an toàn hơn để dễ track lỗi
            console.error('[PatientMobileController - linkPatient] Lỗi hệ thống:', error?.message || error);

            return res.status(500).json({
                success: false,
                error_code: 'INTERNAL_SERVER_ERROR',
                message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
            });
        }
    }
}