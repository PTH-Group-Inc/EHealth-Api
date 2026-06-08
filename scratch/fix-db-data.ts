import { pool } from '../src/config/postgresdb';

const fixDbData = async () => {
    try {
        console.log("Starting database date shift and slot assignment...");

        // 1. Kiểm tra ngày hiện tại trong postgres
        const nowRes = await pool.query("SELECT CURRENT_DATE as today");
        const todayStr = nowRes.rows[0].today;
        console.log(`Current Date in DB: ${todayStr}`);

        // 2. Tính khoảng cách offset ngày từ 2026-05-19 đến ngày hiện tại
        // Để làm cho an toàn và có thể chạy nhiều lần, chúng ta sẽ xem ngày nhỏ nhất của appointments hiện tại.
        // Nếu ngày nhỏ nhất là '2026-05-19', chúng ta sẽ tính khoảng cách so với hôm nay.
        const minDateRes = await pool.query("SELECT MIN(appointment_date) as min_date FROM appointments");
        const minDate = minDateRes.rows[0].min_date;
        
        let daysOffset = 0;
        if (minDate) {
            const minDateTime = new Date(minDate).getTime();
            const targetTime = new Date('2026-05-19').getTime();
            
            // Nếu ngày nhỏ nhất trong DB là 2026-05-19, ta shift theo offset này
            if (new Date(minDate).toISOString().slice(0, 10) === '2026-05-19') {
                const todayTime = new Date().getTime();
                daysOffset = Math.round((todayTime - targetTime) / (1000 * 60 * 60 * 24));
                console.log(`Min date in DB is 2026-05-19. Shifting all dates forward by ${daysOffset} days.`);
            } else {
                console.log(`Min date in DB is ${new Date(minDate).toISOString().slice(0,10)}, not 2026-05-19. Will calculate offset from 2026-05-19 to today.`);
                const todayTime = new Date().getTime();
                daysOffset = Math.round((todayTime - targetTime) / (1000 * 60 * 60 * 24));
            }
        } else {
            console.log("No appointments found to shift.");
            return;
        }

        if (daysOffset !== 0) {
            // Thực hiện shift date cho các bảng
            console.log("Updating appointments date and times...");
            await pool.query(`
                UPDATE appointments SET 
                    appointment_date = appointment_date + $1 * INTERVAL '1 day',
                    confirmed_at = confirmed_at + $1 * INTERVAL '1 day',
                    checked_in_at = checked_in_at + $1 * INTERVAL '1 day',
                    started_at = started_at + $1 * INTERVAL '1 day',
                    completed_at = completed_at + $1 * INTERVAL '1 day'
            `, [daysOffset]);

            console.log("Updating staff_schedules date...");
            await pool.query(`
                UPDATE staff_schedules SET 
                    working_date = working_date + $1 * INTERVAL '1 day'
            `, [daysOffset]);

            console.log("Updating doctor_absences date...");
            await pool.query(`
                UPDATE doctor_absences SET 
                    absence_date = absence_date + $1 * INTERVAL '1 day'
                WHERE absence_date IS NOT NULL
            `, [daysOffset]);

            console.log("Updating locked_slots date...");
            await pool.query(`
                UPDATE locked_slots SET 
                    locked_date = locked_date + $1 * INTERVAL '1 day'
                WHERE locked_date IS NOT NULL
            `, [daysOffset]);

            console.log("Updating room_maintenance_schedules date...");
            await pool.query(`
                UPDATE room_maintenance_schedules SET 
                    start_date = start_date + $1 * INTERVAL '1 day',
                    end_date = end_date + $1 * INTERVAL '1 day'
                WHERE start_date IS NOT NULL OR end_date IS NOT NULL
            `, [daysOffset]);

            console.log("Updating encounters start/end times...");
            await pool.query(`
                UPDATE encounters SET 
                    start_time = start_time + $1 * INTERVAL '1 day',
                    end_time = end_time + $1 * INTERVAL '1 day'
                WHERE start_time IS NOT NULL
            `, [daysOffset]);
        }

        // 3. Gán slot_id ngẫu nhiên/tuần tự dựa trên queue_number nếu slot_id đang NULL
        console.log("Assigning slot_id based on queue_number for appointments where slot_id is null...");
        const slotUpdateRes = await pool.query(`
            UPDATE appointments 
            SET slot_id = 'SLOT_' || LPAD(LEAST(queue_number, 34)::text, 3, '0')
            WHERE slot_id IS NULL AND queue_number IS NOT NULL AND queue_number > 0
            RETURNING appointments_id
        `);
        console.log(`Updated slot_id for ${slotUpdateRes.rowCount} appointments.`);

        console.log("Database data fixes applied successfully!");
    } catch (err) {
        console.error("Error executing database fixes:", err);
    } finally {
        await pool.end();
    }
};

fixDbData();
