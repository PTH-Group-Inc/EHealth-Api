-- Migration: Thêm branch_id vào bảng appointments
-- Mục đích: Mỗi lịch khám phải thuộc 1 chi nhánh cụ thể

-- 1. Thêm cột (nullable tạm thời để backfill)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);

-- 2. Backfill: lấy branch_id từ room_id → medical_rooms.branch_id
UPDATE appointments a
SET branch_id = mr.branch_id
FROM medical_rooms mr
WHERE a.room_id = mr.medical_rooms_id AND a.branch_id IS NULL;

-- 3. Gán default cho lịch không có room (lấy branch active đầu tiên)
UPDATE appointments
SET branch_id = (SELECT branches_id FROM branches WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1)
WHERE branch_id IS NULL;

-- 4. Set NOT NULL + FK
ALTER TABLE appointments ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE appointments ADD CONSTRAINT fk_appointment_branch
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id);

-- 5. Index tăng tốc filter theo branch + ngày
CREATE INDEX IF NOT EXISTS idx_appointments_branch_date ON appointments(branch_id, appointment_date);
