import { Request, Response } from 'express';
import { patientService } from '../services/patient_patient.service';

export class PatientController {

  /**
   * Lấy danh sách hồ sơ bệnh nhân
   */
  static async getPatientsList(req: Request, res: Response) {
    try {
      const currentUser = (req as any).auth;

      // Kiểm tra xác thực
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Không tìm thấy thông tin xác thực (Token không hợp lệ).'
        });
      }

      // Gọi  Service
      const result = await patientService.getPatientsListLogic(req.query);

      // Trả về response
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách hồ sơ bệnh nhân thành công.',
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

      // Lỗi hệ thống
      console.error('[PatientController - getPatientsList] Lỗi không xác định:', error);
      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }


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

      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }


  /**
   * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE, INACTIVE, DECEASED)
   */
  static async updatePatientStatus(req: Request, res: Response) {
    try {
      const patient_id = req.params.patient_id as string;
      const { status, status_reason } = req.body;
      const currentUser = (req as any).auth;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Không tìm thấy thông tin xác thực (Token không hợp lệ).'
        });
      }

      const result = await patientService.updatePatientStatusLogic(
        patient_id,
        { status, status_reason },
        currentUser
      );

      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái hồ sơ bệnh nhân thành công.',
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

      // Lỗi hệ thống không lường trước được
      console.error('[PatientController - updatePatientStatus] Lỗi không xác định:', error);
      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }




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

      const result = await patientService.linkPatient(payload, currentUser);

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




  /**
   * Cập nhật thông tin liên hệ của bệnh nhân
   */
  static async updatePatientContact(req: Request, res: Response) {
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

      const result = await patientService.updatePatientContactLogic(
        patient_id, 
        payload, 
        currentUser
      );

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin liên hệ thành công.',
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

      console.error('[PatientController - updatePatientContact] Lỗi không xác định:', error);
      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }

  /**
   * Thêm mới thông tin người nhà bệnh nhân
   */
  static async addPatientRelation(req: Request, res: Response) {
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

      // Gọi logic Service
      const result = await patientService.addPatientRelationLogic(
        patient_id, 
        payload, 
        currentUser
      );

      return res.status(201).json({
        success: true,
        message: 'Thêm mới thông tin người nhà thành công.',
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

      console.error('[PatientController - addPatientRelation] Lỗi không xác định:', error);
      return res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }


}