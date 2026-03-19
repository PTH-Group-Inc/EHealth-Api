-- *********************************************************************
-- MODULE 9.6: ĐỐI SOÁT & QUYẾT TOÁN THANH TOÁN
-- (Reconciliation & Settlement)
-- *********************************************************************

-- =====================================================================
-- 1. reconciliation_sessions — Phiên đối soát
-- =====================================================================
CREATE TABLE IF NOT EXISTS reconciliation_sessions (
    session_id             VARCHAR(50) PRIMARY KEY,
    session_code           VARCHAR(100) UNIQUE NOT NULL,       -- REC-YYYYMMDD-XXXX
    reconciliation_type    VARCHAR(30) NOT NULL,               -- ONLINE | CASHIER_SHIFT | DAILY_SETTLEMENT
    reconcile_date         DATE NOT NULL,
    facility_id            VARCHAR(50),
    -- Tổng kết
    total_system_amount    DECIMAL(15,2) DEFAULT 0,
    total_external_amount  DECIMAL(15,2) DEFAULT 0,
    discrepancy_amount     DECIMAL(15,2) DEFAULT 0,
    total_transactions_matched   INT DEFAULT 0,
    total_transactions_unmatched INT DEFAULT 0,
    -- Trạng thái
    status                 VARCHAR(20) DEFAULT 'PENDING',      -- PENDING|REVIEWED|APPROVED|REJECTED|CLOSED
    notes                  TEXT,
    reviewed_by            VARCHAR(50),
    reviewed_at            TIMESTAMPTZ,
    approved_by            VARCHAR(50),
    approved_at            TIMESTAMPTZ,
    reject_reason          TEXT,
    -- Liên kết tùy loại
    shift_id               VARCHAR(50),                        -- Nếu type = CASHIER_SHIFT
    gateway_name           VARCHAR(50),                        -- Nếu type = ONLINE
    -- Metadata
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES cashier_shifts(cashier_shifts_id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(users_id),
    FOREIGN KEY (approved_by) REFERENCES users(users_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_recon_type ON reconciliation_sessions(reconciliation_type);
CREATE INDEX IF NOT EXISTS idx_recon_date ON reconciliation_sessions(reconcile_date DESC);
CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_recon_facility ON reconciliation_sessions(facility_id);
CREATE INDEX IF NOT EXISTS idx_recon_shift ON reconciliation_sessions(shift_id) WHERE shift_id IS NOT NULL;

-- =====================================================================
-- 2. reconciliation_items — Chi tiết từng dòng đối soát
-- =====================================================================
CREATE TABLE IF NOT EXISTS reconciliation_items (
    item_id                VARCHAR(50) PRIMARY KEY,
    session_id             VARCHAR(50) NOT NULL,
    match_status           VARCHAR(30) NOT NULL,               -- MATCHED|SYSTEM_ONLY|EXTERNAL_ONLY|AMOUNT_MISMATCH
    -- Bên system
    system_transaction_id  VARCHAR(50),
    system_transaction_code VARCHAR(100),
    system_amount          DECIMAL(15,2),
    system_method          VARCHAR(50),
    system_date            TIMESTAMPTZ,
    -- Bên external
    external_reference     VARCHAR(255),
    external_amount        DECIMAL(15,2),
    external_date          TIMESTAMPTZ,
    external_raw           JSONB,                              -- Raw data từ bank/gateway
    -- Chênh lệch
    discrepancy_amount     DECIMAL(15,2) DEFAULT 0,
    discrepancy_reason     TEXT,
    resolution_status      VARCHAR(20) DEFAULT 'UNRESOLVED',   -- UNRESOLVED|RESOLVED|WRITTEN_OFF
    resolved_by            VARCHAR(50),
    resolved_at            TIMESTAMPTZ,
    resolution_notes       TEXT,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES reconciliation_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (system_transaction_id) REFERENCES payment_transactions(payment_transactions_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_recon_item_session ON reconciliation_items(session_id);
CREATE INDEX IF NOT EXISTS idx_recon_item_match ON reconciliation_items(match_status);
CREATE INDEX IF NOT EXISTS idx_recon_item_resolution ON reconciliation_items(resolution_status) WHERE resolution_status = 'UNRESOLVED';

-- =====================================================================
-- 3. settlement_reports — Phiếu quyết toán
-- =====================================================================
CREATE TABLE IF NOT EXISTS settlement_reports (
    report_id              VARCHAR(50) PRIMARY KEY,
    report_code            VARCHAR(100) UNIQUE NOT NULL,       -- STL-YYYYMMDD-XXXX
    report_type            VARCHAR(20) NOT NULL,               -- DAILY|WEEKLY|MONTHLY|CUSTOM
    period_start           DATE NOT NULL,
    period_end             DATE NOT NULL,
    facility_id            VARCHAR(50),
    -- Tổng kết tài chính
    total_revenue          DECIMAL(15,2) DEFAULT 0,
    total_cash             DECIMAL(15,2) DEFAULT 0,
    total_card             DECIMAL(15,2) DEFAULT 0,
    total_transfer         DECIMAL(15,2) DEFAULT 0,
    total_online           DECIMAL(15,2) DEFAULT 0,
    total_refunds          DECIMAL(15,2) DEFAULT 0,
    total_voids            DECIMAL(15,2) DEFAULT 0,
    net_revenue            DECIMAL(15,2) DEFAULT 0,
    total_discrepancies    INT DEFAULT 0,
    unresolved_discrepancies INT DEFAULT 0,
    -- Quyết toán
    status                 VARCHAR(20) DEFAULT 'DRAFT',        -- DRAFT|SUBMITTED|APPROVED|REJECTED
    submitted_by           VARCHAR(50),
    submitted_at           TIMESTAMPTZ,
    approved_by            VARCHAR(50),
    approved_at            TIMESTAMPTZ,
    reject_reason          TEXT,
    notes                  TEXT,
    export_data            JSONB,                              -- Snapshot data quyết toán đầy đủ
    -- Metadata
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(users_id),
    FOREIGN KEY (approved_by) REFERENCES users(users_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_settlement_type ON settlement_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_settlement_period ON settlement_reports(period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_status ON settlement_reports(status);
CREATE INDEX IF NOT EXISTS idx_settlement_facility ON settlement_reports(facility_id);

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_RECONCILE_VIEW',      'BILLING_RECONCILE_VIEW',      'BILLING', 'Xem phiên đối soát'),
('PERM_BILLING_RECONCILE_RUN',       'BILLING_RECONCILE_RUN',       'BILLING', 'Chạy đối soát (online / ca)'),
('PERM_BILLING_RECONCILE_RESOLVE',   'BILLING_RECONCILE_RESOLVE',   'BILLING', 'Xử lý chênh lệch đối soát'),
('PERM_BILLING_SETTLEMENT_VIEW',     'BILLING_SETTLEMENT_VIEW',     'BILLING', 'Xem phiếu quyết toán'),
('PERM_BILLING_SETTLEMENT_CREATE',   'BILLING_SETTLEMENT_CREATE',   'BILLING', 'Tạo phiếu quyết toán'),
('PERM_BILLING_SETTLEMENT_APPROVE',  'BILLING_SETTLEMENT_APPROVE',  'BILLING', 'Phê duyệt quyết toán')
ON CONFLICT DO NOTHING;

-- ROLE → JWT PERMISSIONS
-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'BILLING_RECONCILE_VIEW','BILLING_RECONCILE_RUN','BILLING_RECONCILE_RESOLVE',
    'BILLING_SETTLEMENT_VIEW','BILLING_SETTLEMENT_CREATE','BILLING_SETTLEMENT_APPROVE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: xem + chạy đối soát ca, xem quyết toán (không approve)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'BILLING_RECONCILE_VIEW','BILLING_RECONCILE_RUN',
    'BILLING_SETTLEMENT_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Đối soát
('API_BIL_RECON_ONLINE',          'BILLING', 'POST',  '/api/billing/reconciliation/online',                        'Chạy đối soát giao dịch online'),
('API_BIL_RECON_SHIFT',           'BILLING', 'POST',  '/api/billing/reconciliation/shift/:shiftId',                'Chạy đối soát ca thu ngân'),
('API_BIL_RECON_LIST',            'BILLING', 'GET',   '/api/billing/reconciliation/sessions',                      'Danh sách phiên đối soát'),
('API_BIL_RECON_DETAIL',          'BILLING', 'GET',   '/api/billing/reconciliation/sessions/:id',                  'Chi tiết phiên đối soát'),
('API_BIL_RECON_SHIFT_DISC',      'BILLING', 'GET',   '/api/billing/reconciliation/shifts/:shiftId/discrepancy',   'Chênh lệch ca thu ngân'),
-- Nhóm 2: Xử lý chênh lệch
('API_BIL_RECON_DISC_REPORT',     'BILLING', 'GET',   '/api/billing/reconciliation/discrepancy-report',            'Báo cáo chênh lệch'),
('API_BIL_RECON_RESOLVE',         'BILLING', 'PATCH', '/api/billing/reconciliation/items/:itemId/resolve',         'Xử lý chênh lệch'),
('API_BIL_RECON_REVIEW',          'BILLING', 'PATCH', '/api/billing/reconciliation/sessions/:id/review',           'Review phiên đối soát'),
('API_BIL_RECON_APPROVE',         'BILLING', 'PATCH', '/api/billing/reconciliation/sessions/:id/approve',          'Phê duyệt phiên đối soát'),
('API_BIL_RECON_REJECT',          'BILLING', 'PATCH', '/api/billing/reconciliation/sessions/:id/reject',           'Từ chối phiên đối soát'),
-- Nhóm 3: Quyết toán
('API_BIL_SETTLE_CREATE',         'BILLING', 'POST',  '/api/billing/reconciliation/settlements',                   'Tạo phiếu quyết toán'),
('API_BIL_SETTLE_SUBMIT',         'BILLING', 'PATCH', '/api/billing/reconciliation/settlements/:id/submit',        'Gửi phiếu quyết toán'),
('API_BIL_SETTLE_APPROVE',        'BILLING', 'PATCH', '/api/billing/reconciliation/settlements/:id/approve',       'Phê duyệt phiếu quyết toán'),
('API_BIL_SETTLE_REJECT',         'BILLING', 'PATCH', '/api/billing/reconciliation/settlements/:id/reject',        'Từ chối phiếu quyết toán'),
('API_BIL_SETTLE_LIST',           'BILLING', 'GET',   '/api/billing/reconciliation/settlements',                   'Danh sách phiếu quyết toán'),
('API_BIL_SETTLE_DETAIL',         'BILLING', 'GET',   '/api/billing/reconciliation/settlements/:id',               'Chi tiết phiếu quyết toán'),
-- Nhóm 4: Lịch sử & xuất
('API_BIL_RECON_HISTORY',         'BILLING', 'GET',   '/api/billing/reconciliation/history',                       'Lịch sử đối soát'),
('API_BIL_SETTLE_EXPORT',         'BILLING', 'GET',   '/api/billing/reconciliation/settlements/:id/export',        'Xuất data quyết toán')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API PERMISSIONS
-- ADMIN: full 18 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_BIL_RECON_ONLINE','API_BIL_RECON_SHIFT','API_BIL_RECON_LIST','API_BIL_RECON_DETAIL',
    'API_BIL_RECON_SHIFT_DISC','API_BIL_RECON_DISC_REPORT','API_BIL_RECON_RESOLVE',
    'API_BIL_RECON_REVIEW','API_BIL_RECON_APPROVE','API_BIL_RECON_REJECT',
    'API_BIL_SETTLE_CREATE','API_BIL_SETTLE_SUBMIT','API_BIL_SETTLE_APPROVE','API_BIL_SETTLE_REJECT',
    'API_BIL_SETTLE_LIST','API_BIL_SETTLE_DETAIL','API_BIL_RECON_HISTORY','API_BIL_SETTLE_EXPORT'
) ON CONFLICT DO NOTHING;

-- STAFF: xem + chạy đối soát ca + xem quyết toán
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_BIL_RECON_SHIFT','API_BIL_RECON_LIST','API_BIL_RECON_DETAIL',
    'API_BIL_RECON_SHIFT_DISC','API_BIL_SETTLE_LIST','API_BIL_SETTLE_DETAIL',
    'API_BIL_RECON_HISTORY'
) ON CONFLICT DO NOTHING;
