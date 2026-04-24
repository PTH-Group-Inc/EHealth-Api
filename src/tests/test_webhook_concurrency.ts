import crypto from 'crypto';

// Replace with your actual server URL if different
const API_URL = 'http://localhost:3000/api/v1/billing/payments/webhook/sepay';
const WEBHOOK_SECRET = 'my-secret-key-123';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runConcurrencyTest() {
    console.log('🚀 Starting Webhook Concurrency Test...');

    // Simulate a payload from SePay
    // Replace 'EHealth12345' with an actual pending order's transfer content in your DB.
    const payload = {
        id: 123456,
        gateway: 'MBBank',
        transactionDate: new Date().toISOString(),
        accountNumber: '3015112004',
        code: '123456',
        content: 'EHealth12345',
        transferType: 'in',
        transferAmount: 100000,
        accumulated: 100000,
        subAccount: null,
        referenceCode: 'REF' + Date.now().toString(),
        description: 'Test payment'
    };

    // Calculate signature
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${WEBHOOK_SECRET}` // The code accepts Apikey or HMAC
    };

    console.log('Sending 5 parallel webhook requests...');
    
    // Fire 5 requests concurrently
    const requests = Array.from({ length: 5 }).map(async (_, index) => {
        try {
            const start = Date.now();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: rawBody
            });
            const data = await response.json();
            const duration = Date.now() - start;
            console.log(`✅ Request ${index + 1} completed in ${duration}ms. Status: ${response.status}. Response:`, data);
            return data;
        } catch (error: any) {
            console.error(`❌ Request ${index + 1} failed. Error:`, error.message);
            return null;
        }
    });

    const results = await Promise.all(requests);
    
    const successes = results.filter((r: any) => r && r.processed === true).length;
    const skips = results.filter((r: any) => r && r.processed === false).length;

    console.log('\n--- 📊 Test Summary ---');
    console.log(`Total Requests: 5`);
    console.log(`Successfully Processed (Expected: 1 or 0 if already paid): ${successes}`);
    console.log(`Skipped/Idempotent (Expected: 4 or 5 if already paid): ${skips}`);
    
    if (successes > 1) {
        console.error('❌ RACE CONDITION DETECTED: Multiple requests processed the same payment!');
    } else {
        console.log('✅ IDEMPOTENCY WORKING: Race condition prevented.');
    }
}

runConcurrencyTest().catch(console.error);

