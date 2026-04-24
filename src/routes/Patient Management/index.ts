import { Router } from 'express';
import { patientRoutes } from './patient.routes';
import patientProfileRoutes from './patient-profile.routes';
import { medicalHistoryRoutes } from './medical-history.routes';
import insuranceProviderRoutes from './insurance-provider.routes';
import patientInsuranceRoutes from './patient-insurance.routes';
import insuranceCoverageRoutes from './insurance-coverage.routes';
import { relationTypeRoutes } from './relation-type.routes';
import { patientContactRoutes } from './patient-contact.routes';
import { documentTypeRoutes } from './document-type.routes';
import { patientDocumentRoutes } from './patient-document.routes';
import { patientTagRoutes } from './patient-tag.routes';
import { classificationRuleRoutes } from './classification-rule.routes';

const router = Router();

router.use('/patient/profiles', patientProfileRoutes);
router.use('/patients', patientRoutes);
router.use('/medical-history', medicalHistoryRoutes);
router.use('/insurance-providers', insuranceProviderRoutes);
router.use('/patient-insurances', patientInsuranceRoutes);
router.use('/insurance-coverage', insuranceCoverageRoutes);
router.use('/relation-types', relationTypeRoutes);
router.use('/patient-relations', patientContactRoutes);
router.use('/document-types', documentTypeRoutes);
router.use('/patient-documents', patientDocumentRoutes);
router.use('/patient-tags', patientTagRoutes);
router.use('/patient-classification-rules', classificationRuleRoutes);

export default router;
