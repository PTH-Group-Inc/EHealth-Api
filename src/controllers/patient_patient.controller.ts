import { Request, Response } from 'express';
import { patientService } from '../services/patient_patient.service';

export class PatientController {
  /**
   * Tạo hồ sơ bệnh nhân mới
   */
  static async createPatient(req: Request, res: Response) {
    try {
      const payload = req.body;

      const currentUser = (req as any).auth;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Không tìm thấy thông tin xác thực (Token không hợp lệ).'
        });
      }

      const result = await patientService.createPatientProfile(payload, currentUser);

      return res.status(201).json({
        success: true,
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

      console.error('[PatientController] Lỗi không xác định:', error);
      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }


  /**
   * Cập nhật thông tin hành chính bệnh nhân (Chỉ dành cho Lễ tân, Admin)
   */
  static async updatePatientInfo(req: Request, res: Response) {
    try {
      const patient_id = req.params.patient_id as string;

      const payload = req.body;

      const currentUser = (req as any).auth;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Không tìm thấy thông tin xác thực (Token không hợp lệ).'
        });
      }

      const result = await patientService.updatePatientAdminInfo(
        patient_id,
        payload,
        currentUser
      );

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin hành chính thành công',
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

      console.error('[PatientController - updatePatientInfo] Lỗi không xác định:', error);
      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }
}