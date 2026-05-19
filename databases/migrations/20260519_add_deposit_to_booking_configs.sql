-- Thêm cấu hình đặt cọc vào bảng booking_configurations
ALTER TABLE booking_configurations
ADD COLUMN IF NOT EXISTS require_deposit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12,2) DEFAULT 0;
