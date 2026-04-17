import { Router } from 'express';
import { ReportsController } from '../../controllers/Reports/reports.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

export const reportsRoutes = Router();

reportsRoutes.get('/dashboard', verifyAccessToken, checkSessionStatus, ReportsController.getDashboard);
reportsRoutes.get('/revenue', verifyAccessToken, checkSessionStatus, ReportsController.getRevenue);
