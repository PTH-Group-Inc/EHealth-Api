import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { initRoutes } from './routes/index.route'
import { SessionCleanup } from './jobs/SessionCleanup.jobs'
import { AppointmentReminderJob } from './jobs/AppointmentReminder.jobs'
import { startPaymentOrderExpiryJob } from './jobs/PaymentOrderExpiry.jobs'
import { startAppointmentNoShowJob } from './jobs/AppointmentNoShow.jobs'
import morganMiddleware from './middleware/morgan.middleware'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware'
import { globalApiRateLimiter } from './middleware/rate_limit.middleware'

const app = express()

app.use(cors())
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}))
app.use(express.urlencoded({ extended: true }))
app.use(morganMiddleware)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #4a90e2; }',
  customSiteTitle: 'E-Health API Documentation',
}))

// Apply global rate limiting to all /api routes
app.use('/api', globalApiRateLimiter)

initRoutes(app);

SessionCleanup.startSessionCleanupJob();
AppointmentReminderJob.startReminderJob();
startPaymentOrderExpiryJob();
startAppointmentNoShowJob();

// ─── 404 Handler ─── Đặt sau tất cả routes
app.use(notFoundHandler);

// ─── Global Error Handler ─── Luôn đặt cuối cùng
app.use(errorHandler);

export default app