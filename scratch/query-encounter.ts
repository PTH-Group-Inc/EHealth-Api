import { pool } from '../src/config/postgresdb';

const checkEncounter = async () => {
    try {
        const encounterId = 'ENC_260609_afbeb98f';
        console.log(`Checking details for encounter: ${encounterId}`);

        // 1. Query encounters table
        const encRes = await pool.query('SELECT * FROM encounters WHERE encounters_id = $1', [encounterId]);
        console.log('Encounter Row:', encRes.rows[0]);

        if (encRes.rows.length === 0) {
            console.log(`Encounter ${encounterId} not found in database!`);
            return;
        }

        // 2. Query clinical_examinations table
        const ceRes = await pool.query('SELECT * FROM clinical_examinations WHERE encounter_id = $1', [encounterId]);
        console.log('Clinical Examination Rows:', ceRes.rows);

        // 3. Query encounter_diagnoses table
        const dxRes = await pool.query('SELECT * FROM encounter_diagnoses WHERE encounter_id = $1', [encounterId]);
        console.log('Diagnosis Rows:', dxRes.rows);

        // 4. Query prescriptions table
        const rxRes = await pool.query('SELECT * FROM prescriptions WHERE encounter_id = $1', [encounterId]);
        console.log('Prescription Rows:', rxRes.rows);

        if (rxRes.rows.length > 0) {
            const rxDetails = await pool.query('SELECT * FROM prescription_details WHERE prescription_id = $1', [rxRes.rows[0].prescriptions_id || rxRes.rows[0].id]);
            console.log('Prescription Details Rows:', rxDetails.rows);
        }

        // 5. Query medical_orders table
        const orderRes = await pool.query('SELECT * FROM medical_orders WHERE encounter_id = $1', [encounterId]);
        console.log('Medical Order Rows:', orderRes.rows);

        // 6. Query treatment_plans table
        const planRes = await pool.query('SELECT * FROM treatment_plans WHERE encounter_id = $1', [encounterId]);
        console.log('Treatment Plan Rows:', planRes.rows);

        // 7. Query billing/invoices table
        const billRes = await pool.query('SELECT * FROM invoices WHERE encounter_id = $1', [encounterId]);
        console.log('Invoice Rows:', billRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
};

checkEncounter();
