import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { initRoutes } from './routes/index.route'
import { SessionCleanup } from './jobs/SessionCleanup.jobs'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #4a90e2; }',
  customSiteTitle: 'E-Health API Documentation',
}))

initRoutes(app);

SessionCleanup.startSessionCleanupJob();

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Global Error]:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi máy chủ nội bộ'
    });
});

export default app