import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    host: process.env.DB_HOST || '160.250.186.97',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'db123456',
    database: process.env.DB_NAME || 'ehealthdatabase',
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('--- Cleaning up any existing "APT_TODAY_" and related entries ---');
        
        // 1. Release room KB_01 if occupied by our test appointments
        await client.query(`
            UPDATE medical_rooms
            SET room_status = 'AVAILABLE',
                current_appointment_id = NULL,
                current_patient_id = NULL
            WHERE medical_rooms_id = 'ROOM_KB_01'
              AND current_appointment_id LIKE 'APT_TODAY_%';
        `);

        // 2. Delete audit logs, health metrics, encounters, and appointments
        await client.query("DELETE FROM appointment_audit_logs WHERE appointment_id LIKE 'APT_TODAY_%'");
        await client.query("DELETE FROM patient_health_metrics WHERE patient_health_metrics_id LIKE 'PHM_TODAY_%'");
        await client.query("DELETE FROM encounters WHERE encounters_id LIKE 'ENC_TODAY_%'");
        await client.query("DELETE FROM appointments WHERE appointments_id LIKE 'APT_TODAY_%'");

        console.log('Cleanup complete.');

        console.log('--- Seeding Appointments ---');

        const todayDate = '2026-06-09';
        
        // 1. Seeding 6 CONFIRMED appointments (Queue STT 401 - 406)
        const confirmedAppointments = [
            { id: 'APT_TODAY_CONF_001', code: 'APP-20260609-CF01', patient: 'PAT_001', slot: 'SLOT_001', q: 401, reason: 'Khám tổng quát định kỳ', symptom: 'Mệt mỏi nhẹ vài ngày qua' },
            { id: 'APT_TODAY_CONF_002', code: 'APP-20260609-CF02', patient: 'PAT_002', slot: 'SLOT_002', q: 402, reason: 'Tái khám huyết áp', symptom: 'Đau đầu nhẹ buổi sáng' },
            { id: 'APT_TODAY_CONF_003', code: 'APP-20260609-CF03', patient: 'PAT_003', slot: 'SLOT_003', q: 403, reason: 'Khám sức khoẻ định kỳ', symptom: 'Kiểm tra sức khoẻ định kỳ' },
            { id: 'APT_TODAY_CONF_004', code: 'APP-20260609-CF04', patient: 'PAT_004', slot: 'SLOT_004', q: 404, reason: 'Tư vấn dinh dưỡng', symptom: 'Sút cân nhẹ chưa rõ nguyên nhân' },
            { id: 'APT_TODAY_CONF_005', code: 'APP-20260609-CF05', patient: 'PAT_005', slot: 'SLOT_005', q: 405, reason: 'Khám tổng quát', symptom: 'Đau mỏi vai gáy' },
            { id: 'APT_TODAY_CONF_006', code: 'APP-20260609-CF06', patient: 'PAT_011', slot: 'SLOT_006', q: 406, reason: 'Tái khám định kỳ', symptom: 'Tái khám sau đợt điều trị' },
        ];

        for (const apt of confirmedAppointments) {
            await client.query(`
                INSERT INTO appointments (
                    appointments_id, appointment_code, patient_id, doctor_id, slot_id,
                    room_id, specialty_id, branch_id, appointment_date, booking_channel,
                    reason_for_visit, status, priority, queue_number,
                    confirmed_at, confirmed_by, symptoms_notes
                ) VALUES ($1, $2, $3, 'DOC_01', $4, 'ROOM_KB_01', 'SPC_TONG_QUAT', 'BR_MAIN', $5, 'WEB', $6, 'CONFIRMED', 'NORMAL', $7, '2026-06-08 10:00:00+07', 'USR_DOC_01', $8)
            `, [apt.id, apt.code, apt.patient, apt.slot, todayDate, apt.reason, apt.q, apt.symptom]);
        }
        console.log(`Seeded ${confirmedAppointments.length} CONFIRMED appointments.`);

        // 2. Seeding 6 CHECKED_IN appointments (Queue STT 407 - 412)
        const checkedInAppointments = [
            { id: 'APT_TODAY_CKIN_001', code: 'APP-20260609-CK01', patient: 'PAT_012', slot: 'SLOT_007', q: 407, reason: 'Khám tổng quát', priority: 'NORMAL', symptom: 'Đau thượng vị sau ăn' },
            { id: 'APT_TODAY_CKIN_002', code: 'APP-20260609-CK02', patient: 'PAT_013', slot: 'SLOT_008', q: 408, reason: 'Tái khám dạ dày', priority: 'NORMAL', symptom: 'Đau bụng âm ỉ vùng quanh rốn' },
            { id: 'APT_TODAY_CKIN_003', code: 'APP-20260609-CK03', patient: 'PAT_014', slot: 'SLOT_009', q: 409, reason: 'Khám sức khoẻ tổng quát', priority: 'NORMAL', symptom: 'Rối loạn giấc ngủ, mất ngủ kéo dài' },
            { id: 'APT_TODAY_CKIN_004', code: 'APP-20260609-CK04', patient: 'PAT_015', slot: 'SLOT_010', q: 410, reason: 'Đau mỏi vai gáy', priority: 'NORMAL', symptom: 'Tê bì bả vai lan xuống tay' },
            { id: 'APT_TODAY_CKIN_005', code: 'APP-20260609-CK05', patient: 'PAT_016', slot: 'SLOT_011', q: 411, reason: 'Đau khớp gối', priority: 'NORMAL', symptom: 'Đau khớp gối khi vận động mạnh' },
            { id: 'APT_TODAY_CKIN_006', code: 'APP-20260609-CK06', patient: 'PAT_017', slot: 'SLOT_012', q: 412, reason: 'Khám khó thở đột ngột', priority: 'URGENT', symptom: 'Tức ngực nhẹ, khó thở khi thời tiết thay đổi' },
        ];

        for (const apt of checkedInAppointments) {
            await client.query(`
                INSERT INTO appointments (
                    appointments_id, appointment_code, patient_id, doctor_id, slot_id,
                    room_id, specialty_id, branch_id, appointment_date, booking_channel,
                    reason_for_visit, status, priority, queue_number,
                    confirmed_at, confirmed_by, checked_in_at, check_in_method, symptoms_notes
                ) VALUES ($1, $2, $3, 'DOC_01', $4, 'ROOM_KB_01', 'SPC_TONG_QUAT', 'BR_MAIN', $5, 'WEB', $6, 'CHECKED_IN', $7, $8, '2026-06-08 11:00:00+07', 'USR_DOC_01', '2026-06-09 08:00:00+07', 'QR', $9)
            `, [apt.id, apt.code, apt.patient, apt.slot, todayDate, apt.reason, apt.priority, apt.q, apt.symptom]);

            // Seed vital signs (health metrics) for CHECKED_IN patients
            await seedPatientVitals(apt.patient);
        }
        console.log(`Seeded ${checkedInAppointments.length} CHECKED_IN appointments.`);

        // 3. Seeding 3 IN_PROGRESS appointments (Queue STT 413 - 415)
        const inProgressAppointments = [
            { id: 'APT_TODAY_PROG_001', code: 'APP-20260609-PR01', patient: 'PAT_018', slot: 'SLOT_013', q: 413, reason: 'Khám đau dạ dày', symptom: 'Đau vùng thượng vị, ợ chua nhiều', enc: 'ENC_TODAY_PROG_001' },
            { id: 'APT_TODAY_PROG_002', code: 'APP-20260609-PR02', patient: 'PAT_019', slot: 'SLOT_014', q: 414, reason: 'Hồi hộp trống ngực', symptom: 'Hồi hộp đánh trống ngực về đêm', enc: 'ENC_TODAY_PROG_002' },
            { id: 'APT_TODAY_PROG_003', code: 'APP-20260609-PR03', patient: 'PAT_020', slot: 'SLOT_015', q: 415, reason: 'Đau đầu kéo dài', symptom: 'Đau nửa đầu âm ỉ kèm chóng mặt', enc: 'ENC_TODAY_PROG_003' },
        ];

        for (const apt of inProgressAppointments) {
            await client.query(`
                INSERT INTO appointments (
                    appointments_id, appointment_code, patient_id, doctor_id, slot_id,
                    room_id, specialty_id, branch_id, appointment_date, booking_channel,
                    reason_for_visit, status, priority, queue_number,
                    confirmed_at, confirmed_by, checked_in_at, started_at, check_in_method, symptoms_notes
                ) VALUES ($1, $2, $3, 'DOC_01', $4, 'ROOM_KB_01', 'SPC_TONG_QUAT', 'BR_MAIN', $5, 'WEB', $6, 'IN_PROGRESS', 'NORMAL', $7, '2026-06-08 12:00:00+07', 'USR_DOC_01', '2026-06-09 08:05:00+07', '2026-06-09 08:15:00+07', 'QR', $8)
            `, [apt.id, apt.code, apt.patient, apt.slot, todayDate, apt.reason, apt.q, apt.symptom]);

            // Seed encounters for IN_PROGRESS
            await client.query(`
                INSERT INTO encounters (
                    encounters_id, appointment_id, patient_id, doctor_id, room_id,
                    encounter_type, visit_number, start_time, end_time, status, notes
                ) VALUES ($1, $2, $3, 'DOC_01', 'ROOM_KB_01', 'FIRST_VISIT', 1, '2026-06-09 08:15:00+07', NULL, 'IN_PROGRESS', 'Bác sĩ đang thực hiện khám lâm sàng')
            `, [apt.enc, apt.id, apt.patient]);

            // Seed vital signs (health metrics) for IN_PROGRESS patients
            await seedPatientVitals(apt.patient);
        }
        console.log(`Seeded ${inProgressAppointments.length} IN_PROGRESS appointments & encounters.`);

        // 4. Update room status of ROOM_KB_01 to OCCUPIED by the last in-progress patient (PAT_020)
        await client.query(`
            UPDATE medical_rooms
            SET room_status = 'OCCUPIED',
                current_appointment_id = 'APT_TODAY_PROG_003',
                current_patient_id = 'PAT_020'
            WHERE medical_rooms_id = 'ROOM_KB_01';
        `);
        console.log(`Updated room ROOM_KB_01 status to OCCUPIED.`);

        // 5. Seeding 5 COMPLETED appointments (Queue STT 416 - 420)
        const completedAppointments = [
            { id: 'APT_TODAY_DONE_001', code: 'APP-20260609-DN01', patient: 'PAT_021', slot: 'SLOT_016', q: 416, reason: 'Khám sức khoẻ tổng quát', symptom: 'Mất ngủ kéo dài', enc: 'ENC_TODAY_DONE_001' },
            { id: 'APT_TODAY_DONE_002', code: 'APP-20260609-DN02', patient: 'PAT_022', slot: 'SLOT_017', q: 417, reason: 'Tái khám dạ dày', symptom: 'Đau vùng thượng vị đã thuyên giảm', enc: 'ENC_TODAY_DONE_002' },
            { id: 'APT_TODAY_DONE_003', code: 'APP-20260609-DN03', patient: 'PAT_023', slot: 'SLOT_018', q: 418, reason: 'Khám khớp cổ tay', symptom: 'Đau mỏi cổ tay sau chấn thương nhẹ', enc: 'ENC_TODAY_DONE_003' },
            { id: 'APT_TODAY_DONE_004', code: 'APP-20260609-DN04', patient: 'PAT_024', slot: 'SLOT_019', q: 419, reason: 'Khám nhức đầu', symptom: 'Nhức nửa đầu nhẹ', enc: 'ENC_TODAY_DONE_004' },
            { id: 'APT_TODAY_DONE_005', code: 'APP-20260609-DN05', patient: 'PAT_025', slot: 'SLOT_020', q: 420, reason: 'Kiểm tra sức khoẻ định kỳ', symptom: 'Kiểm tra tổng quát sức khoẻ', enc: 'ENC_TODAY_DONE_005' },
        ];

        for (const apt of completedAppointments) {
            await client.query(`
                INSERT INTO appointments (
                    appointments_id, appointment_code, patient_id, doctor_id, slot_id,
                    room_id, specialty_id, branch_id, appointment_date, booking_channel,
                    reason_for_visit, status, priority, queue_number,
                    confirmed_at, confirmed_by, checked_in_at, started_at, completed_at, check_in_method, symptoms_notes
                ) VALUES ($1, $2, $3, 'DOC_01', $4, 'ROOM_KB_01', 'SPC_TONG_QUAT', 'BR_MAIN', $5, 'WEB', $6, 'COMPLETED', 'NORMAL', $7, '2026-06-08 13:00:00+07', 'USR_DOC_01', '2026-06-09 07:00:00+07', '2026-06-09 07:15:00+07', '2026-06-09 07:35:00+07', 'QR', $8)
            `, [apt.id, apt.code, apt.patient, apt.slot, todayDate, apt.reason, apt.q, apt.symptom]);

            // Seed encounters for COMPLETED
            await client.query(`
                INSERT INTO encounters (
                    encounters_id, appointment_id, patient_id, doctor_id, room_id,
                    encounter_type, visit_number, start_time, end_time, status, notes
                ) VALUES ($1, $2, $3, 'DOC_01', 'ROOM_KB_01', 'FIRST_VISIT', 1, '2026-06-09 07:15:00+07', '2026-06-09 07:35:00+07', 'COMPLETED', 'Khám lâm sàng hoàn tất, đã kê đơn và cho về')
            `, [apt.enc, apt.id, apt.patient]);

            // Seed vital signs (health metrics) for COMPLETED patients
            await seedPatientVitals(apt.patient);
        }
        console.log(`Seeded ${completedAppointments.length} COMPLETED appointments & encounters.`);

        console.log('--- DB SEED COMPLETED SUCCESSFULLY! ---');
    } catch (err) {
        console.error('Error running seed script:', err);
    } finally {
        await client.end();
        console.log('DB Connection closed.');
    }
}

// Helper to seed vitals for patients
async function seedPatientVitals(patientId: string) {
    const sys = Math.floor(Math.random() * 15) + 115; // 115-130
    const dia = Math.floor(Math.random() * 10) + 75;  // 75-85
    const hr = Math.floor(Math.random() * 15) + 72;   // 72-87
    const temp = (Math.random() * 0.8 + 36.4).toFixed(1); // 36.4-37.2
    const spo2 = Math.floor(Math.random() * 3) + 97;  // 97-99
    const weight = Math.floor(Math.random() * 20) + 55; // 55-75
    const height = Math.floor(Math.random() * 15) + 160; // 160-175
    const resp = Math.floor(Math.random() * 4) + 16;  // 16-20

    const metrics = [
        { code: 'BLOOD_PRESSURE', name: 'Huyết áp', value: JSON.stringify({ systolic: sys, diastolic: dia }), unit: 'mmHg' },
        { code: 'HEART_RATE', name: 'Nhịp tim', value: JSON.stringify({ value: hr }), unit: 'bpm' },
        { code: 'TEMPERATURE', name: 'Nhiệt độ', value: JSON.stringify({ value: parseFloat(temp) }), unit: '°C' },
        { code: 'SPO2', name: 'Độ bão hoà oxy', value: JSON.stringify({ value: spo2 }), unit: '%' },
        { code: 'WEIGHT', name: 'Cân nặng', value: JSON.stringify({ value: weight }), unit: 'kg' },
        { code: 'HEIGHT', name: 'Chiều cao', value: JSON.stringify({ value: height }), unit: 'cm' },
        { code: 'RESP_RATE', name: 'Nhịp thở', value: JSON.stringify({ value: resp }), unit: 'lần/phút' },
    ];

    const uuidBase = Math.random().toString(36).substring(2, 12);
    for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        const metricId = `PHM_TODAY_${uuidBase}_${i}`;
        await client.query(`
            INSERT INTO patient_health_metrics (
                patient_health_metrics_id, patient_id, metric_code, metric_name,
                metric_value, unit, measured_at, source_type
            ) VALUES ($1, $2, $3, $4, $5::json, $6, NOW() - INTERVAL '5 minute', 'CLINIC')
        `, [metricId, patientId, m.code, m.name, m.value, m.unit]);
    }
}

run();
