import { pool } from '../src/config/postgresdb';
import { PrescriptionRepository } from '../src/repository/EMR/prescription.repository';

async function testMedicationSafety() {
    try {
        console.log('--- BẮT ĐẦU TEST MEDICATION SAFETY ---');
        
        // 1. Lấy một bệnh nhân và hai loại thuốc có sẵn trong DB để test
        const patientResult = await pool.query('SELECT id FROM patients LIMIT 1');
        const drugsResult = await pool.query('SELECT drugs_id, brand_name, active_ingredients FROM drugs LIMIT 2');
        
        if (patientResult.rows.length === 0 || drugsResult.rows.length < 2) {
            console.log('Không đủ dữ liệu mẫu (cần ít nhất 1 bệnh nhân và 2 loại thuốc).');
            return;
        }

        const patientId = patientResult.rows[0].id.toString();
        const drug1 = drugsResult.rows[0];
        const drug2 = drugsResult.rows[1];

        console.log(`Bệnh nhân test: ${patientId}`);
        console.log(`Thuốc 1: ${drug1.brand_name} (${drug1.active_ingredients})`);
        console.log(`Thuốc 2: ${drug2.brand_name} (${drug2.active_ingredients})`);

        // === TEST 1: ALLERGY CHECK ===
        console.log('\n--- TEST 1: KIỂM TRA DỊ ỨNG ---');
        
        // Tạo một dị ứng giả cho bệnh nhân này với tên hoạt chất của Thuốc 1
        const allergyId = 'TEST_ALLERGY_' + Date.now();
        await pool.query(`
            INSERT INTO patient_allergies (patient_allergies_id, patient_id, allergen_type, allergen_name, severity, reaction)
            VALUES ($1, $2, 'DRUG', $3, 'SEVERE', 'Sốc phản vệ')
        `, [allergyId, patientId, drug1.active_ingredients || drug1.brand_name]);

        console.log('Đã thêm dị ứng test vào DB.');

        // Chạy hàm check
        const allergyCheck = await PrescriptionRepository.checkPatientDrugAllergy(patientId, drug1.drugs_id);
        
        if (allergyCheck.has_allergy) {
            console.log('✅ PASS: Đã phát hiện dị ứng!');
            console.log('Chi tiết:', JSON.stringify(allergyCheck.details, null, 2));
        } else {
            console.log('❌ FAIL: Không phát hiện được dị ứng.');
        }

        // Dọn dẹp dị ứng test
        await pool.query('DELETE FROM patient_allergies WHERE patient_allergies_id = $1', [allergyId]);


        // === TEST 2: DRUG INTERACTION CHECK ===
        console.log('\n--- TEST 2: KIỂM TRA TƯƠNG TÁC THUỐC ---');

        const interactionId = 'TEST_INTERACTION_' + Date.now();
        await pool.query(`
            INSERT INTO drug_interactions (drug_interactions_id, drug_id_1, drug_id_2, severity, interaction_type, description, clinical_effect)
            VALUES ($1, $2, $3, 'SEVERE', 'Dược động học', 'Tăng nồng độ độc tính', 'Tăng nguy cơ xuất huyết')
        `, [interactionId, drug1.drugs_id, drug2.drugs_id]);

        console.log('Đã thêm tương tác thuốc test vào DB.');

        // Kiểm tra tương tác khi kê thuốc 2, trong đơn đã có thuốc 1
        const interactions = await PrescriptionRepository.checkDrugInteractions(drug2.drugs_id, [drug1.drugs_id]);

        if (interactions.length > 0) {
            console.log('✅ PASS: Đã phát hiện tương tác thuốc!');
            console.log('Chi tiết:', JSON.stringify(interactions, null, 2));
        } else {
            console.log('❌ FAIL: Không phát hiện được tương tác thuốc.');
        }

        // Dọn dẹp tương tác test
        await pool.query('DELETE FROM drug_interactions WHERE drug_interactions_id = $1', [interactionId]);

        console.log('\n--- KẾT THÚC TEST ---');
    } catch (error) {
        console.error('Lỗi khi chạy test:', error);
    } finally {
        await pool.end();
    }
}

testMedicationSafety();
