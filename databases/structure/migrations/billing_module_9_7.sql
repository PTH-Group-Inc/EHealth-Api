-- *********************************************************************
-- MODULE 9.7: HOÀN TIỀN & ĐIỀU CHỈNH GIAO DỊCH
-- (Refunds & Transaction Adjustments)
-- *********************************************************************

-- =====================================================================
-- 1. refund_requests — Yêu cầu hoàn tiền (có phê duyệt)
-- =====================================================================
CREATE TABLE IF NOT EXISTS refund_requests (
    request_id             VARCHAR(50) PRIMARY KEY,
    request_code           VARCHAR(100) UNIQUE NOT NULL,       -- RFD-YYYYMMDD-XXXX
    transaction_id         VARCHAR(50) NOT NULL,               -- GD gốc cần hoàn
    invoice_id             VARCHAR(50) NOT NULL,
    patient_id             VARCHAR(50),
    -- Loại & số tiền
    refund_type            VARCHAR(20) NOT NULL,               -- FULL | PARTIAL
    original_amount        DECIMAL(15,2) NOT NULL,             -- Số tiền GD gốc
    refund_amount          DECIMAL(15,2) NOT NULL,             -- Số tiền hoàn
    refund_method          VARCHAR(50) NOT NULL,               -- CASH | CREDIT_CARD | BANK_TRANSFER
    -- Lý do
    reason_category        VARCHAR(50) NOT NULL,               -- OVERCHARGE | SERVICE_CANCELLED | ...
    reason_detail          TEXT,
    evidence_urls          JSONB,                              -- URLs bằng chứng
    -- Workflow
    status                 VARCHAR(20) DEFAULT 'PENDING',      -- PENDING|APPROVED|REJECTED|PROCESSING|COMPLETED|FAILED|CANCELLED
    requested_by           VARCHAR(50),
    requested_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by            VARCHAR(50),
    approved_at            TIMESTAMPTZ,
    rejected_by            VARCHAR(50),
    rejected_at            TIMESTAMPTZ,
    reject_reason          TEXT,
    processed_by           VARCHAR(50),
    processed_at           TIMESTAMPTZ,
    completed_at           TIMESTAMPTZ,
    -- Hoàn tiền — kết quả
    refund_transaction_id  VARCHAR(50),                        -- ID txn REFUND mới tạo
    gateway_refund_id      VARCHAR(255),                       -- ID hoàn trên gateway (nếu online)
    -- Metadata
    notes                  TEXT,
    facility_id            VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES payment_transactions(payment_transactions_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES users(users_id),
    FOREIGN KEY (approved_by) REFERENCES users(users_id),
    FOREIGN KEY (rejected_by) REFERENCES users(users_id),
    FOREIGN KEY (processed_by) REFERENCES users(users_id),
    FOREIGN KEY (refund_transaction_id) REFERENCES payment_transactions(payment_transactions_id)
);

CREATE INDEX IF NOT EXISTS idx_refund_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_txn ON refund_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refund_invoice ON refund_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refund_patient ON refund_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_refund_date ON refund_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_pending ON refund_requests(status) WHERE status = 'PENDING';

-- =====================================================================
-- 2. transaction_adjustments — Điều chỉnh giao dịch
-- =====================================================================
CREATE TABLE IF NOT EXISTS transaction_adjustments (
    adjustment_id          VARCHAR(50) PRIMARY KEY,
    adjustment_code        VARCHAR(100) UNIQUE NOT NULL,       -- ADJ-YYYYMMDD-XXXX
    original_transaction_id VARCHAR(50) NOT NULL,
    invoice_id             VARCHAR(50) NOT NULL,
    -- Loại điều chỉnh
    adjustment_type        VARCHAR(30) NOT NULL,               -- OVERCHARGE|UNDERCHARGE|WRONG_METHOD|DUPLICATE|OTHER
    adjustment_amount      DECIMAL(15,2) NOT NULL,             -- + = cần thu thêm, - = cần hoàn
    description            TEXT NOT NULL,
    -- GD bù/hoàn
    corrective_transaction_id VARCHAR(50),                     -- GD mới tạo để điều chỉnh
    -- Workflow
    status                 VARCHAR(20) DEFAULT 'PENDING',      -- PENDING|APPROVED|APPLIED|REJECTED
    requested_by           VARCHAR(50),
    requested_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by            VARCHAR(50),
    approved_at            TIMESTAMPTZ,
    applied_by             VARCHAR(50),
    applied_at             TIMESTAMPTZ,
    reject_reason          TEXT,
    notes                  TEXT,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_transaction_id) REFERENCES payment_transactions(payment_transactions_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (corrective_transaction_id) REFERENCES payment_transactions(payment_transactions_id),
    FOREIGN KEY (requested_by) REFERENCES users(users_id),
    FOREIGN KEY (approved_by) REFERENCES users(users_id),
    FOREIGN KEY (applied_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_adj_status ON transaction_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_adj_txn ON transaction_adjustments(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_adj_invoice ON transaction_adjustments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_adj_date ON transaction_adjustments(requested_at DESC);

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_REFUND_REQUEST',       'BILLING_REFUND_REQUEST',       'BILLING', 'Tạo yêu cầu hoàn tiền'),
('PERM_BILLING_REFUND_APPROVE',       'BILLING_REFUND_APPROVE',       'BILLING', 'Phê duyệt/từ chối hoàn tiền'),
('PERM_BILLING_REFUND_PROCESS',       'BILLING_REFUND_PROCESS',       'BILLING', 'Xử lý hoàn tiền (thực hiện)'),
('PERM_BILLING_ADJUSTMENT_CREATE',    'BILLING_ADJUSTMENT_CREATE',    'BILLING', 'Tạo điều chỉnh giao dịch'),
('PERM_BILLING_ADJUSTMENT_APPROVE',   'BILLING_ADJUSTMENT_APPROVE',   'BILLING', 'Phê duyệt điều chỉnh'),
('PERM_BILLING_REFUND_VIEW',          'BILLING_REFUND_VIEW',          'BILLING', 'Xem hoàn tiền & điều chỉnh')
ON CONFLICT DO NOTHING;

-- ROLE → JWT PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'BILLING_REFUND_REQUEST','BILLING_REFUND_APPROVE','BILLING_REFUND_PROCESS',
    'BILLING_ADJUSTMENT_CREATE','BILLING_ADJUSTMENT_APPROVE','BILLING_REFUND_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'BILLING_REFUND_REQUEST','BILLING_REFUND_PROCESS','BILLING_REFUND_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Yêu cầu hoàn tiền
('API_BIL_REFUND_CREATE',      'BILLING', 'POST',  '/api/billing/refunds/requests',                    'Tạo yêu cầu hoàn tiền'),
('API_BIL_REFUND_LIST',        'BILLING', 'GET',   '/api/billing/refunds/requests',                    'Danh sách yêu cầu hoàn tiền'),
('API_BIL_REFUND_DETAIL',      'BILLING', 'GET',   '/api/billing/refunds/requests/:id',                'Chi tiết yêu cầu hoàn tiền'),
-- Nhóm 2: Phê duyệt
('API_BIL_REFUND_APPROVE',     'BILLING', 'PATCH', '/api/billing/refunds/requests/:id/approve',        'Phê duyệt hoàn tiền'),
('API_BIL_REFUND_REJECT',      'BILLING', 'PATCH', '/api/billing/refunds/requests/:id/reject',         'Từ chối hoàn tiền'),
('API_BIL_REFUND_PROCESS',     'BILLING', 'PATCH', '/api/billing/refunds/requests/:id/process',        'Xử lý hoàn tiền'),
('API_BIL_REFUND_CANCEL',      'BILLING', 'PATCH', '/api/billing/refunds/requests/:id/cancel',         'Hủy yêu cầu hoàn tiền'),
-- Nhóm 3: Điều chỉnh
('API_BIL_ADJ_CREATE',         'BILLING', 'POST',  '/api/billing/refunds/adjustments',                 'Tạo điều chỉnh giao dịch'),
('API_BIL_ADJ_LIST',           'BILLING', 'GET',   '/api/billing/refunds/adjustments',                 'Danh sách điều chỉnh'),
('API_BIL_ADJ_DETAIL',         'BILLING', 'GET',   '/api/billing/refunds/adjustments/:id',             'Chi tiết điều chỉnh'),
('API_BIL_ADJ_APPROVE',        'BILLING', 'PATCH', '/api/billing/refunds/adjustments/:id/approve',     'Phê duyệt điều chỉnh'),
('API_BIL_ADJ_APPLY',          'BILLING', 'PATCH', '/api/billing/refunds/adjustments/:id/apply',       'Áp dụng điều chỉnh'),
('API_BIL_ADJ_REJECT',         'BILLING', 'PATCH', '/api/billing/refunds/adjustments/:id/reject',      'Từ chối điều chỉnh'),
-- Nhóm 4: Dashboard & Tracking
('API_BIL_REFUND_DASHBOARD',   'BILLING', 'GET',   '/api/billing/refunds/dashboard',                   'Dashboard hoàn tiền'),
('API_BIL_REFUND_TIMELINE',    'BILLING', 'GET',   '/api/billing/refunds/requests/:id/timeline',       'Timeline yêu cầu hoàn tiền'),
('API_BIL_REFUND_TXN_HISTORY', 'BILLING', 'GET',   '/api/billing/refunds/transaction/:txnId/history',  'Lịch sử hoàn/điều chỉnh GD')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API PERMISSIONS
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_BIL_REFUND_CREATE','API_BIL_REFUND_LIST','API_BIL_REFUND_DETAIL',
    'API_BIL_REFUND_APPROVE','API_BIL_REFUND_REJECT','API_BIL_REFUND_PROCESS','API_BIL_REFUND_CANCEL',
    'API_BIL_ADJ_CREATE','API_BIL_ADJ_LIST','API_BIL_ADJ_DETAIL',
    'API_BIL_ADJ_APPROVE','API_BIL_ADJ_APPLY','API_BIL_ADJ_REJECT',
    'API_BIL_REFUND_DASHBOARD','API_BIL_REFUND_TIMELINE','API_BIL_REFUND_TXN_HISTORY'
) ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_BIL_REFUND_CREATE','API_BIL_REFUND_LIST','API_BIL_REFUND_DETAIL',
    'API_BIL_REFUND_PROCESS','API_BIL_REFUND_CANCEL',
    'API_BIL_REFUND_DASHBOARD','API_BIL_REFUND_TIMELINE','API_BIL_REFUND_TXN_HISTORY'
) ON CONFLICT DO NOTHING;
