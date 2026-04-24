import { pool } from '../config/postgresdb';
import { BillingInvoiceService } from '../services/Billing/billing-invoices.service';
import { BillingInvoiceRepository } from '../repository/Billing/billing-invoices.repository';
import { INVOICE_ITEM_TYPE } from '../constants/billing-invoices.constant';

async function runTest() {
    console.log('--- BẮT ĐẦU TEST TOCTOU TRÊN HÓA ĐƠN ---');
    try {
        // 1. Tạo dữ liệu giả: Patient & User
        const patientId = 'PAT_TEST_' + Date.now();
        
        // Get an existing user for the transaction
        const userRes = await pool.query('SELECT * FROM users LIMIT 1');
        const userId = userRes.rows.length > 0 ? (userRes.rows[0].users_id) : null;
        if (!userId) {
            console.log("No user found or unknown column name. Row keys:", userRes.rows[0] ? Object.keys(userRes.rows[0]) : 'None');
            throw new Error('No user found in the database to run the test.');
        }

        await pool.query(`
            INSERT INTO patients (id, patient_code, full_name, date_of_birth, gender, phone_number, address)
            VALUES ($1, $1, 'Test Patient TOCTOU', '2000-01-01', 'Male', '0123456789', 'HN')
        `, [patientId]);

        // Tạo 1 invoice trống
        console.log('1. Tạo hóa đơn trống...');
        const invoice = await BillingInvoiceService.createInvoice({
            patient_id: patientId,
            notes: 'Test invoice cho TOCTOU'
        }, userId);

        const invoiceId = invoice.invoices_id;
        console.log(`=> Đã tạo Invoice: ${invoiceId}`);

        // Thêm trước 1 item để hóa đơn có tổng tiền > 0
        console.log('2. Thêm 1 item trị giá 100,000 VND...');
        await BillingInvoiceService.addInvoiceItem(invoiceId, {
            reference_type: INVOICE_ITEM_TYPE.CONSULTATION,
            reference_id: 'REF1',
            item_name: 'Dịch vụ cơ bản',
            quantity: 1,
            unit_price: 100000
        }, userId);

        let currentInvoice = await BillingInvoiceService.getInvoiceById(invoiceId);
        console.log(`=> Net Amount hiện tại: ${currentInvoice.net_amount}, Status: ${currentInvoice.status}`);

        // 3. Race condition
        // Thread A: Cố gắng thêm 1 item giá 50,000 VND (làm thay đổi net_amount)
        // Thread B: Cố gắng thanh toán 100,000 VND (trả đủ cho net_amount cũ)
        console.log('\\n3. Kích hoạt Race Condition...');
        
        const threadA = BillingInvoiceService.addInvoiceItem(invoiceId, {
            reference_type: INVOICE_ITEM_TYPE.CONSULTATION,
            reference_id: 'REF2',
            item_name: 'Dịch vụ thêm',
            quantity: 1,
            unit_price: 50000
        }, userId).then(() => {
            console.log('[Thread A] Thêm item thành công!');
        }).catch((err: any) => {
            console.error('[Thread A] Thất bại:', err.message || err.code || err);
        });

        const threadB = BillingInvoiceService.processPayment({
            invoice_id: invoiceId,
            payment_method: 'CASH',
            amount: 100000
        }, userId).then(() => {
            console.log('[Thread B] Thanh toán thành công!');
        }).catch((err: any) => {
            console.error('[Thread B] Thất bại:', err.message || err.code || err);
        });

        // Chờ cả 2 hoàn tất
        await Promise.all([threadA, threadB]);

        // 4. Kiểm tra kết quả
        console.log('\\n4. KẾT QUẢ SAU RACE CONDITION:');
        currentInvoice = await BillingInvoiceService.getInvoiceById(invoiceId);
        console.log(`- Net Amount (Cần thu): ${currentInvoice.net_amount}`);
        console.log(`- Paid Amount (Đã thu): ${currentInvoice.paid_amount}`);
        console.log(`- Status: ${currentInvoice.status}`);

        if (currentInvoice.status === 'PAID' && parseFloat(currentInvoice.net_amount) !== parseFloat(currentInvoice.paid_amount)) {
            console.log('=> LỖI: Hóa đơn báo PAID nhưng tiền thu không khớp với tổng tiền!');
        } else if (currentInvoice.status === 'PARTIAL') {
            console.log('=> CHÍNH XÁC: Hóa đơn đã cập nhật thành PARTIAL vì có phát sinh thêm phí.');
        } else {
            console.log('=> MỘT THREAD BỊ CHẶN LẠI VÀ THẤT BẠI NHƯ KỲ VỌNG.');
        }

    } catch (error) {
        console.error('Lỗi khi chạy test:', error);
    } finally {
        // Dọn dẹp db nếu cần, hoặc để nguyên
        console.log('--- KẾT THÚC TEST ---');
        process.exit(0);
    }
}

runTest();
