import { pool } from '../../config/postgresdb';
import { BillingReconciliationRepository } from '../Billing/billing-reconciliation.repository';
import { InventoryRepository } from '../Medication Management/inventory.repository';

export interface ReportBucket {
    label: string;
    start: string;
    end: string;
}

export interface DashboardDepartmentRow {
    department: string;
    totalDoctors: number;
    onDuty: number;
    patientsWaiting: number;
}

export interface UpcomingAppointmentRow {
    id: string;
    patientName: string;
    patientAge: number | null;
    doctorName: string;
    department: string;
    time: string;
    date: string;
    status: string;
    type: string;
}

export interface QueueRow {
    id: string;
    order: number;
    patientName: string;
    patientCode: string;
    department: string;
    doctor: string;
    waitTime: string;
    status: string;
}

export interface MedicineAlertRow {
    id: string;
    name: string;
    code: string;
    stock: number;
    unit: string;
    alertType: string;
    alertLabel: string;
    expiryDate: string | null;
}

export interface RevenueDepartmentRow {
    departmentName: string;
    revenue: number;
    patientCount: number;
}

export interface RevenueDoctorRow {
    name: string;
    departmentName: string;
    revenue: number;
    patientCount: number;
}

const toNumber = (value: unknown): number => Number(value ?? 0);

export class ReportsRepository {
    static async getNetRevenue(periodStart: string, periodEnd: string, facilityId?: string): Promise<number> {
        const row = await BillingReconciliationRepository.getRevenueByPeriod(periodStart, periodEnd, facilityId);
        return toNumber(row?.total_revenue) - toNumber(row?.total_refunds) - toNumber(row?.total_voids);
    }

    static async getRevenueByBuckets(
        buckets: ReportBucket[],
        facilityId?: string
    ): Promise<Array<{ label: string; value: number }>> {
        const values = await Promise.all(
            buckets.map(async (bucket) => ({
                label: bucket.label,
                value: await this.getNetRevenue(bucket.start, bucket.end, facilityId),
            }))
        );
        return values;
    }

    static async getPaidPatientCount(periodStart: string, periodEnd: string, facilityId?: string): Promise<number> {
        const params: any[] = [periodStart, periodEnd];
        let facilityClause = '';
        if (facilityId) {
            params.push(facilityId);
            facilityClause = ` AND i.facility_id = $3`;
        }

        const result = await pool.query(
            `
                SELECT COUNT(DISTINCT i.patient_id)::int AS total
                FROM payment_transactions pt
                JOIN invoices i ON pt.invoice_id = i.invoices_id
                WHERE pt.paid_at::date BETWEEN $1 AND $2
                  AND pt.transaction_type = 'PAYMENT'
                  AND pt.status = 'SUCCESS'
                  ${facilityClause}
            `,
            params
        );

        return toNumber(result.rows[0]?.total);
    }

    static async getDoctorsWithRevenueCount(periodStart: string, periodEnd: string, facilityId?: string): Promise<number> {
        const params: any[] = [periodStart, periodEnd];
        let facilityClause = '';
        if (facilityId) {
            params.push(facilityId);
            facilityClause = ` AND i.facility_id = $3`;
        }

        const result = await pool.query(
            `
                SELECT COUNT(DISTINCT e.doctor_id)::int AS total
                FROM payment_transactions pt
                JOIN invoices i ON pt.invoice_id = i.invoices_id
                JOIN encounters e ON i.encounter_id = e.encounters_id
                WHERE pt.paid_at::date BETWEEN $1 AND $2
                  AND pt.transaction_type = 'PAYMENT'
                  AND pt.status = 'SUCCESS'
                  AND e.doctor_id IS NOT NULL
                  ${facilityClause}
            `,
            params
        );

        return toNumber(result.rows[0]?.total);
    }

    static async getPatientRegistrations(periodStart: string, periodEnd: string): Promise<number> {
        const result = await pool.query(
            `
                SELECT COUNT(*)::int AS total
                FROM patients
                WHERE created_at::date BETWEEN $1 AND $2
            `,
            [periodStart, periodEnd]
        );

        return toNumber(result.rows[0]?.total);
    }

    static async getPatientRegistrationsByBuckets(
        buckets: ReportBucket[]
    ): Promise<Array<{ label: string; value: number }>> {
        const values = await Promise.all(
            buckets.map(async (bucket) => ({
                label: bucket.label,
                value: await this.getPatientRegistrations(bucket.start, bucket.end),
            }))
        );

        return values;
    }

    static async getTotalPatients(): Promise<number> {
        const result = await pool.query(`SELECT COUNT(*)::int AS total FROM patients`);
        return toNumber(result.rows[0]?.total);
    }

    static async getAppointmentCount(periodStart: string, periodEnd: string): Promise<number> {
        const result = await pool.query(
            `
                SELECT COUNT(*)::int AS total
                FROM appointments
                WHERE appointment_date BETWEEN $1::date AND $2::date
                  AND status NOT IN ('CANCELLED', 'NO_SHOW')
            `,
            [periodStart, periodEnd]
        );

        return toNumber(result.rows[0]?.total);
    }

    static async getTodayVisitCount(date: string): Promise<number> {
        const result = await pool.query(
            `
                SELECT COUNT(*)::int AS total
                FROM appointments
                WHERE appointment_date = $1::date
                  AND status NOT IN ('CANCELLED', 'NO_SHOW')
            `,
            [date]
        );

        return toNumber(result.rows[0]?.total);
    }

    static async getDoctorCoverage(date: string): Promise<{ totalDoctors: number; doctorsOnDuty: number }> {
        const [totalResult, dutyResult] = await Promise.all([
            pool.query(
                `
                    SELECT COUNT(*)::int AS total
                    FROM doctors
                    WHERE is_active = true
                `
            ),
            pool.query(
                `
                    SELECT COUNT(DISTINCT ss.user_id)::int AS total
                    FROM staff_schedules ss
                    JOIN doctors d ON ss.user_id = d.user_id AND d.is_active = true
                    WHERE ss.working_date = $1::date
                      AND ss.status = 'ACTIVE'
                      AND COALESCE(ss.is_leave, false) = false
                `,
                [date]
            ),
        ]);

        return {
            totalDoctors: toNumber(totalResult.rows[0]?.total),
            doctorsOnDuty: toNumber(dutyResult.rows[0]?.total),
        };
    }

    static async getDepartmentSnapshot(date: string, limit: number = 6): Promise<DashboardDepartmentRow[]> {
        const result = await pool.query(
            `
                SELECT
                    dep.name AS department,
                    COALESCE((
                        SELECT COUNT(DISTINCT ubd.user_id)::int
                        FROM user_branch_dept ubd
                        JOIN user_roles ur ON ubd.user_id = ur.user_id
                        JOIN roles r ON ur.role_id = r.roles_id
                        WHERE ubd.department_id = dep.departments_id
                          AND r.code = 'DOCTOR'
                    ), 0) AS total_doctors,
                    COALESCE((
                        SELECT COUNT(DISTINCT ss.user_id)::int
                        FROM staff_schedules ss
                        JOIN medical_rooms mr ON ss.medical_room_id = mr.medical_rooms_id
                        WHERE mr.department_id = dep.departments_id
                          AND ss.working_date = $1::date
                          AND ss.status = 'ACTIVE'
                          AND COALESCE(ss.is_leave, false) = false
                    ), 0) AS on_duty,
                    COALESCE((
                        SELECT COUNT(*)::int
                        FROM appointments a
                        JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
                        WHERE mr.department_id = dep.departments_id
                          AND a.appointment_date = $1::date
                          AND a.status = 'CHECKED_IN'
                    ), 0) AS patients_waiting
                FROM departments dep
                WHERE dep.deleted_at IS NULL
                ORDER BY on_duty DESC, total_doctors DESC, dep.name ASC
                LIMIT $2
            `,
            [date, limit]
        );

        return result.rows.map((row) => ({
            department: row.department,
            totalDoctors: toNumber(row.total_doctors),
            onDuty: toNumber(row.on_duty),
            patientsWaiting: toNumber(row.patients_waiting),
        }));
    }

    static async getUpcomingAppointments(date: string, limit: number = 5): Promise<UpcomingAppointmentRow[]> {
        const result = await pool.query(
            `
                SELECT
                    a.appointments_id AS id,
                    p.full_name AS patient_name,
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int AS patient_age,
                    COALESCE(up.full_name, 'Chưa phân công') AS doctor_name,
                    COALESCE(dep.name, sp.name, 'Chưa phân khoa') AS department_name,
                    TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                    TO_CHAR(sl.start_time, 'HH24:MI') AS appointment_time,
                    a.status,
                    COALESCE(fs_svc.name, 'Khám tổng quát') AS appointment_type
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id::varchar
                LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
                LEFT JOIN user_profiles up ON d.user_id = up.user_id
                LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
                LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
                LEFT JOIN departments dep ON mr.department_id = dep.departments_id
                LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
                LEFT JOIN facility_services fs ON a.facility_service_id = fs.facility_services_id
                LEFT JOIN services fs_svc ON fs.service_id = fs_svc.services_id
                WHERE a.appointment_date >= $1::date
                  AND a.status IN ('PENDING', 'CONFIRMED')
                ORDER BY a.appointment_date ASC, sl.start_time ASC NULLS LAST, a.created_at ASC
                LIMIT $2
            `,
            [date, limit]
        );

        return result.rows.map((row) => ({
            id: row.id,
            patientName: row.patient_name ?? 'Chưa rõ',
            patientAge: row.patient_age ?? null,
            doctorName: row.doctor_name ?? 'Chưa phân công',
            department: row.department_name ?? 'Chưa phân khoa',
            time: row.appointment_time ?? '--:--',
            date: row.appointment_date,
            status: row.status ?? 'PENDING',
            type: row.appointment_type ?? 'Khám tổng quát',
        }));
    }

    static async getQueueSnapshot(date: string, limit: number = 6): Promise<QueueRow[]> {
        const result = await pool.query(
            `
                SELECT
                    a.appointments_id AS id,
                    COALESCE(a.queue_number, 0) AS queue_number,
                    p.full_name AS patient_name,
                    p.patient_code,
                    COALESCE(dep.name, sp.name, 'Chưa phân khoa') AS department_name,
                    COALESCE(up.full_name, 'Chưa phân công') AS doctor_name,
                    COALESCE(
                        FLOOR(EXTRACT(EPOCH FROM ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh') - COALESCE(a.checked_in_at, a.started_at, a.created_at))) / 60),
                        0
                    )::int AS waiting_minutes,
                    a.status
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id::varchar
                LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
                LEFT JOIN user_profiles up ON d.user_id = up.user_id
                LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
                LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
                LEFT JOIN departments dep ON mr.department_id = dep.departments_id
                WHERE a.appointment_date = $1::date
                  AND a.status IN ('CHECKED_IN', 'IN_PROGRESS')
                ORDER BY
                    CASE a.priority WHEN 'EMERGENCY' THEN 0 WHEN 'URGENT' THEN 1 ELSE 2 END,
                    a.queue_number ASC NULLS LAST,
                    a.checked_in_at ASC NULLS LAST
                LIMIT $2
            `,
            [date, limit]
        );

        return result.rows.map((row) => ({
            id: row.id,
            order: toNumber(row.queue_number),
            patientName: row.patient_name ?? 'Chưa rõ',
            patientCode: row.patient_code ?? 'N/A',
            department: row.department_name ?? 'Chưa phân khoa',
            doctor: row.doctor_name ?? 'Chưa phân công',
            waitTime: `${toNumber(row.waiting_minutes)} phút`,
            status: row.status ?? 'CHECKED_IN',
        }));
    }

    static async getMedicineAlerts(days: number = 30, limit: number = 6): Promise<MedicineAlertRow[]> {
        const [lowStock, expiring] = await Promise.all([
            InventoryRepository.findLowStock(),
            InventoryRepository.findExpiring(days),
        ]);

        const merged = new Map<string, MedicineAlertRow>();

        for (const item of lowStock) {
            const id = String(item.pharmacy_inventory_id ?? item.drug_id ?? item.drug_code);
            merged.set(id, {
                id,
                name: item.brand_name ?? 'Chưa rõ',
                code: item.drug_code ?? id,
                stock: toNumber(item.stock_quantity),
                unit: item.dispensing_unit ?? 'đv',
                alertType: 'LOW_STOCK',
                alertLabel: 'Tồn kho thấp',
                expiryDate: item.expiry_date ?? null,
            });
        }

        for (const item of expiring) {
            const id = String(item.pharmacy_inventory_id ?? item.drug_id ?? item.drug_code);
            const existing = merged.get(id);
            if (existing) {
                merged.set(id, {
                    ...existing,
                    alertType: 'LOW_STOCK_AND_EXPIRING',
                    alertLabel: 'Tồn kho thấp & sắp hết hạn',
                    expiryDate: item.expiry_date ?? existing.expiryDate,
                });
                continue;
            }

            merged.set(id, {
                id,
                name: item.brand_name ?? 'Chưa rõ',
                code: item.drug_code ?? id,
                stock: toNumber(item.stock_quantity),
                unit: 'đv',
                alertType: 'EXPIRING',
                alertLabel: 'Sắp hết hạn',
                expiryDate: item.expiry_date ?? null,
            });
        }

        return Array.from(merged.values())
            .sort((a, b) => {
                if (a.alertType === 'LOW_STOCK_AND_EXPIRING' && b.alertType !== 'LOW_STOCK_AND_EXPIRING') {
                    return -1;
                }
                if (b.alertType === 'LOW_STOCK_AND_EXPIRING' && a.alertType !== 'LOW_STOCK_AND_EXPIRING') {
                    return 1;
                }
                return a.stock - b.stock;
            })
            .slice(0, limit);
    }

    static async getFillRate(date: string): Promise<{ booked: number; capacity: number; fillRate: number }> {
        const result = await pool.query(
            `
                WITH slot_capacity AS (
                    SELECT
                        COUNT(DISTINCT sl.slot_id)::int AS total_slots,
                        COALESCE((
                            SELECT max_patients_per_slot::int
                            FROM booking_configurations
                            LIMIT 1
                        ), 1) AS max_per_slot
                    FROM appointment_slots sl
                    JOIN staff_schedules ss ON ss.shift_id = sl.shift_id
                    WHERE ss.working_date = $1::date
                      AND ss.status = 'ACTIVE'
                      AND COALESCE(ss.is_leave, false) = false
                      AND sl.is_active = true
                ),
                slot_bookings AS (
                    SELECT COUNT(*)::int AS booked
                    FROM appointments
                    WHERE appointment_date = $1::date
                      AND status NOT IN ('CANCELLED', 'NO_SHOW')
                )
                SELECT
                    sb.booked,
                    (sc.total_slots * sc.max_per_slot)::int AS capacity
                FROM slot_bookings sb
                CROSS JOIN slot_capacity sc
            `,
            [date]
        );

        const booked = toNumber(result.rows[0]?.booked);
        const capacity = toNumber(result.rows[0]?.capacity);
        const fillRate = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;

        return { booked, capacity, fillRate };
    }

    static async getRevenueByDepartment(periodStart: string, periodEnd: string, facilityId?: string): Promise<RevenueDepartmentRow[]> {
        const params: any[] = [periodStart, periodEnd];
        let facilityClause = '';
        if (facilityId) {
            params.push(facilityId);
            facilityClause = ` AND i.facility_id = $3`;
        }

        const result = await pool.query(
            `
                SELECT
                    COALESCE(dep.name, sp.name, 'Khác') AS department_name,
                    (
                        COALESCE(SUM(CASE WHEN pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0)
                        - COALESCE(SUM(CASE WHEN pt.transaction_type = 'REFUND' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0)
                        - COALESCE(SUM(CASE WHEN pt.status = 'VOIDED' THEN pt.amount ELSE 0 END), 0)
                    )::bigint AS revenue,
                    COUNT(DISTINCT i.patient_id)::int AS patient_count
                FROM payment_transactions pt
                JOIN invoices i ON pt.invoice_id = i.invoices_id
                LEFT JOIN encounters e ON i.encounter_id = e.encounters_id
                LEFT JOIN doctors d ON e.doctor_id = d.doctors_id
                LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
                LEFT JOIN medical_rooms mr ON e.room_id = mr.medical_rooms_id
                LEFT JOIN departments dep ON mr.department_id = dep.departments_id
                WHERE pt.paid_at::date BETWEEN $1 AND $2
                  ${facilityClause}
                GROUP BY department_name
                ORDER BY revenue DESC, department_name ASC
                LIMIT 6
            `,
            params
        );

        return result.rows.map((row) => ({
            departmentName: row.department_name,
            revenue: toNumber(row.revenue),
            patientCount: toNumber(row.patient_count),
        }));
    }

    static async getTopDoctorsByRevenue(
        periodStart: string,
        periodEnd: string,
        facilityId?: string,
        limit: number = 5
    ): Promise<RevenueDoctorRow[]> {
        const params: any[] = [periodStart, periodEnd];
        let facilityClause = '';
        let limitPlaceholder = '$3';

        if (facilityId) {
            params.push(facilityId);
            limitPlaceholder = '$4';
            facilityClause = ` AND i.facility_id = $3`;
        }

        params.push(limit);

        const result = await pool.query(
            `
                SELECT
                    COALESCE(up.full_name, 'Chưa phân công') AS doctor_name,
                    COALESCE(dep.name, sp.name, 'Chưa phân khoa') AS department_name,
                    (
                        COALESCE(SUM(CASE WHEN pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0)
                        - COALESCE(SUM(CASE WHEN pt.transaction_type = 'REFUND' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0)
                        - COALESCE(SUM(CASE WHEN pt.status = 'VOIDED' THEN pt.amount ELSE 0 END), 0)
                    )::bigint AS revenue,
                    COUNT(DISTINCT i.patient_id)::int AS patient_count
                FROM payment_transactions pt
                JOIN invoices i ON pt.invoice_id = i.invoices_id
                LEFT JOIN encounters e ON i.encounter_id = e.encounters_id
                LEFT JOIN doctors d ON e.doctor_id = d.doctors_id
                LEFT JOIN user_profiles up ON d.user_id = up.user_id
                LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
                LEFT JOIN medical_rooms mr ON e.room_id = mr.medical_rooms_id
                LEFT JOIN departments dep ON mr.department_id = dep.departments_id
                WHERE pt.paid_at::date BETWEEN $1 AND $2
                  AND e.doctor_id IS NOT NULL
                  ${facilityClause}
                GROUP BY doctor_name, department_name
                ORDER BY revenue DESC, doctor_name ASC
                LIMIT ${limitPlaceholder}
            `,
            params
        );

        return result.rows.map((row) => ({
            name: row.doctor_name,
            departmentName: row.department_name,
            revenue: toNumber(row.revenue),
            patientCount: toNumber(row.patient_count),
        }));
    }
}
