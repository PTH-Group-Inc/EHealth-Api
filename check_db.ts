import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  const invoiceId = 'INV_7771e538-d83';
  const r1 = await pool.query('SELECT * FROM invoices WHERE invoices_id = $1', [invoiceId]);
  console.log('--- INVOICE ---');
  console.log(r1.rows[0]);

  const r2 = await pool.query('SELECT * FROM payment_transactions WHERE invoice_id = $1', [invoiceId]);
  console.log('--- TRANSACTIONS ---');
  console.log(r2.rows);
  
  if (r1.rows[0]) {
    const r3 = await pool.query('SELECT * FROM appointments WHERE appointments_id = $1', [r1.rows[0].appointment_id]);
    console.log('--- APPOINTMENT ---');
    console.log(r3.rows[0]);
  }

  pool.end();
}
run();
