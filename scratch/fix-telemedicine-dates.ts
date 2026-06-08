import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "ehealthdatabase",
});

async function main() {
    // Use Vietnam timezone for "today"
    const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    console.log("Today (VN):", today);

    // 1. Update bookings to today's date (for the doctor portal stats)
    console.log("\n=== 1. Updating booking dates to today ===");
    
    // CONFIRMED bookings assigned to DOC_01
    await pool.query(`
        UPDATE tele_booking_sessions 
        SET booking_date = $1::date, booking_start_time = '09:00', booking_end_time = '09:30'
        WHERE session_id = 'TBS_DEMO_005'
    `, [today]);
    
    // CONFIRMED booking assigned to DOC_05
    await pool.query(`
        UPDATE tele_booking_sessions 
        SET booking_date = $1::date, booking_start_time = '10:00', booking_end_time = '10:30'
        WHERE session_id = 'TBS_DEMO_004'
    `, [today]);

    // PENDING bookings (no doctor assigned yet)
    await pool.query(`
        UPDATE tele_booking_sessions 
        SET booking_date = $1::date, booking_start_time = '14:00', booking_end_time = '14:20'
        WHERE session_id = 'TBS_DEMO_006'
    `, [today]);
    await pool.query(`
        UPDATE tele_booking_sessions 
        SET booking_date = $1::date, booking_start_time = '15:00', booking_end_time = '16:00'
        WHERE session_id = 'TBS_DEMO_007'
    `, [today]);

    // COMPLETED bookings -> recent dates (yesterday, day before)
    const yesterday = new Date(new Date().getTime() + 7 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
    const dayBefore = new Date(new Date().getTime() + 7 * 60 * 60 * 1000 - 2 * 86400000).toISOString().slice(0, 10);
    const threeDaysAgo = new Date(new Date().getTime() + 7 * 60 * 60 * 1000 - 3 * 86400000).toISOString().slice(0, 10);
    
    await pool.query(`UPDATE tele_booking_sessions SET booking_date = $1::date WHERE session_id = 'TBS_DEMO_001'`, [threeDaysAgo]);
    await pool.query(`UPDATE tele_booking_sessions SET booking_date = $1::date WHERE session_id = 'TBS_DEMO_002'`, [dayBefore]);
    await pool.query(`UPDATE tele_booking_sessions SET booking_date = $1::date WHERE session_id = 'TBS_DEMO_003'`, [yesterday]);
    await pool.query(`UPDATE tele_booking_sessions SET booking_date = $1::date WHERE session_id = 'TBS_DEMO_008'`, [yesterday]);

    // 2. Update follow-up plans: make some active with upcoming dates
    console.log("\n=== 2. Updating follow-up plans ===");
    const nextWeek = new Date(new Date().getTime() + 7 * 60 * 60 * 1000 + 7 * 86400000).toISOString().slice(0, 10);
    const inTwoDays = new Date(new Date().getTime() + 7 * 60 * 60 * 1000 + 2 * 86400000).toISOString().slice(0, 10);
    
    await pool.query(`
        UPDATE tele_follow_up_plans 
        SET status = 'ACTIVE', 
            next_follow_up_date = $1::date,
            start_date = $2::date,
            end_date = $3::date
        WHERE plan_id = 'TFP_DEMO_001'
    `, [inTwoDays, yesterday, nextWeek]);
    
    await pool.query(`
        UPDATE tele_follow_up_plans 
        SET status = 'ACTIVE', 
            next_follow_up_date = $1::date,
            start_date = $2::date,
            end_date = $3::date
        WHERE plan_id = 'TFP_DEMO_002'
    `, [nextWeek, dayBefore, nextWeek]);
    
    await pool.query(`
        UPDATE tele_follow_up_plans 
        SET status = 'ACTIVE',
            next_follow_up_date = $1::date,
            start_date = $2::date,
            end_date = $3::date
        WHERE plan_id = 'TFP_DEMO_003'
    `, [nextWeek, threeDaysAgo, nextWeek]);

    // 3. Update health updates to recent dates
    console.log("\n=== 3. Updating health updates ===");
    await pool.query(`UPDATE tele_health_updates SET created_at = NOW() - INTERVAL '2 hours' WHERE update_id = 'THU_DEMO_002'`);
    await pool.query(`UPDATE tele_health_updates SET created_at = NOW() - INTERVAL '5 hours' WHERE update_id = 'THU_DEMO_004'`);

    // 4. Update encounters for active tele sessions to current timestamps
    console.log("\n=== 4. Updating active encounter timestamps ===");
    await pool.query(`UPDATE encounters SET start_time = NOW() - INTERVAL '12 minutes' WHERE encounters_id = 'ENC_TELE_004'`);
    await pool.query(`UPDATE encounters SET start_time = NOW() - INTERVAL '3 minutes' WHERE encounters_id = 'ENC_TELE_005'`);
    await pool.query(`UPDATE encounters SET start_time = NOW() - INTERVAL '8 minutes' WHERE encounters_id = 'ENC_TELE_006'`);

    // 5. Update completed encounters to recent dates
    await pool.query(`UPDATE encounters SET start_time = $1::date + '09:00'::time, end_time = $1::date + '09:28'::time WHERE encounters_id = 'ENC_TELE_001'`, [threeDaysAgo]);
    await pool.query(`UPDATE encounters SET start_time = $1::date + '10:30'::time, end_time = $1::date + '11:00'::time WHERE encounters_id = 'ENC_TELE_002'`, [dayBefore]);
    await pool.query(`UPDATE encounters SET start_time = $1::date + '14:00'::time, end_time = $1::date + '14:30'::time WHERE encounters_id = 'ENC_TELE_003'`, [yesterday]);

    // 6. Update tele_consultations active room timestamps
    console.log("\n=== 5. Updating tele consultation room timestamps ===");
    await pool.query(`UPDATE tele_consultations SET room_opened_at = NOW() - INTERVAL '12 minutes', actual_start_time = NOW() - INTERVAL '12 minutes' WHERE tele_consultations_id = 'TC_DEMO_004'`);
    await pool.query(`UPDATE tele_consultations SET room_opened_at = NOW() - INTERVAL '3 minutes', actual_start_time = NOW() - INTERVAL '3 minutes' WHERE tele_consultations_id = 'TC_DEMO_005'`);
    await pool.query(`UPDATE tele_consultations SET room_opened_at = NOW() - INTERVAL '8 minutes', actual_start_time = NOW() - INTERVAL '8 minutes' WHERE tele_consultations_id = 'TC_DEMO_006'`);

    // 7. Update quality reviews to recent dates
    console.log("\n=== 6. Updating quality review dates ===");
    await pool.query(`UPDATE tele_quality_reviews SET created_at = $1::timestamptz WHERE review_id = 'TQR_DEMO_001'`, [threeDaysAgo + 'T10:00:00+07']);
    await pool.query(`UPDATE tele_quality_reviews SET created_at = $1::timestamptz WHERE review_id = 'TQR_DEMO_002'`, [dayBefore + 'T11:30:00+07']);
    await pool.query(`UPDATE tele_quality_reviews SET created_at = $1::timestamptz WHERE review_id = 'TQR_DEMO_003'`, [yesterday + 'T14:45:00+07']);

    // 8. Update results dates
    console.log("\n=== 7. Updating result dates ===");
    await pool.query(`UPDATE tele_consultation_results SET created_at = $1::timestamptz WHERE result_id = 'TCR_DEMO_001'`, [threeDaysAgo + 'T09:30:00+07']);
    await pool.query(`UPDATE tele_consultation_results SET created_at = $1::timestamptz WHERE result_id = 'TCR_DEMO_002'`, [dayBefore + 'T11:05:00+07']);
    await pool.query(`UPDATE tele_consultation_results SET created_at = $1::timestamptz WHERE result_id = 'TCR_DEMO_003'`, [yesterday + 'T14:35:00+07']);

    // 9. Update prescriptions dates
    await pool.query(`UPDATE prescriptions SET prescribed_at = $1::timestamptz WHERE prescriptions_id = 'PRS_TELE_001'`, [threeDaysAgo + 'T09:30:00+07']);
    await pool.query(`UPDATE prescriptions SET prescribed_at = $1::timestamptz WHERE prescriptions_id = 'PRS_TELE_002'`, [dayBefore + 'T11:05:00+07']);
    await pool.query(`UPDATE prescriptions SET prescribed_at = $1::timestamptz WHERE prescriptions_id = 'PRS_TELE_003'`, [yesterday + 'T14:30:00+07']);

    // Verify final state
    console.log("\n=== VERIFICATION ===");
    
    const bookings = await pool.query(`
        SELECT session_id, session_code, doctor_id, status, TO_CHAR(booking_date, 'YYYY-MM-DD') as date, booking_start_time
        FROM tele_booking_sessions ORDER BY booking_date DESC, booking_start_time
    `);
    console.log("\nBookings:");
    console.table(bookings.rows);

    const followups = await pool.query(`
        SELECT plan_id, status, next_follow_up_date, doctor_id, patient_id
        FROM tele_follow_up_plans ORDER BY status, next_follow_up_date
    `);
    console.log("\nFollow-up plans:");
    console.table(followups.rows);

    const results = await pool.query(`
        SELECT result_id, tele_consultation_id, status, is_signed, TO_CHAR(created_at, 'YYYY-MM-DD') as date
        FROM tele_consultation_results ORDER BY created_at DESC
    `);
    console.log("\nResults:");
    console.table(results.rows);

    const reviews = await pool.query(`
        SELECT review_id, doctor_id, doctor_overall, overall_satisfaction, TO_CHAR(created_at, 'YYYY-MM-DD') as date
        FROM tele_quality_reviews ORDER BY created_at DESC
    `);
    console.log("\nQuality reviews:");
    console.table(reviews.rows);

    await pool.end();
    console.log("\n✓ All telemedicine demo data updated to current dates!");
}

main().catch(e => { console.error(e); pool.end(); });
