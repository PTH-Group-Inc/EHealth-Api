import { Router, Request, Response } from 'express';
import { pool } from '../../config/postgresdb';
import { register } from '../../config/metrics';

const router = Router();

// Liveness probe (Kubernetes / load balancer)
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// General health check
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness probe
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check DB connection
    await pool.query('SELECT 1');
    
    res.status(200).json({ status: 'ready', dependencies: { database: 'ok' } });
  } catch (error) {
    res.status(503).json({ status: 'error', dependencies: { database: 'failed' } });
  }
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

export default router;
