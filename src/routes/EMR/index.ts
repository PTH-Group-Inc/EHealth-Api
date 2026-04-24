import { Router } from 'express';
import { encounterRoutes } from './encounter.routes';
import { clinicalExamRoutes } from './clinical-exam.routes';
import { diagnosisRoutes } from './diagnosis.routes';
import { medicalRecordRoutes } from './medical-record.routes';
import { treatmentProgressRoutes } from './treatment-progress.routes';
import { signOffRoutes } from './medical-signoff.routes';
import medicalOrderRoutes from './medical-order.routes';
import { prescriptionRoutes } from './prescription.routes';

const router = Router();

router.use('/encounters', encounterRoutes);
router.use('/clinical-examinations', clinicalExamRoutes);
router.use('/diagnoses', diagnosisRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/treatment-plans', treatmentProgressRoutes);
router.use('/sign-off', signOffRoutes);
router.use('/medical-orders', medicalOrderRoutes);
router.use('/prescriptions', prescriptionRoutes);

export default router;
