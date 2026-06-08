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

    // 1. Total prescriptions count
    const totalCount = await client.query('SELECT COUNT(*) FROM prescriptions');
    console.log('\nTotal prescriptions in prescriptions table:', totalCount.rows[0].count);

    // 2. Count by status
    const countByStatus = await client.query('SELECT status, COUNT(*) FROM prescriptions GROUP BY status');
    console.log('\nPrescriptions count by status:', countByStatus.rows);

    // 3. Count where doctor_id and patient_id can be joined to user_profiles and patients
    const joinCount = await client.query(`
        SELECT 
            (SELECT COUNT(*) FROM prescriptions p JOIN patients pat ON pat.id::text = p.patient_id) as joined_patients,
            (SELECT COUNT(*) FROM prescriptions p JOIN user_profiles up ON up.user_id = p.doctor_id) as joined_doctors
    `);
    console.log('\nJoined records count:', joinCount.rows[0]);

    // 4. Sample patient IDs in prescriptions vs patients
    const samplePrescPatients = await client.query('SELECT DISTINCT patient_id FROM prescriptions LIMIT 5');
    console.log('\nSample patient_ids in prescriptions:', samplePrescPatients.rows);

    const samplePatients = await client.query('SELECT id, full_name FROM patients LIMIT 5');
    console.log('\nSample patients in patients table:', samplePatients.rows);

    // 5. Let's see the details of prescriptions where status = 'PRESCRIBED'
    const prescribedSample = await client.query(`
        SELECT p.prescriptions_id, p.prescription_code, p.status, p.patient_id, p.doctor_id
        FROM prescriptions p
        WHERE p.status = 'PRESCRIBED'
        LIMIT 5
    `);
    console.log('\nSample PRESCRIBED prescriptions:', prescribedSample.rows);

    // 6. Run the search query from backend repository
    const searchQuery = `
        SELECT p.*,
                up.full_name AS doctor_name,
                pat.full_name AS patient_name,
                ed.diagnosis_name, ed.icd10_code,
                (SELECT COUNT(*)::int FROM prescription_details pd WHERE pd.prescription_id = p.prescriptions_id AND pd.is_active = TRUE) AS detail_count
         FROM prescriptions p
         LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
         LEFT JOIN patients pat ON pat.id::text = p.patient_id
         LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
         ORDER BY p.prescribed_at DESC
         LIMIT $1 OFFSET $2
    `;
    const searchRes = await client.query(searchQuery, [200, 0]);
    console.log('\nSearch Query returned rows count:', searchRes.rows.length);
    if (searchRes.rows.length > 0) {
        console.log('Sample search results (first 3):', searchRes.rows.slice(0, 3));
    }

    await client.end();
}

main().catch(console.error);
