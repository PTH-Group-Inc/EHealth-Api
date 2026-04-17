import { Request, Response, NextFunction } from 'express';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../../services/Reports/reports.service';

jest.mock('../../services/Reports/reports.service', () => ({
    ReportsService: {
        getDashboardReport: jest.fn(),
        getRevenueReport: jest.fn(),
    },
}));

describe('ReportsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = { query: {} };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    it('returns 200 for dashboard report', async () => {
        (ReportsService.getDashboardReport as jest.Mock).mockResolvedValue({
            stats: { totalRevenue: 0 },
            patientGrowth: [],
            revenueData: [],
            departments: [],
            upcomingAppointments: [],
            patientQueue: [],
            medicineAlerts: [],
            fillRate: 0,
            overview: { totalPatients: 0 },
        });

        await ReportsController.getDashboard(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    stats: expect.any(Object),
                    patientGrowth: expect.any(Array),
                    revenueData: expect.any(Array),
                }),
            })
        );
    });

    it('returns 200 for revenue report', async () => {
        mockRequest.query = { period: 'month', from: '2026-04-01', to: '2026-04-17' };
        (ReportsService.getRevenueReport as jest.Mock).mockResolvedValue({
            total: 1000000,
            growth: 10,
            avgPerDoctor: 500000,
            avgChange: 5,
            totalPatients: 12,
            patientGrowth: 8,
            chartData: [],
            byDepartment: [],
            comparison: [],
            topDoctors: [],
        });

        await ReportsController.getRevenue(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(ReportsService.getRevenueReport).toHaveBeenCalledWith('month', '2026-04-01', '2026-04-17');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    total: 1000000,
                    chartData: expect.any(Array),
                }),
            })
        );
    });
});
