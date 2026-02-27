// file: routes/patient.route.ts
import { Router } from 'express';
import { PatientController } from '../controllers/patient_patient.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';

const patientRoutes = Router();

// Lấy danh sách bệnh nhân
patientRoutes.get('/', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF', 'DOCTOR', 'PHARMACIST'), PatientController.getPatientsList);

// tạo hồ sơ bệnh nhân
patientRoutes.post('/', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'SYSTEM'), PatientController.createPatient);

// Cập nhật thông tin hành chính bệnh nhân
patientRoutes.put('/:patient_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updatePatientInfo);

// Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE / DECEASED)
patientRoutes.patch('/:patient_id/status',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.updatePatientStatus);

// Liên kết hồ sơ bệnh nhân và thông tin định danh
patientRoutes.post('/link', verifyAccessToken, authorizeRoles('CUSTOMER'), PatientController.linkPatient);

export default patientRoutes;