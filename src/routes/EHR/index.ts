import { Router } from 'express';
import { healthProfileRoutes } from './health-profile.routes';
import { healthTimelineRoutes } from './health-timeline.routes';
import { medicalHistoryEhrRoutes } from './medical-history-ehr.routes';
import { clinicalResultsRoutes } from './clinical-results.routes';
import { medicationTreatmentRoutes } from './medication-treatment.routes';
import { vitalSignsRoutes } from './vital-signs.routes';
import { dataIntegrationRoutes } from './data-integration.routes';

const router = Router();

router.use('/ehr', healthProfileRoutes);
router.use('/ehr', healthTimelineRoutes);
router.use('/ehr', medicalHistoryEhrRoutes);
router.use('/ehr', clinicalResultsRoutes);
router.use('/ehr', medicationTreatmentRoutes);
router.use('/ehr', vitalSignsRoutes);
router.use('/ehr', dataIntegrationRoutes);

export default router;
