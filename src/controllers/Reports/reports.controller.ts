import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ReportsService } from '../../services/Reports/reports.service';

export class ReportsController {
    static getDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const data = await ReportsService.getDashboardReport();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Lấy dashboard báo cáo thành công.',
            data,
        });
    });

    static getRevenue = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const period = (req.query.period as 'month' | 'quarter' | 'year' | undefined) ?? 'month';
        const from = typeof req.query.from === 'string' ? req.query.from : undefined;
        const to = typeof req.query.to === 'string' ? req.query.to : undefined;

        const data = await ReportsService.getRevenueReport(period, from, to);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Lấy báo cáo doanh thu thành công.',
            data,
        });
    });
}
