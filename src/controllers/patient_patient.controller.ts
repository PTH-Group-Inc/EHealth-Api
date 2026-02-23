import { Request, Response } from 'express';
import { patientService } from '../services/patient_patient.service';

export class PatientController {
  /**
   * Tạo hồ sơ bệnh nhân mới
   */
  static async createPatient(req: Request, res: Response) {
    try {
      const payload = req.body;
      
      // Gọi tầng Service để xử lý nghiệp vụ
      const result = await patientService.createPatientProfile(payload);

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
}