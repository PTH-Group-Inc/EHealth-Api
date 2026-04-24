import { Router } from 'express';
import { appointmentRoutes } from './appointment.routes';
import { consultationDurationRoutes } from './consultation-duration.routes';
import { lockedSlotRoutes } from './locked-slot.routes';
import { shiftServiceRoutes } from './shift-service.routes';
import { doctorAvailabilityRoutes } from './doctor-availability.routes';
import { doctorAbsenceRoutes } from './doctor-absence.routes';
import { appointmentConfirmationRoutes } from './appointment-confirmation.routes';
import { appointmentStatusRoutes } from './appointment-status.routes';
import appointmentChangeRoutes from './appointment-change.routes';
import appointmentCoordinationRoutes from './appointment-coordination.routes';

const router = Router();

router.use('/appointments', appointmentRoutes);
router.use('/facilities', consultationDurationRoutes);
router.use('/locked-slots', lockedSlotRoutes);
router.use('/shift-services', shiftServiceRoutes);
router.use('/doctor-availability', doctorAvailabilityRoutes);
router.use('/doctor-absences', doctorAbsenceRoutes);
router.use('/appointment-confirmations', appointmentConfirmationRoutes);
router.use('/appointment-status', appointmentStatusRoutes);
router.use('/appointment-changes', appointmentChangeRoutes);
router.use('/appointment-coordination', appointmentCoordinationRoutes);

export default router;
