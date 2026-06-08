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

    const sql = `
    INSERT INTO prescriptions
        (prescriptions_id, prescription_code, encounter_id, doctor_id, patient_id,
         status, clinical_diagnosis, doctor_notes, prescribed_at)
    VALUES
    ('RX_SEED_0005', 'RX-2026-0005', 'ENC_DEMO_011', 'USR_DOC_06', 'PAT_026',
     'PRESCRIBED', 'Viêm dạ dày cấp',                    'Uống thuốc sau ăn',                '2026-05-19 07:15:00')
    `;

    try {
        await client.query(sql);
        console.log('Insert succeeded!');
    } catch (e) {
        console.error('Insert failed with details:');
        console.error('Code:', e.code);
        console.error('Detail:', e.detail);
        console.error('Message:', e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
