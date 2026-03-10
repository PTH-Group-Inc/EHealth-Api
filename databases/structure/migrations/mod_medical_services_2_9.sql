-- =====================================================================
-- Module 2.9: Quản lý Danh mục Dịch vụ Y tế (Medical Services Management)
-- Ngày tạo: 2026-03-10
-- Mô tả: Bổ sung cột mới cho services & facility_services,
--         tạo bảng mapping specialty_services và doctor_services.
-- =====================================================================

-- 1. Bổ sung cột mã BHYT và loại dịch vụ vào bảng Master Services
ALTER TABLE services ADD COLUMN IF NOT EXISTS insurance_code VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
-- service_type: CLINICAL (Khám), LABORATORY (Xét nghiệm), RADIOLOGY (CĐHA), PROCEDURE (Thủ thuật/Phẫu thuật)

COMMENT ON COLUMN services.insurance_code IS 'Mã dịch vụ BHYT (Mapping với danh mục BHYT quốc gia)';
COMMENT ON COLUMN services.service_type IS 'Phân loại dịch vụ: CLINICAL, LABORATORY, RADIOLOGY, PROCEDURE';

-- 2. Bổ sung Giá VIP vào bảng Facility Services
ALTER TABLE facility_services ADD COLUMN IF NOT EXISTS vip_price DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN facility_services.vip_price IS 'Giá VIP dành cho khách hàng ưu tiên (VNĐ)';

-- 3. Tạo bảng Gán Dịch vụ vào Chuyên khoa (N-N)
-- Một chuyên khoa có thể thực hiện nhiều dịch vụ, một dịch vụ có thể thuộc nhiều chuyên khoa
CREATE TABLE IF NOT EXISTS specialty_services (
    specialty_id VARCHAR(50) NOT NULL,
    service_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (specialty_id, service_id),
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(services_id) ON DELETE CASCADE
);

-- 4. Tạo bảng Gán Dịch vụ cho Bác sĩ thực hiện (N-N)
-- Chỉ định bác sĩ nào được phép thực hiện dịch vụ nào tại cơ sở
CREATE TABLE IF NOT EXISTS doctor_services (
    doctor_id VARCHAR(50) NOT NULL,
    facility_service_id VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    assigned_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (doctor_id, facility_service_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- INDEX tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_specialty_services_service ON specialty_services(service_id);
CREATE INDEX IF NOT EXISTS idx_doctor_services_facility_service ON doctor_services(facility_service_id);
CREATE INDEX IF NOT EXISTS idx_doctor_services_doctor ON doctor_services(doctor_id);
