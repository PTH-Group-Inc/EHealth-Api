-- Migration: Thêm cột specialty_id vào bảng appointments
-- Mục đích: Lưu trữ chuyên khoa khi bệnh nhân đặt lịch, ngay cả khi chưa có bác sĩ được gán.
-- Ngày: 2026-05-04

-- 1. Thêm cột specialty_id (nullable vì các record cũ chưa có)
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS specialty_id VARCHAR(50);

-- 2. Thêm foreign key constraint
ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_specialty
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE SET NULL;

-- 3. Tạo index để tăng tốc truy vấn theo chuyên khoa
CREATE INDEX IF NOT EXISTS idx_appointments_specialty ON appointments(specialty_id);
