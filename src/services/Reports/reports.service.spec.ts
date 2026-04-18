import { ReportsService } from './reports.service';
import { ReportsRepository } from '../../repository/Reports/reports.repository';

jest.mock('../../repository/Reports/reports.repository', () => ({
    ReportsRepository: {
        getNetRevenue: jest.fn(),
        getRevenueByBuckets: jest.fn(),
        getPaidPatientCount: jest.fn(),
        getDoctorsWithRevenueCount: jest.fn(),
        getPatientRegistrations: jest.fn(),
        getPatientRegistrationsByBuckets: jest.fn(),
        getTotalPatients: jest.fn(),
        getAppointmentCount: jest.fn(),
        getTodayVisitCount: jest.fn(),
        getDoctorCoverage: jest.fn(),
        getDepartmentSnapshot: jest.fn(),
        getUpcomingAppointments: jest.fn(),
        getQueueSnapshot: jest.fn(),
        getMedicineAlerts: jest.fn(),
        getFillRate: jest.fn(),
        getRevenueByDepartment: jest.fn(),
        getTopDoctorsByRevenue: jest.fn(),
    },
}));

describe('ReportsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (ReportsRepository.getNetRevenue as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getRevenueByBuckets as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getPaidPatientCount as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getDoctorsWithRevenueCount as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getPatientRegistrations as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getPatientRegistrationsByBuckets as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getTotalPatients as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getAppointmentCount as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getTodayVisitCount as jest.Mock).mockResolvedValue(0);
        (ReportsRepository.getDoctorCoverage as jest.Mock).mockResolvedValue({ totalDoctors: 0, doctorsOnDuty: 0 });
        (ReportsRepository.getDepartmentSnapshot as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getUpcomingAppointments as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getQueueSnapshot as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getMedicineAlerts as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getFillRate as jest.Mock).mockResolvedValue({ booked: 0, capacity: 0, fillRate: 0 });
        (ReportsRepository.getRevenueByDepartment as jest.Mock).mockResolvedValue([]);
        (ReportsRepository.getTopDoctorsByRevenue as jest.Mock).mockResolvedValue([]);
    });

    it('returns an empty-but-valid dashboard shape when data sources are empty', async () => {
        const report = await ReportsService.getDashboardReport();

        expect(report).toEqual(
            expect.objectContaining({
                stats: expect.objectContaining({
                    totalRevenue: 0,
                    todayVisits: 0,
                    doctorsOnDuty: 0,
                    totalDoctors: 0,
                }),
                patientGrowth: expect.any(Array),
                revenueData: expect.any(Array),
                departments: expect.any(Array),
                medicineAlerts: expect.any(Array),
                overview: expect.objectContaining({
                    totalPatients: 0,
                    rating: 0,
                    ratingTrend: 'flat',
                }),
            })
        );
    });

    it('keeps revenue totals as raw numbers and supports explicit from/to ranges', async () => {
        (ReportsRepository.getNetRevenue as jest.Mock)
            .mockResolvedValueOnce(12500000)
            .mockResolvedValueOnce(10000000);
        (ReportsRepository.getPaidPatientCount as jest.Mock)
            .mockResolvedValueOnce(18)
            .mockResolvedValueOnce(12);
        (ReportsRepository.getDoctorsWithRevenueCount as jest.Mock)
            .mockResolvedValueOnce(5)
            .mockResolvedValueOnce(4);
        (ReportsRepository.getRevenueByBuckets as jest.Mock)
            .mockResolvedValueOnce([{ label: 'Tuần 1', value: 4000000 }])
            .mockResolvedValueOnce([{ label: 'Tuần 1', value: 3000000 }]);

        const report = await ReportsService.getRevenueReport('month', '2026-04-01', '2026-04-17');

        expect(report.total).toBe(12500000);
        expect(report.avgPerDoctor).toBe(2500000);
        expect(report.chartData).toEqual([{ label: 'Tuần 1', value: 4000000 }]);
        expect(report.comparison).toEqual([{ label: 'Tuần 1', revenue: 4000000, target: 3000000 }]);
    });

    it.each(['month', 'quarter', 'year'] as const)('builds revenue reports without custom dates for %s period', async (period) => {
        const report = await ReportsService.getRevenueReport(period);

        expect(report).toEqual(
            expect.objectContaining({
                total: expect.any(Number),
                growth: expect.any(Number),
                chartData: expect.any(Array),
                comparison: expect.any(Array),
            })
        );
    });
});
