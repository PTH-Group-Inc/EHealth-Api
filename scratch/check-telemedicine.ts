import { pool } from '../src/config/postgresdb';

async function checkTelemedicine() {
    try {
        console.log("Checking telemedicine bookings in database...");
        const res = await pool.query("SELECT * FROM tele_booking_sessions");
        console.log(`Found ${res.rows.length} booking sessions:`);
        for (const row of res.rows) {
            console.log(`- Session ID: ${row.session_id}, Code: ${row.session_code}, Doctor ID: ${row.doctor_id}, Patient ID: ${row.patient_id}, Date: ${row.booking_date}, Status: ${row.status}`);
        }

        const resTC = await pool.query("SELECT * FROM tele_consultations");
        console.log(`Found ${resTC.rows.length} consultations:`);
        for (const row of resTC.rows) {
            console.log(`- Consultation ID: ${row.tele_consultations_id}, Status: ${row.call_status}, Session ID: ${row.booking_session_id}, Appointment ID: ${row.appointment_id}`);
        }
    } catch (err) {
        console.error("Error checking telemedicine:", err);
    } finally {
        await pool.end();
    }
}

checkTelemedicine();
