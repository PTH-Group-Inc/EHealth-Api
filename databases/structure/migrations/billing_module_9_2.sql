-- *********************************************************************
-- MODULE 9.2: THU PHÍ KHÁM & DỊCH VỤ Y TẾ
-- (Medical Service Billing & Payment)
-- *********************************************************************

-- =====================================================================
-- 1. ALTER bảng invoices — bổ sung cột
-- =====================================================================
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS facility_id      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS notes            TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_by     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- FK facility_id → facilities
DO $$ BEGIN
    ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_facility
        FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK cancelled_by → users
DO $$ BEGIN
    ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users(users_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- 2. ALTER bảng invoice_details — bổ sung cột
-- =====================================================================
ALTER TABLE invoice_details
    ADD COLUMN IF NOT EXISTS discount_amount   DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS insurance_covered  DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS patient_pays       DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS notes              TEXT;

-- =====================================================================
-- 3. ALTER bảng payment_transactions — bổ sung cột
-- =====================================================================
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS notes         TEXT,
    ADD COLUMN IF NOT EXISTS refund_reason TEXT,
    ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- =====================================================================
-- 4. Bảng mới: invoice_insurance_claims
-- Lưu thông tin claim BHYT cho từng hóa đơn
-- =====================================================================
CREATE TABLE IF NOT EXISTS invoice_insurance_claims (
    claim_id               VARCHAR(50) PRIMARY KEY,
    invoice_id             VARCHAR(50) NOT NULL,
    patient_insurance_id   VARCHAR(50) NOT NULL,
    coverage_percent       DECIMAL(5,2) NOT NULL,
    total_claimable        DECIMAL(12,2) NOT NULL DEFAULT 0,
    approved_amount        DECIMAL(12,2) DEFAULT 0,
    claim_status           VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, PARTIAL
    submitted_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at           TIMESTAMPTZ,
    notes                  TEXT,
    created_by             VARCHAR(50),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_insurance_id) REFERENCES patient_insurances(patient_insurances_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    UNIQUE(invoice_id)
);

-- =====================================================================
-- Performance Indexes
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_facility ON invoices(facility_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_encounter ON invoices(encounter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_details_invoice ON invoice_details(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_details_ref ON invoice_details(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_payment_trans_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_trans_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_trans_cashier ON payment_transactions(cashier_id);

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_cashier ON cashier_shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_status ON cashier_shifts(status);

CREATE INDEX IF NOT EXISTS idx_iic_invoice ON invoice_insurance_claims(invoice_id);
CREATE INDEX IF NOT EXISTS idx_iic_status ON invoice_insurance_claims(claim_status);

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_INVOICE_VIEW',    'BILLING_INVOICE_VIEW',    'BILLING', 'Xem hóa đơn, chi tiết hóa đơn, lịch sử thanh toán'),
('PERM_BILLING_INVOICE_CREATE',  'BILLING_INVOICE_CREATE',  'BILLING', 'Tạo mới hóa đơn, thêm dòng chi tiết vào hóa đơn'),
('PERM_BILLING_INVOICE_UPDATE',  'BILLING_INVOICE_UPDATE',  'BILLING', 'Cập nhật hóa đơn, dòng chi tiết, tính lại tổng tiền'),
('PERM_BILLING_INVOICE_CANCEL',  'BILLING_INVOICE_CANCEL',  'BILLING', 'Hủy hóa đơn'),
('PERM_BILLING_PAYMENT_CREATE',  'BILLING_PAYMENT_CREATE',  'BILLING', 'Ghi nhận thanh toán'),
('PERM_BILLING_PAYMENT_REFUND',  'BILLING_PAYMENT_REFUND',  'BILLING', 'Hoàn tiền giao dịch'),
('PERM_BILLING_CASHIER_MANAGE',  'BILLING_CASHIER_MANAGE',  'BILLING', 'Quản lý ca thu ngân: mở ca, đóng ca, xem ca')
ON CONFLICT DO NOTHING;

-- *********************************************************************
-- ROLE → JWT PERMISSIONS
-- *********************************************************************

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'BILLING_INVOICE_VIEW','BILLING_INVOICE_CREATE','BILLING_INVOICE_UPDATE','BILLING_INVOICE_CANCEL',
    'BILLING_PAYMENT_CREATE','BILLING_PAYMENT_REFUND','BILLING_CASHIER_MANAGE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: full trừ refund
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'BILLING_INVOICE_VIEW','BILLING_INVOICE_CREATE','BILLING_INVOICE_UPDATE','BILLING_INVOICE_CANCEL',
    'BILLING_PAYMENT_CREATE','BILLING_CASHIER_MANAGE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR, NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('DOCTOR','NURSE') AND p.code = 'BILLING_INVOICE_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Hóa đơn
('API_BIL_INV_CREATE',        'BILLING', 'POST',   '/api/billing/invoices',                                 'Tạo hóa đơn mới'),
('API_BIL_INV_GENERATE',      'BILLING', 'POST',   '/api/billing/invoices/generate/:encounterId',            'Tạo HĐ tự động từ encounter'),
('API_BIL_INV_LIST',          'BILLING', 'GET',    '/api/billing/invoices',                                  'Danh sách hóa đơn'),
('API_BIL_INV_DETAIL',        'BILLING', 'GET',    '/api/billing/invoices/:invoiceId',                       'Chi tiết hóa đơn'),
('API_BIL_INV_UPDATE',        'BILLING', 'PUT',    '/api/billing/invoices/:invoiceId',                       'Cập nhật hóa đơn'),
('API_BIL_INV_CANCEL',        'BILLING', 'PATCH',  '/api/billing/invoices/:invoiceId/cancel',                'Hủy hóa đơn'),
('API_BIL_INV_BY_ENC',        'BILLING', 'GET',    '/api/billing/invoices/by-encounter/:encounterId',        'Lấy HĐ theo encounter'),
('API_BIL_INV_BY_PAT',        'BILLING', 'GET',    '/api/billing/invoices/by-patient/:patientId',            'Lịch sử HĐ bệnh nhân'),

-- Nhóm 2: Chi tiết hóa đơn
('API_BIL_ITEM_ADD',          'BILLING', 'POST',   '/api/billing/invoices/:invoiceId/items',                 'Thêm dòng chi tiết'),
('API_BIL_ITEM_UPDATE',       'BILLING', 'PUT',    '/api/billing/invoices/:invoiceId/items/:itemId',         'Sửa dòng chi tiết'),
('API_BIL_ITEM_DELETE',       'BILLING', 'DELETE', '/api/billing/invoices/:invoiceId/items/:itemId',         'Xóa dòng chi tiết'),
('API_BIL_RECALC',            'BILLING', 'POST',   '/api/billing/invoices/:invoiceId/recalculate',           'Tính lại tổng HĐ'),

-- Nhóm 3: Thanh toán
('API_BIL_PAY_CREATE',        'BILLING', 'POST',   '/api/billing/payments',                                  'Ghi nhận thanh toán'),
('API_BIL_PAY_DETAIL',        'BILLING', 'GET',    '/api/billing/payments/:paymentId',                       'Chi tiết giao dịch'),
('API_BIL_PAY_BY_INV',        'BILLING', 'GET',    '/api/billing/payments/by-invoice/:invoiceId',            'Giao dịch theo HĐ'),
('API_BIL_PAY_REFUND',        'BILLING', 'POST',   '/api/billing/payments/:paymentId/refund',                'Hoàn tiền'),

-- Nhóm 4: Ca thu ngân
('API_BIL_SHIFT_OPEN',        'BILLING', 'POST',   '/api/billing/cashier-shifts',                            'Mở ca thu ngân'),
('API_BIL_SHIFT_CLOSE',       'BILLING', 'PATCH',  '/api/billing/cashier-shifts/:shiftId/close',             'Đóng ca thu ngân'),
('API_BIL_SHIFT_DETAIL',      'BILLING', 'GET',    '/api/billing/cashier-shifts/:shiftId',                   'Chi tiết ca thu ngân'),
('API_BIL_SHIFT_LIST',        'BILLING', 'GET',    '/api/billing/cashier-shifts',                            'Danh sách ca thu ngân'),

-- Nhóm 5: Thống kê
('API_BIL_SUMMARY',           'BILLING', 'GET',    '/api/billing/invoices/summary/:facilityId',              'Thống kê doanh thu'),
('API_BIL_INS_CLAIM',         'BILLING', 'GET',    '/api/billing/invoices/:invoiceId/insurance-claim',       'Thông tin claim BHYT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- *********************************************************************
-- ROLE → API PERMISSIONS
-- *********************************************************************

-- ADMIN: full 22 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_BIL_INV_CREATE','API_BIL_INV_GENERATE','API_BIL_INV_LIST','API_BIL_INV_DETAIL',
    'API_BIL_INV_UPDATE','API_BIL_INV_CANCEL','API_BIL_INV_BY_ENC','API_BIL_INV_BY_PAT',
    'API_BIL_ITEM_ADD','API_BIL_ITEM_UPDATE','API_BIL_ITEM_DELETE','API_BIL_RECALC',
    'API_BIL_PAY_CREATE','API_BIL_PAY_DETAIL','API_BIL_PAY_BY_INV','API_BIL_PAY_REFUND',
    'API_BIL_SHIFT_OPEN','API_BIL_SHIFT_CLOSE','API_BIL_SHIFT_DETAIL','API_BIL_SHIFT_LIST',
    'API_BIL_SUMMARY','API_BIL_INS_CLAIM'
) ON CONFLICT DO NOTHING;

-- STAFF: full trừ REFUND
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_BIL_INV_CREATE','API_BIL_INV_GENERATE','API_BIL_INV_LIST','API_BIL_INV_DETAIL',
    'API_BIL_INV_UPDATE','API_BIL_INV_CANCEL','API_BIL_INV_BY_ENC','API_BIL_INV_BY_PAT',
    'API_BIL_ITEM_ADD','API_BIL_ITEM_UPDATE','API_BIL_ITEM_DELETE','API_BIL_RECALC',
    'API_BIL_PAY_CREATE','API_BIL_PAY_DETAIL','API_BIL_PAY_BY_INV',
    'API_BIL_SHIFT_OPEN','API_BIL_SHIFT_CLOSE','API_BIL_SHIFT_DETAIL','API_BIL_SHIFT_LIST',
    'API_BIL_SUMMARY','API_BIL_INS_CLAIM'
) ON CONFLICT DO NOTHING;

-- DOCTOR, NURSE: chỉ xem HĐ
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR','NURSE') AND a.api_id IN (
    'API_BIL_INV_LIST','API_BIL_INV_DETAIL','API_BIL_INV_BY_ENC','API_BIL_INV_BY_PAT','API_BIL_INS_CLAIM'
) ON CONFLICT DO NOTHING;
