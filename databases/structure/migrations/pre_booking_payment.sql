-- 1. Thêm cột appointment_id và invoice_type vào invoices
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50) DEFAULT 'ENCOUNTER';
    -- invoice_type: PRE_BOOKING | ENCOUNTER | MANUAL

-- FK constraints
DO $$ BEGIN
    ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);

-- 2. Permissions cho pre-book API
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
    ('API_APT_PRE_BOOK', 'POST', '/api/appointments/pre-book', 'Đặt lịch + thanh toán cọc', 'APPOINTMENTS'),
    ('API_APT_REGEN_QR', 'POST', '/api/appointments/:id/regenerate-qr', 'Tạo lại mã thanh toán QR', 'APPOINTMENTS'),
    ('API_APT_PAYMENT_STATUS', 'GET', '/api/appointments/:id/payment-status', 'Kiểm tra trạng thái thanh toán', 'APPOINTMENTS')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3. Cấp quyền Role cho PATIENT, STAFF, ADMIN
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','STAFF','PATIENT') AND a.api_id IN (
    'API_APT_PRE_BOOK', 'API_APT_REGEN_QR', 'API_APT_PAYMENT_STATUS'
) ON CONFLICT DO NOTHING;
