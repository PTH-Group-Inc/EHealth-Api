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

    try {
        console.log('Cleaning up RX_SEED dependencies...');
        
        // 1. Delete invoice details / invoices linked to drug_dispense_orders of RX_SEED
        // Let's check if invoices exist and reference drug_dispense_orders
        await client.query(`
            DELETE FROM invoices
            WHERE dispense_order_id IN (
                SELECT drug_dispense_orders_id 
                FROM drug_dispense_orders 
                WHERE prescription_id LIKE 'RX_SEED_%'
            )
        `).catch(e => console.log('No invoices deleted or table missing. Error:', e.message));

        // 2. Delete drug_dispense_details
        const dsdRes = await client.query(`
            DELETE FROM drug_dispense_details 
            WHERE dispense_order_id IN (
                SELECT drug_dispense_orders_id 
                FROM drug_dispense_orders 
                WHERE prescription_id LIKE 'RX_SEED_%'
            )
        `);
        console.log(`Deleted ${dsdRes.rowCount} drug_dispense_details rows.`);

        // 3. Delete drug_dispense_orders
        const dsoRes = await client.query(`
            DELETE FROM drug_dispense_orders 
            WHERE prescription_id LIKE 'RX_SEED_%'
        `);
        console.log(`Deleted ${dsoRes.rowCount} drug_dispense_orders rows.`);

        // 4. Delete tele_prescriptions
        const tpRes = await client.query(`
            DELETE FROM tele_prescriptions 
            WHERE prescription_id LIKE 'RX_SEED_%'
        `);
        console.log(`Deleted ${tpRes.rowCount} tele_prescriptions rows.`);

        // 5. Delete prescription_details
        const pdRes = await client.query(`
            DELETE FROM prescription_details 
            WHERE prescription_id LIKE 'RX_SEED_%'
        `);
        console.log(`Deleted ${pdRes.rowCount} prescription_details rows.`);

        // 6. Delete prescriptions
        const pRes = await client.query(`
            DELETE FROM prescriptions 
            WHERE prescriptions_id LIKE 'RX_SEED_%'
        `);
        console.log(`Deleted ${pRes.rowCount} prescriptions rows.`);

        console.log('Clean completed successfully!');
    } catch (error) {
        console.error('Clean failed:', error);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
