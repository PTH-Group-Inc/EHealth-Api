-- 1. Thêm cột payment_expires_at vào bảng appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;

-- 2. Hủy toàn bộ các lịch khám đang ở trạng thái PENDING_DEPOSIT cũ (chưa có payment_expires_at)
-- Cách 1: Hủy trực tiếp bằng SQL (Nhanh, nhưng không kích hoạt các logic như gửi email/hủy hóa đơn đi kèm).
UPDATE appointments
SET 
    status = 'CANCELLED',
    updated_at = NOW()
WHERE 
    status = 'PENDING_DEPOSIT' 
    AND payment_expires_at IS NULL;

-- Ghi chú bổ sung: Nếu bạn muốn hệ thống TỰ ĐỘNG gửi thông báo hủy cho người dùng và dọn dẹp hóa đơn (Cascade Billing),
-- hãy chạy lệnh dưới đây thay vì lệnh UPDATE ở trên.
-- Lệnh này sẽ set payment_expires_at về quá khứ, sau đó Cron Job (StalePendingDepositCleanup) sẽ tự động bắt lấy, hủy từ từ và gửi email:
-- UPDATE appointments
-- SET payment_expires_at = NOW() - INTERVAL '1 hour'
-- WHERE status = 'PENDING_DEPOSIT' AND payment_expires_at IS NULL;
