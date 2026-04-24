import { Express, Router } from 'express';
import { verifySepayWebhook } from '../middleware/verifyWebhook.middleware';
import { sepayWebhook } from '../controllers/Billing/billing-payment-gateway.controller';
import { auditMiddleware } from '../middleware/audit.middleware';

import healthRoutes from './Core/health.routes';
import CoreRoutes from './Core';
import MedicationManagementRoutes from './Medication Management';
import FacilityManagementRoutes from './Facility Management';
import PatientManagementRoutes from './Patient Management';
import AppointmentManagementRoutes from './Appointment Management';
import EMRRoutes from './EMR';
import EHRRoutes from './EHR';
import BillingRoutes from './Billing';
import ReportsRoutes from './Reports';
import RemoteConsultationRoutes from './Remote Consultation';

const v1Routes = Router();
v1Routes.use((req, res, next) => {
    res.setHeader('X-API-Version', 'v1');
    next();
});

export const initRoutes = (app: Express) => {
    // Health checks and metrics (Before Audit Middleware to avoid logging)
    app.use('/', healthRoutes);

    // Audit Middleware
    app.use(auditMiddleware);

    // Grouped routes
    v1Routes.use('/', CoreRoutes);
    v1Routes.use('/', MedicationManagementRoutes);
    v1Routes.use('/', FacilityManagementRoutes);
    v1Routes.use('/', PatientManagementRoutes);
    v1Routes.use('/', AppointmentManagementRoutes);
    v1Routes.use('/', EMRRoutes);
    v1Routes.use('/', EHRRoutes);
    v1Routes.use('/', BillingRoutes);
    v1Routes.use('/', ReportsRoutes);
    v1Routes.use('/', RemoteConsultationRoutes);

    // Webhook alias — Nginx strip /api/ nên SePay gọi /api/hooks/sepay-payment → Express nhận /hooks/sepay-payment
    app.use('/api/v1', v1Routes);
    app.use('/api', v1Routes);

    app.post('/hooks/sepay-payment', verifySepayWebhook, sepayWebhook);
    // Alias for the user's specific SePay configuration
    app.post('/api/v1/billing/payment-gateway/sepay/webhook', verifySepayWebhook, sepayWebhook);
}
