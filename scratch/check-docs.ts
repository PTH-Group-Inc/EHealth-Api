import { pool } from '../src/config/postgresdb';
const checkDocs = async () => {
    try {
        const res = await pool.query(`
            SELECT d.doctors_id, d.user_id, up.full_name
            FROM doctors d
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
        `);
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
};
checkDocs();
