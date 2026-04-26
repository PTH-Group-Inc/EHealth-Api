-- 1. Thêm cột payment_expires_at vào bảng appointments
ALTER TABLE appointments ADD COLUMN payment_expires_at TIMESTAMPTZ;

-- 2. Đánh dấu tất cả các lịch PENDING_DEPOSIT hiện tại (cũ) là đã quá hạn.
-- Việc set payment_expires_at về quá khứ (NOW() - 1 hour) sẽ giúp Cron Job 
-- StalePendingDepositCleanup tự động bắt lấy các bản ghi này ở lần chạy tiếp theo.
-- Khi đó Cron Job sẽ tự động hủy lịch VÀ kích hoạt hệ thống gửi email/thông báo
-- thay vì chúng ta dùng lệnh UPDATE status = 'CANCELLED' trực tiếp dưới DB (sẽ mất event gửi mail).
UPDATE appointments
SET payment_expires_at = NOW() - INTERVAL '1 hour'
WHERE status = 'PENDING_DEPOSIT' AND payment_expires_at IS NULL;
