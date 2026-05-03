import { PaymentGatewayService } from './src/services/Billing/billing-payment-gateway.service';
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

async function testWebhook() {
  const payload = {
    "gateway": "MBBank",
    "transactionDate": "2026-05-03 22:28:00",
    "accountNumber": "3015112004",
    "subAccount": null,
    "code": null,
    "content": "EHealth19503 FT26124138963154 kCWQWH3P/044508",
    "transferType": "in",
    "description": "BankAPINotify EHealth19503 FT26124138963154 kCWQWH3P/044508",
    "transferAmount": 50000,
    "referenceCode": "FT26124822953824",
    "accumulated": 0,
    "id": 55362185
  };

  try {
    console.log('Running handleWebhook...');
    const result = await PaymentGatewayService.handleWebhook(payload);
    console.log('Result:', result);
    
    // Check DB
    const res = await pool.query('SELECT * FROM payment_transactions WHERE invoice_id = $1', ['INV_7771e538-d83']);
    console.log('Transactions in DB:', res.rows.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}
testWebhook();
