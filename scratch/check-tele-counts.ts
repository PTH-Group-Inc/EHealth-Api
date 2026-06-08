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
    const sql = `
        SELECT 'tele_booking_sessions' as t, COUNT(*) as cnt FROM tele_booking_sessions
        UNION ALL SELECT 'tele_consultations', COUNT(*) FROM tele_consultations
        UNION ALL SELECT 'tele_consultation_results', COUNT(*) FROM tele_consultation_results
        UNION ALL SELECT 'tele_follow_up_plans', COUNT(*) FROM tele_follow_up_plans
        UNION ALL SELECT 'tele_quality_reviews', COUNT(*) FROM tele_quality_reviews
        UNION ALL SELECT 'tele_prescriptions', COUNT(*) FROM tele_prescriptions
        ORDER BY t
    `;
    const r = await pool.query(sql);
    console.table(r.rows);
    await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
