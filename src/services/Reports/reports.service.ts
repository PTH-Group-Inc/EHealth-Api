import {
    DashboardDepartmentRow,
    MedicineAlertRow,
    ReportBucket,
    ReportsRepository,
    RevenueDepartmentRow,
    RevenueDoctorRow,
} from '../../repository/Reports/reports.repository';

type ReportPeriod = 'month' | 'quarter' | 'year';

interface DashboardStats {
    totalRevenue: number;
    revenueChange: number;
    todayVisits: number;
    visitsChange: number;
    doctorsOnDuty: number;
    totalDoctors: number;
    medicineAlerts: number;
}

interface DashboardOverview {
    totalPatients: number;
    patientChange: number;
    avgDailyVisits: number;
    visitChange: number;
    rating: number;
    ratingTrend: 'up' | 'down' | 'flat';
}

interface DashboardDepartmentCard {
    department: string;
    icon: string;
    color: string;
    totalDoctors: number;
    onDuty: number;
    patientsWaiting: number;
}

interface DashboardReport {
    stats: DashboardStats;
    patientGrowth: Array<{ month: string; value: number }>;
    revenueData: Array<{ month: string; value: number }>;
    departments: DashboardDepartmentCard[];
    upcomingAppointments: Array<{
        id: string;
        patientName: string;
        patientAge: number | null;
        doctorName: string;
        department: string;
        time: string;
        date: string;
        status: string;
        type: string;
    }>;
    patientQueue: Array<{
        id: string;
        order: number;
        patientName: string;
        patientCode: string;
        department: string;
        doctor: string;
        waitTime: string;
        status: string;
    }>;
    medicineAlerts: MedicineAlertRow[];
    fillRate: number;
    overview: DashboardOverview;
}

interface RevenueReport {
    total: number;
    growth: number;
    avgPerDoctor: number;
    avgChange: number;
    totalPatients: number;
    patientGrowth: number;
    chartData: Array<{ label: string; value: number }>;
    byDepartment: RevenueDepartmentRow[];
    comparison: Array<{ label: string; revenue: number; target: number }>;
    topDoctors: RevenueDoctorRow[];
}

const DEPARTMENT_VISUALS = [
    { icon: 'cardiology', color: '#ef4444' },
    { icon: 'neurology', color: '#3b82f6' },
    { icon: 'pediatrics', color: '#f59e0b' },
    { icon: 'dermatology', color: '#10b981' },
    { icon: 'stethoscope', color: '#8b5cf6' },
    { icon: 'local_hospital', color: '#06b6d4' },
];

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const cloneDate = (date: Date): Date => new Date(date.getTime());

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const startOfQuarter = (date: Date): Date => new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);

const startOfYear = (date: Date): Date => new Date(date.getFullYear(), 0, 1);

const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addDays = (date: Date, days: number): Date => {
    const next = cloneDate(date);
    next.setDate(next.getDate() + days);
    return next;
};

const addMonths = (date: Date, months: number): Date => new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

const diffDaysInclusive = (start: string, end: string): number => {
    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T00:00:00.000Z`);
    return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
};

const round = (value: number): number => Math.round(value);

const percentChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return round(((current - previous) / previous) * 100);
};

const averagePerDay = (total: number, days: number): number => {
    if (days <= 0) {
        return 0;
    }
    return round(total / days);
};

const buildMonthBuckets = (months: number, now: Date): ReportBucket[] => {
    const buckets: ReportBucket[] = [];
    for (let index = months - 1; index >= 0; index -= 1) {
        const bucketDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const start = startOfMonth(bucketDate);
        const end = endOfMonth(bucketDate);
        buckets.push({
            label: `T${bucketDate.getMonth() + 1}`,
            start: formatDate(start),
            end: formatDate(end),
        });
    }
    return buckets;
};

const buildRevenueBuckets = (period: ReportPeriod, start: string, end: string): ReportBucket[] => {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);

    if (period === 'month') {
        const buckets: ReportBucket[] = [];
        let current = cloneDate(startDate);
        let week = 1;
        while (current <= endDate) {
            const bucketStart = cloneDate(current);
            const bucketEnd = addDays(bucketStart, 6);
            buckets.push({
                label: `Tuần ${week}`,
                start: formatDate(bucketStart),
                end: formatDate(bucketEnd > endDate ? endDate : bucketEnd),
            });
            current = addDays(bucketEnd, 1);
            week += 1;
        }
        return buckets;
    }

    if (period === 'quarter') {
        const buckets: ReportBucket[] = [];
        let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (current <= endDate) {
            const bucketStart = cloneDate(current);
            const monthEnd = endOfMonth(current);
            buckets.push({
                label: `Th${current.getMonth() + 1}`,
                start: formatDate(bucketStart),
                end: formatDate(monthEnd > endDate ? endDate : monthEnd),
            });
            current = addMonths(current, 1);
        }
        return buckets;
    }

    const buckets: ReportBucket[] = [];
    let currentQuarterStart = startOfQuarter(startDate);
    let quarter = 1;
    while (currentQuarterStart <= endDate) {
        const bucketStart = cloneDate(currentQuarterStart);
        const bucketEnd = addDays(addMonths(bucketStart, 3), -1);
        buckets.push({
            label: `Q${quarter}`,
            start: formatDate(bucketStart < startDate ? startDate : bucketStart),
            end: formatDate(bucketEnd > endDate ? endDate : bucketEnd),
        });
        currentQuarterStart = addMonths(currentQuarterStart, 3);
        quarter += 1;
    }
    return buckets;
};

const withDepartmentVisuals = (rows: DashboardDepartmentRow[]): DashboardDepartmentCard[] =>
    rows.map((row, index) => ({
        ...row,
        icon: DEPARTMENT_VISUALS[index % DEPARTMENT_VISUALS.length].icon,
        color: DEPARTMENT_VISUALS[index % DEPARTMENT_VISUALS.length].color,
    }));

const emptyDashboardReport = (): DashboardReport => ({
    stats: {
        totalRevenue: 0,
        revenueChange: 0,
        todayVisits: 0,
        visitsChange: 0,
        doctorsOnDuty: 0,
        totalDoctors: 0,
        medicineAlerts: 0,
    },
    patientGrowth: [],
    revenueData: [],
    departments: [],
    upcomingAppointments: [],
    patientQueue: [],
    medicineAlerts: [],
    fillRate: 0,
    overview: {
        totalPatients: 0,
        patientChange: 0,
        avgDailyVisits: 0,
        visitChange: 0,
        rating: 0,
        ratingTrend: 'flat',
    },
});

const emptyRevenueReport = (): RevenueReport => ({
    total: 0,
    growth: 0,
    avgPerDoctor: 0,
    avgChange: 0,
    totalPatients: 0,
    patientGrowth: 0,
    chartData: [],
    byDepartment: [],
    comparison: [],
    topDoctors: [],
});

const resolveRange = (period: ReportPeriod, from?: string, to?: string): {
    start: string;
    end: string;
    previousStart: string;
    previousEnd: string;
} => {
    if (from && to) {
        const span = diffDaysInclusive(from, to);
        const previousEndDate = addDays(new Date(`${from}T00:00:00`), -1);
        const previousStartDate = addDays(previousEndDate, -(span - 1));
        return {
            start: from,
            end: to,
            previousStart: formatDate(previousStartDate),
            previousEnd: formatDate(previousEndDate),
        };
    }

    const now = new Date();
    const end = formatDate(now);
    let startDate = startOfMonth(now);

    if (period === 'quarter') {
        startDate = startOfQuarter(now);
    } else if (period === 'year') {
        startDate = startOfYear(now);
    }

    const start = formatDate(startDate);
    const span = diffDaysInclusive(start, end);
    const previousEndDate = addDays(startDate, -1);
    const previousStartDate = addDays(previousEndDate, -(span - 1));

    return {
        start,
        end,
        previousStart: formatDate(previousStartDate),
        previousEnd: formatDate(previousEndDate),
    };
};

export class ReportsService {
    static async getDashboardReport(): Promise<DashboardReport> {
        const report = emptyDashboardReport();
        const now = new Date();
        const today = formatDate(now);
        const yesterday = formatDate(addDays(now, -1));
        const monthStart = formatDate(startOfMonth(now));
        const previousMonthEnd = formatDate(addDays(startOfMonth(now), -1));
        const previousMonthStart = formatDate(startOfMonth(addDays(startOfMonth(now), -1)));

        const [
            totalPatients,
            currentMonthPatients,
            previousMonthPatients,
            currentMonthAppointments,
            previousMonthAppointments,
            todayVisits,
            yesterdayVisits,
            doctorCoverage,
            departmentRows,
            upcomingAppointments,
            queueRows,
            medicineAlerts,
            fillRate,
            currentMonthRevenue,
            previousMonthRevenue,
            patientGrowth,
            revenueData,
        ] = await Promise.all([
            ReportsRepository.getTotalPatients(),
            ReportsRepository.getPatientRegistrations(monthStart, formatDate(now)),
            ReportsRepository.getPatientRegistrations(previousMonthStart, previousMonthEnd),
            ReportsRepository.getAppointmentCount(monthStart, formatDate(now)),
            ReportsRepository.getAppointmentCount(previousMonthStart, previousMonthEnd),
            ReportsRepository.getTodayVisitCount(today),
            ReportsRepository.getTodayVisitCount(yesterday),
            ReportsRepository.getDoctorCoverage(today),
            ReportsRepository.getDepartmentSnapshot(today),
            ReportsRepository.getUpcomingAppointments(today),
            ReportsRepository.getQueueSnapshot(today),
            ReportsRepository.getMedicineAlerts(),
            ReportsRepository.getFillRate(today),
            ReportsRepository.getNetRevenue(monthStart, formatDate(now)),
            ReportsRepository.getNetRevenue(previousMonthStart, previousMonthEnd),
            ReportsRepository.getPatientRegistrationsByBuckets(buildMonthBuckets(6, now)).then((rows) =>
                rows.map((row) => ({ month: row.label, value: row.value }))
            ),
            ReportsRepository.getRevenueByBuckets(buildMonthBuckets(6, now)).then((rows) =>
                rows.map((row) => ({ month: row.label, value: row.value }))
            ),
        ]);

        report.stats = {
            totalRevenue: currentMonthRevenue,
            revenueChange: percentChange(currentMonthRevenue, previousMonthRevenue),
            todayVisits,
            visitsChange: percentChange(todayVisits, yesterdayVisits),
            doctorsOnDuty: doctorCoverage.doctorsOnDuty,
            totalDoctors: doctorCoverage.totalDoctors,
            medicineAlerts: medicineAlerts.length,
        };

        report.patientGrowth = patientGrowth;
        report.revenueData = revenueData;
        report.departments = withDepartmentVisuals(departmentRows);
        report.upcomingAppointments = upcomingAppointments;
        report.patientQueue = queueRows;
        report.medicineAlerts = medicineAlerts;
        report.fillRate = fillRate.fillRate;
        report.overview = {
            totalPatients,
            patientChange: percentChange(currentMonthPatients, previousMonthPatients),
            avgDailyVisits: averagePerDay(currentMonthAppointments, now.getDate()),
            visitChange: percentChange(
                averagePerDay(currentMonthAppointments, now.getDate()),
                averagePerDay(previousMonthAppointments, new Date(previousMonthEnd).getDate())
            ),
            rating: 0,
            ratingTrend: 'flat',
        };

        return report;
    }

    static async getRevenueReport(period: ReportPeriod = 'month', from?: string, to?: string): Promise<RevenueReport> {
        const report = emptyRevenueReport();
        const { start, end, previousStart, previousEnd } = resolveRange(period, from, to);

        const currentBuckets = buildRevenueBuckets(period, start, end);
        const previousBuckets = buildRevenueBuckets(period, previousStart, previousEnd);

        const [
            total,
            previousTotal,
            totalPatients,
            previousPatients,
            doctorCount,
            previousDoctorCount,
            chartData,
            previousChartData,
            byDepartment,
            topDoctors,
        ] = await Promise.all([
            ReportsRepository.getNetRevenue(start, end),
            ReportsRepository.getNetRevenue(previousStart, previousEnd),
            ReportsRepository.getPaidPatientCount(start, end),
            ReportsRepository.getPaidPatientCount(previousStart, previousEnd),
            ReportsRepository.getDoctorsWithRevenueCount(start, end),
            ReportsRepository.getDoctorsWithRevenueCount(previousStart, previousEnd),
            ReportsRepository.getRevenueByBuckets(currentBuckets),
            ReportsRepository.getRevenueByBuckets(previousBuckets),
            ReportsRepository.getRevenueByDepartment(start, end),
            ReportsRepository.getTopDoctorsByRevenue(start, end),
        ]);

        const avgPerDoctor = doctorCount > 0 ? round(total / doctorCount) : 0;
        const previousAvgPerDoctor = previousDoctorCount > 0 ? round(previousTotal / previousDoctorCount) : 0;

        report.total = total;
        report.growth = percentChange(total, previousTotal);
        report.avgPerDoctor = avgPerDoctor;
        report.avgChange = percentChange(avgPerDoctor, previousAvgPerDoctor);
        report.totalPatients = totalPatients;
        report.patientGrowth = percentChange(totalPatients, previousPatients);
        report.chartData = chartData;
        report.byDepartment = byDepartment;
        report.comparison = chartData.map((item, index) => ({
            label: item.label,
            revenue: item.value,
            target: previousChartData[index]?.value ?? 0,
        }));
        report.topDoctors = topDoctors;

        return report;
    }
}
