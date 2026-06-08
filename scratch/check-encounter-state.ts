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
    const encounterId = 'ENC_260608_aef34138';
    
    // 1. Check encounter
    const encRes = await pool.query("SELECT * FROM encounters WHERE encounters_id = $1", [encounterId]);
    console.log("Encounter:");
    console.table(encRes.rows);

    if (encRes.rows.length === 0) {
        console.log("Encounter does not exist!");
        await pool.end();
        return;
    }

    // 2. Check clinical exam
    const ceRes = await pool.query("SELECT clinical_examinations_id, encounter_id, status FROM clinical_examinations WHERE encounter_id = $1", [encounterId]);
    console.log("\nClinical Examinations:");
    console.table(ceRes.rows);

    // 3. Check diagnoses
    const dxRes = await pool.query("SELECT * FROM encounter_diagnoses WHERE encounter_id = $1", [encounterId]);
    console.log("\nDiagnoses:");
    console.table(dxRes.rows);

    // 4. Check prescriptions
    const prRes = await pool.query("SELECT prescriptions_id, prescription_code, status FROM prescriptions WHERE encounter_id = $1", [encounterId]);
    console.log("\nPrescriptions:");
    console.table(prRes.rows);

    // 5. Check medical orders
    const moRes = await pool.query("SELECT medical_orders_id, order_code, status FROM medical_orders WHERE encounter_id = $1", [encounterId]);
    console.log("\nMedical Orders:");
    console.table(moRes.rows);

    // 6. Check signatures
    const sigRes = await pool.query("SELECT emr_signatures_id, signer_id, sign_type, sign_scope, created_at FROM emr_signatures WHERE encounter_id = $1", [encounterId]);
    console.log("\nEMR Signatures:");
    console.table(sigRes.rows);

    await pool.end();
}

main().catch(console.error);
