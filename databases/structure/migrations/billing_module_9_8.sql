-- *********************************************************************
-- MODULE 9.8: QUẢN LÝ CHÍNH SÁCH GIÁ & ƯU ĐÃI
-- (Pricing Policies & Promotions)
-- *********************************************************************

-- =====================================================================
-- 1. discount_policies — Chính sách giảm giá
-- =====================================================================
CREATE TABLE IF NOT EXISTS discount_policies (
    discount_id            VARCHAR(50) PRIMARY KEY,
    discount_code          VARCHAR(100) UNIQUE NOT NULL,       -- DSC-YYYYMMDD-XXXX
    name                   VARCHAR(255) NOT NULL,
    description            TEXT,
    -- Loại giảm giá
    discount_type          VARCHAR(20) NOT NULL,               -- PERCENTAGE | FIXED_AMOUNT
    discount_value         DECIMAL(15,2) NOT NULL,             -- % hoặc VND
    max_discount_amount    DECIMAL(15,2),                      -- Giới hạn nếu PERCENTAGE
    min_order_amount       DECIMAL(15,2) DEFAULT 0,            -- Đơn tối thiểu
    -- Phạm vi áp dụng
    apply_to               VARCHAR(30) DEFAULT 'ALL_SERVICES', -- ALL_SERVICES | SPECIFIC_SERVICES | SERVICE_GROUP
    applicable_services    JSONB,                              -- [{facility_service_id, service_name}]
    applicable_groups      JSONB,                              -- ["CONSULTATION","LAB_ORDER","DRUG"]
    -- Đối tượng
    target_patient_types   JSONB,                              -- ["VIP","ELDERLY"] hoặc null = all
    -- Thời gian
    effective_from         DATE NOT NULL,
    effective_to           DATE,                               -- NULL = vô thời hạn
    -- Trạng thái
    is_active              BOOLEAN DEFAULT TRUE,
    priority               INT DEFAULT 0,                      -- Cao hơn áp dụng trước
    facility_id            VARCHAR(50),
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_disc_active ON discount_policies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_disc_effective ON discount_policies(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_disc_facility ON discount_policies(facility_id);
CREATE INDEX IF NOT EXISTS idx_disc_priority ON discount_policies(priority DESC);

-- =====================================================================
-- 2. vouchers — Mã giảm giá / Coupon
-- =====================================================================
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id             VARCHAR(50) PRIMARY KEY,
    voucher_code           VARCHAR(50) UNIQUE NOT NULL,        -- VN50K, WELCOME10
    name                   VARCHAR(255) NOT NULL,
    description            TEXT,
    -- Giảm giá
    discount_type          VARCHAR(20) NOT NULL,               -- PERCENTAGE | FIXED_AMOUNT
    discount_value         DECIMAL(15,2) NOT NULL,
    max_discount_amount    DECIMAL(15,2),
    min_order_amount       DECIMAL(15,2) DEFAULT 0,
    -- Giới hạn
    max_usage              INT,                                -- Tổng lượt tối đa (null = unlimited)
    max_usage_per_patient  INT DEFAULT 1,                      -- 1 BN dùng tối đa
    current_usage          INT DEFAULT 0,
    -- Đối tượng
    target_patient_types   JSONB,                              -- null = all
    -- Thời gian
    valid_from             DATE NOT NULL,
    valid_to               DATE,
    is_active              BOOLEAN DEFAULT TRUE,
    facility_id            VARCHAR(50),
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_voucher_code ON vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_voucher_active ON vouchers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_voucher_valid ON vouchers(valid_from, valid_to);

-- =====================================================================
-- 3. voucher_usage — Lịch sử sử dụng voucher
-- =====================================================================
CREATE TABLE IF NOT EXISTS voucher_usage (
    usage_id               VARCHAR(50) PRIMARY KEY,
    voucher_id             VARCHAR(50) NOT NULL,
    invoice_id             VARCHAR(50) NOT NULL,
    patient_id             VARCHAR(50),
    discount_amount        DECIMAL(15,2) NOT NULL,             -- Số tiền thực giảm
    used_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    used_by                VARCHAR(50),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (used_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_vusage_voucher ON voucher_usage(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vusage_patient ON voucher_usage(patient_id);
CREATE INDEX IF NOT EXISTS idx_vusage_invoice ON voucher_usage(invoice_id);

-- =====================================================================
-- 4. service_bundles — Gói dịch vụ combo
-- =====================================================================
CREATE TABLE IF NOT EXISTS service_bundles (
    bundle_id              VARCHAR(50) PRIMARY KEY,
    bundle_code            VARCHAR(100) UNIQUE NOT NULL,       -- BDL-KHAMTQ, BDL-XETNGHIEM
    name                   VARCHAR(255) NOT NULL,
    description            TEXT,
    bundle_price           DECIMAL(15,2) NOT NULL,             -- Giá gói
    original_total_price   DECIMAL(15,2) DEFAULT 0,            -- Tổng giá lẻ
    discount_percentage    DECIMAL(5,2) DEFAULT 0,             -- % tiết kiệm
    -- Thời gian
    valid_from             DATE NOT NULL,
    valid_to               DATE,
    -- Đối tượng
    target_patient_types   JSONB,
    max_purchases          INT,                                -- null = unlimited
    current_purchases      INT DEFAULT 0,
    is_active              BOOLEAN DEFAULT TRUE,
    facility_id            VARCHAR(50),
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_active ON service_bundles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_bundle_valid ON service_bundles(valid_from, valid_to);

-- =====================================================================
-- 5. service_bundle_items — Chi tiết gói dịch vụ
-- =====================================================================
CREATE TABLE IF NOT EXISTS service_bundle_items (
    item_id                VARCHAR(50) PRIMARY KEY,
    bundle_id              VARCHAR(50) NOT NULL,
    facility_service_id    VARCHAR(50) NOT NULL,
    quantity               INT DEFAULT 1,
    unit_price             DECIMAL(15,2) NOT NULL,             -- Giá lẻ
    item_price             DECIMAL(15,2) NOT NULL,             -- Giá trong gói
    notes                  TEXT,
    FOREIGN KEY (bundle_id) REFERENCES service_bundles(bundle_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id)
);

CREATE INDEX IF NOT EXISTS idx_bitem_bundle ON service_bundle_items(bundle_id);

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_DISCOUNT_VIEW',    'BILLING_DISCOUNT_VIEW',    'BILLING', 'Xem chính sách giảm giá & ưu đãi'),
('PERM_BILLING_DISCOUNT_MANAGE',  'BILLING_DISCOUNT_MANAGE',  'BILLING', 'Quản lý chính sách giảm giá'),
('PERM_BILLING_DISCOUNT_APPLY',   'BILLING_DISCOUNT_APPLY',   'BILLING', 'Áp dụng giảm giá/voucher khi thanh toán'),
('PERM_BILLING_VOUCHER_VIEW',     'BILLING_VOUCHER_VIEW',     'BILLING', 'Xem voucher/coupon'),
('PERM_BILLING_VOUCHER_MANAGE',   'BILLING_VOUCHER_MANAGE',   'BILLING', 'Quản lý voucher/coupon'),
('PERM_BILLING_BUNDLE_MANAGE',    'BILLING_BUNDLE_MANAGE',    'BILLING', 'Quản lý gói dịch vụ')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'BILLING_DISCOUNT_VIEW','BILLING_DISCOUNT_MANAGE','BILLING_DISCOUNT_APPLY',
    'BILLING_VOUCHER_VIEW','BILLING_VOUCHER_MANAGE','BILLING_BUNDLE_MANAGE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'BILLING_DISCOUNT_VIEW','BILLING_DISCOUNT_APPLY',
    'BILLING_VOUCHER_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Chính sách giảm giá
('API_BIL_DISC_CREATE',      'BILLING', 'POST',   '/api/billing/pricing-policies/discounts',                   'Tạo chính sách giảm giá'),
('API_BIL_DISC_LIST',        'BILLING', 'GET',    '/api/billing/pricing-policies/discounts',                   'Danh sách chính sách giảm giá'),
('API_BIL_DISC_DETAIL',      'BILLING', 'GET',    '/api/billing/pricing-policies/discounts/:id',               'Chi tiết chính sách giảm giá'),
('API_BIL_DISC_UPDATE',      'BILLING', 'PUT',    '/api/billing/pricing-policies/discounts/:id',               'Cập nhật chính sách giảm giá'),
('API_BIL_DISC_DELETE',      'BILLING', 'DELETE', '/api/billing/pricing-policies/discounts/:id',               'Vô hiệu hóa chính sách giảm giá'),
('API_BIL_DISC_CALC',        'BILLING', 'POST',   '/api/billing/pricing-policies/discounts/calculate',         'Tính giảm giá cho dịch vụ'),
-- Nhóm 2: Voucher
('API_BIL_VOUCHER_CREATE',   'BILLING', 'POST',   '/api/billing/pricing-policies/vouchers',                    'Tạo voucher'),
('API_BIL_VOUCHER_LIST',     'BILLING', 'GET',    '/api/billing/pricing-policies/vouchers',                    'Danh sách voucher'),
('API_BIL_VOUCHER_DETAIL',   'BILLING', 'GET',    '/api/billing/pricing-policies/vouchers/:id',                'Chi tiết voucher'),
('API_BIL_VOUCHER_UPDATE',   'BILLING', 'PUT',    '/api/billing/pricing-policies/vouchers/:id',                'Cập nhật voucher'),
('API_BIL_VOUCHER_DELETE',   'BILLING', 'DELETE', '/api/billing/pricing-policies/vouchers/:id',                'Vô hiệu hóa voucher'),
('API_BIL_VOUCHER_VALIDATE', 'BILLING', 'POST',   '/api/billing/pricing-policies/vouchers/validate',           'Validate voucher code'),
('API_BIL_VOUCHER_REDEEM',   'BILLING', 'POST',   '/api/billing/pricing-policies/vouchers/redeem',             'Redeem voucher'),
('API_BIL_VOUCHER_USAGE',    'BILLING', 'GET',    '/api/billing/pricing-policies/vouchers/:id/usage',          'Lịch sử sử dụng voucher'),
-- Nhóm 3: Gói dịch vụ
('API_BIL_BUNDLE_CREATE',    'BILLING', 'POST',   '/api/billing/pricing-policies/bundles',                     'Tạo gói dịch vụ'),
('API_BIL_BUNDLE_LIST',      'BILLING', 'GET',    '/api/billing/pricing-policies/bundles',                     'Danh sách gói dịch vụ'),
('API_BIL_BUNDLE_DETAIL',    'BILLING', 'GET',    '/api/billing/pricing-policies/bundles/:id',                 'Chi tiết gói dịch vụ'),
('API_BIL_BUNDLE_UPDATE',    'BILLING', 'PUT',    '/api/billing/pricing-policies/bundles/:id',                 'Cập nhật gói dịch vụ'),
('API_BIL_BUNDLE_DELETE',    'BILLING', 'DELETE', '/api/billing/pricing-policies/bundles/:id',                 'Vô hiệu hóa gói dịch vụ'),
('API_BIL_BUNDLE_CALC',      'BILLING', 'POST',   '/api/billing/pricing-policies/bundles/:id/calculate',       'Tính giá gói vs giá lẻ'),
-- Nhóm 4: Tổng quan
('API_BIL_PROMO_ACTIVE',     'BILLING', 'GET',    '/api/billing/pricing-policies/active-promotions',           'Danh sách ưu đãi đang chạy'),
('API_BIL_POLICY_HISTORY',   'BILLING', 'GET',    '/api/billing/pricing-policies/history',                     'Lịch sử thay đổi chính sách')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_BIL_DISC_CREATE','API_BIL_DISC_LIST','API_BIL_DISC_DETAIL','API_BIL_DISC_UPDATE','API_BIL_DISC_DELETE','API_BIL_DISC_CALC',
    'API_BIL_VOUCHER_CREATE','API_BIL_VOUCHER_LIST','API_BIL_VOUCHER_DETAIL','API_BIL_VOUCHER_UPDATE','API_BIL_VOUCHER_DELETE',
    'API_BIL_VOUCHER_VALIDATE','API_BIL_VOUCHER_REDEEM','API_BIL_VOUCHER_USAGE',
    'API_BIL_BUNDLE_CREATE','API_BIL_BUNDLE_LIST','API_BIL_BUNDLE_DETAIL','API_BIL_BUNDLE_UPDATE','API_BIL_BUNDLE_DELETE','API_BIL_BUNDLE_CALC',
    'API_BIL_PROMO_ACTIVE','API_BIL_POLICY_HISTORY'
) ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_BIL_DISC_LIST','API_BIL_DISC_DETAIL','API_BIL_DISC_CALC',
    'API_BIL_VOUCHER_LIST','API_BIL_VOUCHER_DETAIL','API_BIL_VOUCHER_VALIDATE','API_BIL_VOUCHER_REDEEM','API_BIL_VOUCHER_USAGE',
    'API_BIL_BUNDLE_LIST','API_BIL_BUNDLE_DETAIL','API_BIL_BUNDLE_CALC',
    'API_BIL_PROMO_ACTIVE','API_BIL_POLICY_HISTORY'
) ON CONFLICT DO NOTHING;
