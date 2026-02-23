// file: routes/patient.route.ts
import { Router } from 'express';
import { PatientController } from '../controllers/patient_patient.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';

const patientRoutes = Router();

// tạo hồ sơ bệnh nhân
patientRoutes.post('/', PatientController.createPatient);

export default patientRoutes;