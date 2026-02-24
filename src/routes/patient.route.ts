// file: routes/patient.route.ts
import { Router } from 'express';
import { PatientController } from '../controllers/patient_patient.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';

const patientRoutes = Router();

// tạo hồ sơ bệnh nhân
patientRoutes.post('/', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'SYSTEM'), PatientController.createPatient);

// Cập nhật thông tin hành chính bệnh nhân
patientRoutes.put('/:patient_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updatePatientInfo);




export default patientRoutes;