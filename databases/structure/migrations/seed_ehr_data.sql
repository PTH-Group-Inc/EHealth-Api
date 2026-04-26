-- 1. Tạo hồ sơ sức khỏe (EHR Health Profiles) cho tất cả bệnh nhân chưa có
INSERT INTO ehr_health_profiles (ehr_profile_id, patient_id, risk_level, ehr_notes, created_at, updated_at)
SELECT 
    'EHR_' || substr(md5(random()::text), 1, 10),
    id,
    CASE 
        WHEN random() > 0.8 THEN 'HIGH' 
        WHEN random() > 0.5 THEN 'MEDIUM' 
        ELSE 'LOW' 
    END,
    'Hồ sơ sức khỏe được tạo tự động.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM ehr_health_profiles e WHERE e.patient_id = p.id);


-- 2. Thêm bảo hiểm y tế (Patient Insurances) cho tất cả bệnh nhân chưa có
-- Đảm bảo năm hết hạn là năm 2026 hoặc 2027
INSERT INTO patient_insurances (patient_insurances_id, patient_id, insurance_type, insurance_number, start_date, end_date, coverage_percent, is_primary, created_at)
SELECT 
    'INS_' || substr(md5(random()::text), 1, 10),
    id,
    'BHYT',
    'DN401' || lpad(floor(random() * 10000000000)::text, 10, '0'),
    CURRENT_DATE - (random() * 365)::int,
    '2026-12-31'::date + (random() * 365)::int, -- Năm 2026 hoặc 2027
    CASE WHEN random() > 0.5 THEN 80 ELSE 100 END,
    true,
    CURRENT_TIMESTAMP
FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM patient_insurances i WHERE i.patient_id = p.id);

-- Cập nhật cờ has_insurance trong bảng patients cho đồng bộ
UPDATE patients 
SET has_insurance = true 
WHERE id IN (SELECT patient_id FROM patient_insurances);


-- 3. Thêm tiền sử bệnh (Medical Histories) ngẫu nhiên cho khoảng 50% bệnh nhân
INSERT INTO patient_medical_histories (patient_medical_histories_id, patient_id, condition_code, condition_name, history_type, diagnosis_date, status, created_at, updated_at)
SELECT 
    'PMH_' || substr(md5(random()::text), 1, 10),
    id,
    CASE WHEN random() > 0.5 THEN 'E11' ELSE 'I10' END,
    CASE WHEN random() > 0.5 THEN 'Tiểu đường tuýp 2' ELSE 'Cao huyết áp vô căn' END,
    'MEDICAL',
    CURRENT_DATE - (random() * 1000 + 365)::int,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM patients p
WHERE random() > 0.5
AND NOT EXISTS (SELECT 1 FROM patient_medical_histories m WHERE m.patient_id = p.id);


-- 4. Thêm thông tin dị ứng (Allergies) ngẫu nhiên cho khoảng 30% bệnh nhân
INSERT INTO patient_allergies (patient_allergies_id, patient_id, allergen_type, allergen_name, reaction, severity, created_at, updated_at)
SELECT 
    'PAL_' || substr(md5(random()::text), 1, 10),
    id,
    'DRUG',
    CASE WHEN random() > 0.5 THEN 'Penicillin' ELSE 'Amoxicillin' END,
    'Nổi mẩn đỏ, ngứa',
    CASE 
        WHEN random() > 0.8 THEN 'SEVERE' 
        WHEN random() > 0.4 THEN 'MODERATE' 
        ELSE 'MILD' 
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM patients p
WHERE random() > 0.7
AND NOT EXISTS (SELECT 1 FROM patient_allergies a WHERE a.patient_id = p.id);
