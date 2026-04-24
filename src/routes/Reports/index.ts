import { Router } from 'express';
import { reportsRoutes } from './reports.routes';

const router = Router();

router.use('/reports', reportsRoutes);

export default router;
