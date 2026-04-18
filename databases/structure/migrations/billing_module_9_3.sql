-- =============================================
-- Module 9.3: Thanh toán trực tuyến (Online Payment)
-- Tích hợp SePay Payment Gateway
-- =============================================

-- 1. BẢNG LỆNH THANH TOÁN QR (Payment Orders)
CREATE TABLE IF NOT EXISTS payment_orders (
    payment_orders_id       VARCHAR(50) PRIMARY KEY,
    order_code              VARCHAR(100) UNIQUE NOT NULL,
    invoice_id              VARCHAR(50) NOT NULL,
    amount                  DECIMAL(12,2) NOT NULL,
    description             VARCHAR(500),
    qr_code_url             TEXT,
    payment_url             TEXT,
    gateway_order_id        VARCHAR(255),
    status                  VARCHAR(30) DEFAULT 'PENDING',
    expires_at              TIMESTAMPTZ NOT NULL,
    paid_at                 TIMESTAMPTZ,
    gateway_transaction_id  VARCHAR(255),
    gateway_response        JSONB,
    created_by              VARCHAR(50),
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

-- 2. BẢNG CẤU HÌNH CỔNG THANH TOÁN (Payment Gateway Config)
CREATE TABLE IF NOT EXISTS payment_gateway_config (
    config_id               VARCHAR(50) PRIMARY KEY,
    gateway_name            VARCHAR(50) UNIQUE NOT NULL,
    merchant_id             VARCHAR(255),
    api_key                 VARCHAR(500),
    secret_key              VARCHAR(500),
    webhook_secret          VARCHAR(500),
    environment             VARCHAR(20) DEFAULT 'SANDBOX',
    bank_account_number     VARCHAR(50),
    bank_name               VARCHAR(100),
    account_holder          VARCHAR(255),
    va_account              VARCHAR(50),
    is_active               BOOLEAN DEFAULT TRUE,
    config_data             JSONB,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_payment_orders_invoice ON payment_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway ON payment_orders(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_expires ON payment_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_code ON payment_orders(order_code);

-- 4. THÊM BANK_TRANSFER VÀO PAYMENT_METHOD (bảng payment_transactions)
-- Cột payment_method đã là VARCHAR nên không cần ALTER, chỉ document thêm giá trị mới

-- 5. INSERT CẤU HÌNH MẪU SEPAY (sandbox)
INSERT INTO payment_gateway_config (
    config_id, gateway_name, merchant_id, api_key, 
    environment, bank_account_number, bank_name, account_holder, va_account
) VALUES (
    'GW_SEPAY', 'SEPAY', '8327', 'HUEWBOCJK4A1QAAHI5XIF95FHL3RKTRJ62OE90UWNTPDTRDBR471YLX8IVQ0MNJG',
    'PRODUCTION', '3015112004', 'MBBank', 'PHAN THANH HAI', '3015112004'
) ON CONFLICT (gateway_name) DO NOTHING;

-- 6. PERMISSIONS
INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PER_PAYMENT_GW_CREATE', 'payment_gateway:create', 'BILLING', 'Sinh QR Code thanh toán cho hóa đơn'),
    ('PER_PAYMENT_GW_READ', 'payment_gateway:read', 'BILLING', 'Xem chi tiết/trạng thái lệnh thanh toán'),
    ('PER_PAYMENT_GW_CANCEL', 'payment_gateway:cancel', 'BILLING', 'Hủy lệnh thanh toán QR'),
    ('PER_PAYMENT_GW_CONFIG', 'payment_gateway:config', 'BILLING', 'Xem/sửa cấu hình cổng thanh toán SePay'),
    ('PER_PAYMENT_GW_STATS', 'payment_gateway:stats', 'BILLING', 'Xem thống kê giao dịch thanh toán online'),
    ('PER_PAYMENT_GW_VERIFY', 'payment_gateway:verify', 'BILLING', 'Xác minh thủ công giao dịch thanh toán')
ON CONFLICT (permissions_id) DO NOTHING;

-- 7. API PERMISSIONS
INSERT INTO api_permissions (api_id, method, endpoint, description, module)
VALUES
    ('API_PGW_QR_GENERATE', 'POST', '/api/billing/payments/qr-generate', 'Sinh QR Code thanh toán', 'BILLING'),
    ('API_PGW_ORDER_DETAIL', 'GET', '/api/billing/payments/orders/:orderId', 'Xem chi tiết lệnh thanh toán', 'BILLING'),
    ('API_PGW_ORDER_STATUS', 'GET', '/api/billing/payments/orders/:orderId/status', 'Kiểm tra trạng thái thanh toán', 'BILLING'),
    ('API_PGW_ORDER_CANCEL', 'POST', '/api/billing/payments/orders/:orderId/cancel', 'Hủy lệnh thanh toán', 'BILLING'),
    ('API_PGW_INVOICE_ORDERS', 'GET', '/api/billing/payments/invoice/:invoiceId/orders', 'Lịch sử QR theo hóa đơn', 'BILLING'),
    ('API_PGW_WEBHOOK_VERIFY', 'GET', '/api/billing/payments/webhook/verify/:orderId', 'Xác minh thủ công giao dịch', 'BILLING'),
    ('API_PGW_CONFIG_GET', 'GET', '/api/billing/payments/gateway/config', 'Xem cấu hình gateway', 'BILLING'),
    ('API_PGW_CONFIG_PUT', 'PUT', '/api/billing/payments/gateway/config', 'Cập nhật cấu hình gateway', 'BILLING'),
    ('API_PGW_CONFIG_TEST', 'POST', '/api/billing/payments/gateway/test', 'Test kết nối gateway', 'BILLING'),
    ('API_PGW_HISTORY', 'GET', '/api/billing/payments/online/history', 'Lịch sử thanh toán online', 'BILLING'),
    ('API_PGW_STATS', 'GET', '/api/billing/payments/online/stats', 'Thống kê thanh toán online', 'BILLING')
ON CONFLICT (api_id) DO NOTHING;

-- 8. ROLE API PERMISSIONS (ADMIN: full, STAFF: create+read+cancel)
INSERT INTO role_api_permissions (role_id, api_id)
VALUES
    ('ROLE_ADMIN', 'API_PGW_QR_GENERATE'),
    ('ROLE_ADMIN', 'API_PGW_ORDER_DETAIL'),
    ('ROLE_ADMIN', 'API_PGW_ORDER_STATUS'),
    ('ROLE_ADMIN', 'API_PGW_ORDER_CANCEL'),
    ('ROLE_ADMIN', 'API_PGW_INVOICE_ORDERS'),
    ('ROLE_ADMIN', 'API_PGW_WEBHOOK_VERIFY'),
    ('ROLE_ADMIN', 'API_PGW_CONFIG_GET'),
    ('ROLE_ADMIN', 'API_PGW_CONFIG_PUT'),
    ('ROLE_ADMIN', 'API_PGW_CONFIG_TEST'),
    ('ROLE_ADMIN', 'API_PGW_HISTORY'),
    ('ROLE_ADMIN', 'API_PGW_STATS'),
    ('ROLE_STAFF', 'API_PGW_QR_GENERATE'),
    ('ROLE_STAFF', 'API_PGW_ORDER_DETAIL'),
    ('ROLE_STAFF', 'API_PGW_ORDER_STATUS'),
    ('ROLE_STAFF', 'API_PGW_ORDER_CANCEL'),
    ('ROLE_STAFF', 'API_PGW_INVOICE_ORDERS'),
    ('ROLE_STAFF', 'API_PGW_HISTORY')
ON CONFLICT (role_id, api_id) DO NOTHING;
