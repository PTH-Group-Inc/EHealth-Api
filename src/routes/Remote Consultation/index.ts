import { Router } from 'express';
import { teleConsultationTypeRoutes } from './tele-consultation-type.routes';
import { teleBookingRoutes } from './tele-booking.routes';
import { teleRoomRoutes } from './tele-room.routes';
import { medicalChatRoutes } from './tele-medical-chat.routes';
import { teleResultRoutes } from './tele-result.routes';
import { telePrescriptionRoutes } from './tele-prescription.routes';
import { teleFollowUpRoutes } from './tele-followup.routes';
import { teleQualityRoutes } from './tele-quality.routes';
import { teleConfigRoutes } from './tele-config.routes';

const router = Router();

router.use('/teleconsultation', teleConsultationTypeRoutes);
router.use('/teleconsultation', teleBookingRoutes);
router.use('/teleconsultation', teleRoomRoutes);
router.use('/teleconsultation', medicalChatRoutes);
router.use('/teleconsultation', teleResultRoutes);
router.use('/teleconsultation', telePrescriptionRoutes);
router.use('/teleconsultation', teleFollowUpRoutes);
router.use('/teleconsultation', teleQualityRoutes);
router.use('/teleconsultation', teleConfigRoutes);

export default router;
