const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || '160.250.186.97',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'db123456',
        database: process.env.DB_NAME || 'ehealthdatabase',
    });

    await client.connect();
    console.log('Connected to DB');

    const result = await client.query(`
        SELECT prescriptions_id, prescription_code, status, prescribed_at, doctor_id, patient_id
        FROM prescriptions
        WHERE status = 'ACTIVE'
        ORDER BY prescribed_at DESC
        LIMIT 20
    `);
    console.log('ACTIVE prescriptions:', result.rows);

    await client.end();
}

main().catch(console.error);
