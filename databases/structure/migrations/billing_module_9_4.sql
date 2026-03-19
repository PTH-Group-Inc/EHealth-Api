-- *********************************************************************
-- MODULE 9.4: THANH TOÁN TẠI QUẦY (Offline Payment)
-- *********************************************************************

-- =====================================================================
-- 1. Bảng mới: pos_terminals — Quản lý thiết bị POS/máy quẹt thẻ
-- =====================================================================
CREATE TABLE IF NOT EXISTS pos_terminals (
    terminal_id          VARCHAR(50) PRIMARY KEY,
    terminal_code        VARCHAR(50) UNIQUE NOT NULL,
    terminal_name        VARCHAR(100) NOT NULL,
    terminal_type        VARCHAR(30) DEFAULT 'COMBO',       -- CARD_READER | QR_SCANNER | COMBO
    brand                VARCHAR(100),
    model                VARCHAR(100),
    serial_number        VARCHAR(100),
    location_description VARCHAR(255),
    branch_id            VARCHAR(50) NOT NULL,
    is_active            BOOLEAN DEFAULT TRUE,
    created_by           VARCHAR(50),
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_terminals_branch ON pos_terminals(branch_id);
CREATE INDEX IF NOT EXISTS idx_pos_terminals_active ON pos_terminals(is_active) WHERE is_active = TRUE;

-- =====================================================================
-- 2. ALTER bảng payment_transactions — bổ sung thông tin POS & VOID
-- =====================================================================
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS terminal_id    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS shift_id       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS approval_code  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4),
    ADD COLUMN IF NOT EXISTS card_brand     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS voided_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS voided_by      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS void_reason    TEXT;

-- FK terminal_id → pos_terminals
DO $$ BEGIN
    ALTER TABLE payment_transactions
        ADD CONSTRAINT fk_payment_trans_terminal
        FOREIGN KEY (terminal_id) REFERENCES pos_terminals(terminal_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK shift_id → cashier_shifts
DO $$ BEGIN
    ALTER TABLE payment_transactions
        ADD CONSTRAINT fk_payment_trans_shift
        FOREIGN KEY (shift_id) REFERENCES cashier_shifts(cashier_shifts_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK voided_by → users
DO $$ BEGIN
    ALTER TABLE payment_transactions
        ADD CONSTRAINT fk_payment_trans_voided_by
        FOREIGN KEY (voided_by) REFERENCES users(users_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_trans_shift ON payment_transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_payment_trans_terminal ON payment_transactions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_payment_trans_voided ON payment_transactions(voided_at) WHERE voided_at IS NOT NULL;

-- =====================================================================
-- 3. ALTER bảng cashier_shifts — bổ sung thông tin chi nhánh & thống kê
-- =====================================================================
ALTER TABLE cashier_shifts
    ADD COLUMN IF NOT EXISTS branch_id                VARCHAR(50),
    ADD COLUMN IF NOT EXISTS facility_id              VARCHAR(50),
    ADD COLUMN IF NOT EXISTS total_cash_payments      DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_card_payments      DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_transfer_payments  DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_refunds            DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_voids              DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS transaction_count        INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS closed_by                VARCHAR(50);

-- FK branch_id → branches
DO $$ BEGIN
    ALTER TABLE cashier_shifts
        ADD CONSTRAINT fk_cashier_shifts_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK facility_id → facilities
DO $$ BEGIN
    ALTER TABLE cashier_shifts
        ADD CONSTRAINT fk_cashier_shifts_facility
        FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK closed_by → users
DO $$ BEGIN
    ALTER TABLE cashier_shifts
        ADD CONSTRAINT fk_cashier_shifts_closed_by
        FOREIGN KEY (closed_by) REFERENCES users(users_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_branch ON cashier_shifts(branch_id);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_facility ON cashier_shifts(facility_id);

-- =====================================================================
-- 4. Bảng mới: payment_receipts — Biên lai thanh toán
-- =====================================================================
CREATE TABLE IF NOT EXISTS payment_receipts (
    receipt_id                 VARCHAR(50) PRIMARY KEY,
    receipt_number             VARCHAR(100) UNIQUE NOT NULL,      -- RCP-YYYYMMDD-XXXX
    payment_transaction_id     VARCHAR(50) NOT NULL,
    invoice_id                 VARCHAR(50) NOT NULL,
    patient_id                 VARCHAR(50) NOT NULL,
    -- Snapshot thông tin tại thời điểm in
    patient_name               VARCHAR(255) NOT NULL,
    patient_code               VARCHAR(50),
    facility_name              VARCHAR(255),
    facility_address           TEXT,
    cashier_name               VARCHAR(255) NOT NULL,
    cashier_id                 VARCHAR(50) NOT NULL,
    items_snapshot             JSONB NOT NULL,                     -- [{item_name, qty, unit_price, subtotal, discount, insurance}]
    total_amount               DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount            DECIMAL(12,2) DEFAULT 0,
    insurance_amount           DECIMAL(12,2) DEFAULT 0,
    net_amount                 DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount                DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method             VARCHAR(50) NOT NULL,
    change_amount              DECIMAL(12,2) DEFAULT 0,           -- Tiền thừa
    receipt_type               VARCHAR(20) DEFAULT 'PAYMENT',     -- PAYMENT | REFUND | VOID
    printed_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reprint_count              INT DEFAULT 0,
    voided_at                  TIMESTAMPTZ,
    voided_by                  VARCHAR(50),
    void_reason                TEXT,
    shift_id                   VARCHAR(50),
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(payment_transactions_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (cashier_id) REFERENCES users(users_id),
    FOREIGN KEY (voided_by) REFERENCES users(users_id),
    FOREIGN KEY (shift_id) REFERENCES cashier_shifts(cashier_shifts_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_transaction ON payment_receipts(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON payment_receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_shift ON payment_receipts(shift_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_type ON payment_receipts(receipt_type);

-- =====================================================================
-- 5. Bảng mới: shift_cash_denominations — Mệnh giá tiền khi đóng ca
-- =====================================================================
CREATE TABLE IF NOT EXISTS shift_cash_denominations (
    denomination_id      VARCHAR(50) PRIMARY KEY,
    shift_id             VARCHAR(50) NOT NULL,
    denomination_value   INT NOT NULL,                  -- 500000, 200000, 100000, ...
    quantity             INT NOT NULL DEFAULT 0,
    subtotal             DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES cashier_shifts(cashier_shifts_id) ON DELETE CASCADE,
    UNIQUE(shift_id, denomination_value)
);

CREATE INDEX IF NOT EXISTS idx_denomination_shift ON shift_cash_denominations(shift_id);

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_OFFLINE_PAYMENT',   'BILLING_OFFLINE_PAYMENT',   'BILLING', 'Thu tiền tại quầy (CASH, POS, chuyển khoản)'),
('PERM_BILLING_OFFLINE_VOID',      'BILLING_OFFLINE_VOID',      'BILLING', 'Hủy giao dịch thanh toán (VOID) tại quầy'),
('PERM_BILLING_POS_MANAGE',        'BILLING_POS_MANAGE',        'BILLING', 'Quản lý thiết bị POS'),
('PERM_BILLING_RECEIPT_REPRINT',   'BILLING_RECEIPT_REPRINT',   'BILLING', 'In lại biên lai thanh toán'),
('PERM_BILLING_DAILY_REPORT',      'BILLING_DAILY_REPORT',      'BILLING', 'Xem báo cáo cuối ngày & hiệu suất thu ngân')
ON CONFLICT DO NOTHING;

-- *********************************************************************
-- ROLE → JWT PERMISSIONS
-- *********************************************************************

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'BILLING_OFFLINE_PAYMENT','BILLING_OFFLINE_VOID','BILLING_POS_MANAGE',
    'BILLING_RECEIPT_REPRINT','BILLING_DAILY_REPORT'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: thu tiền + void + in lại biên lai (không quản lý POS, không xem báo cáo tổng)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'BILLING_OFFLINE_PAYMENT','BILLING_OFFLINE_VOID','BILLING_RECEIPT_REPRINT'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Thanh toán tại quầy
('API_BIL_OFP_PAY',              'BILLING', 'POST',  '/api/billing/offline/pay',                                    'Thanh toán tại quầy'),
('API_BIL_OFP_VOID',             'BILLING', 'POST',  '/api/billing/offline/transactions/:transactionId/void',        'Hủy giao dịch (VOID)'),
('API_BIL_OFP_TRANS_LIST',       'BILLING', 'GET',   '/api/billing/offline/transactions',                            'Danh sách giao dịch tại quầy'),

-- Nhóm 2: POS Terminals
('API_BIL_OFP_TERM_CREATE',      'BILLING', 'POST',  '/api/billing/offline/terminals',                               'Đăng ký thiết bị POS'),
('API_BIL_OFP_TERM_UPDATE',      'BILLING', 'PUT',   '/api/billing/offline/terminals/:terminalId',                   'Cập nhật thiết bị POS'),
('API_BIL_OFP_TERM_LIST',        'BILLING', 'GET',   '/api/billing/offline/terminals',                               'Danh sách thiết bị POS'),
('API_BIL_OFP_TERM_DETAIL',      'BILLING', 'GET',   '/api/billing/offline/terminals/:terminalId',                   'Chi tiết thiết bị POS'),
('API_BIL_OFP_TERM_TOGGLE',      'BILLING', 'PATCH', '/api/billing/offline/terminals/:terminalId/toggle',            'Bật/tắt thiết bị POS'),

-- Nhóm 3: Biên lai
('API_BIL_OFP_RCP_BY_TXN',       'BILLING', 'GET',   '/api/billing/offline/receipts/by-transaction/:transactionId',  'Biên lai theo giao dịch'),
('API_BIL_OFP_RCP_DETAIL',       'BILLING', 'GET',   '/api/billing/offline/receipts/:receiptId',                     'Chi tiết biên lai'),
('API_BIL_OFP_RCP_REPRINT',      'BILLING', 'POST',  '/api/billing/offline/receipts/:receiptId/reprint',             'In lại biên lai'),

-- Nhóm 4: Ca thu ngân mở rộng
('API_BIL_OFP_SHIFT_DENOM',      'BILLING', 'POST',  '/api/billing/offline/shifts/:shiftId/cash-denomination',       'Kê khai mệnh giá tiền khi đóng ca'),
('API_BIL_OFP_SHIFT_TRANS',      'BILLING', 'GET',   '/api/billing/offline/shifts/:shiftId/transactions',            'Giao dịch trong ca thu ngân'),
('API_BIL_OFP_SHIFT_SUMMARY',    'BILLING', 'GET',   '/api/billing/offline/shifts/:shiftId/summary',                 'Tổng kết ca thu ngân'),

-- Nhóm 5: Báo cáo
('API_BIL_OFP_DAILY_REPORT',     'BILLING', 'GET',   '/api/billing/offline/reports/daily',                           'Báo cáo cuối ngày'),
('API_BIL_OFP_CASHIER_PERF',     'BILLING', 'GET',   '/api/billing/offline/reports/cashier-performance',             'Hiệu suất thu ngân')
ON CONFLICT (method, endpoint) DO NOTHING;

-- *********************************************************************
-- ROLE → API PERMISSIONS
-- *********************************************************************

-- ADMIN: full 17 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_BIL_OFP_PAY','API_BIL_OFP_VOID','API_BIL_OFP_TRANS_LIST',
    'API_BIL_OFP_TERM_CREATE','API_BIL_OFP_TERM_UPDATE','API_BIL_OFP_TERM_LIST',
    'API_BIL_OFP_TERM_DETAIL','API_BIL_OFP_TERM_TOGGLE',
    'API_BIL_OFP_RCP_BY_TXN','API_BIL_OFP_RCP_DETAIL','API_BIL_OFP_RCP_REPRINT',
    'API_BIL_OFP_SHIFT_DENOM','API_BIL_OFP_SHIFT_TRANS','API_BIL_OFP_SHIFT_SUMMARY',
    'API_BIL_OFP_DAILY_REPORT','API_BIL_OFP_CASHIER_PERF'
) ON CONFLICT DO NOTHING;

-- STAFF: thanh toán + void + biên lai + ca thu ngân (không POS manage, không báo cáo tổng)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_BIL_OFP_PAY','API_BIL_OFP_VOID','API_BIL_OFP_TRANS_LIST',
    'API_BIL_OFP_TERM_LIST','API_BIL_OFP_TERM_DETAIL',
    'API_BIL_OFP_RCP_BY_TXN','API_BIL_OFP_RCP_DETAIL','API_BIL_OFP_RCP_REPRINT',
    'API_BIL_OFP_SHIFT_DENOM','API_BIL_OFP_SHIFT_TRANS','API_BIL_OFP_SHIFT_SUMMARY'
) ON CONFLICT DO NOTHING;
