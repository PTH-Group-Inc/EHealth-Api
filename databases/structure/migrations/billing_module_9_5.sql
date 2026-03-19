-- *********************************************************************
-- MODULE 9.5: QUẢN LÝ HÓA ĐƠN & CHỨNG TỪ THANH TOÁN
-- (E-Invoice, VAT Invoice, Document Management)
-- *********************************************************************

-- =====================================================================
-- 1. Bảng mới: e_invoice_config — Cấu hình phát hành HĐĐT theo cơ sở
-- =====================================================================
CREATE TABLE IF NOT EXISTS e_invoice_config (
    config_id              VARCHAR(50) PRIMARY KEY,
    facility_id            VARCHAR(50) NOT NULL,
    seller_name            VARCHAR(255) NOT NULL,
    seller_tax_code        VARCHAR(20) NOT NULL,
    seller_address         TEXT,
    seller_phone           VARCHAR(20),
    seller_bank_account    VARCHAR(50),
    seller_bank_name       VARCHAR(100),
    invoice_template       VARCHAR(20) DEFAULT '1C24TAA',    -- Ký hiệu mẫu số
    invoice_series         VARCHAR(20) DEFAULT 'C24TAA',     -- Ký hiệu hóa đơn
    current_number         INT DEFAULT 0,                     -- Số HĐ hiện tại (auto-increment)
    tax_rate_default       DECIMAL(5,2) DEFAULT 0,            -- Thuế suất mặc định: 0, 5, 8, 10
    currency_default       VARCHAR(10) DEFAULT 'VND',
    is_active              BOOLEAN DEFAULT TRUE,
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    UNIQUE(facility_id)
);

-- =====================================================================
-- 2. Bảng mới: e_invoices — Hóa đơn điện tử chính thức
-- =====================================================================
CREATE TABLE IF NOT EXISTS e_invoices (
    e_invoice_id           VARCHAR(50) PRIMARY KEY,
    e_invoice_number       VARCHAR(20) NOT NULL,              -- Số HĐĐT liên tục: 00000001
    invoice_template       VARCHAR(20) NOT NULL,              -- Ký hiệu mẫu: 1C24TAA
    invoice_series         VARCHAR(20) NOT NULL,              -- Ký hiệu HĐ: C24TAA
    lookup_code            VARCHAR(50),                       -- Mã tra cứu CQT
    invoice_id             VARCHAR(50),                       -- Liên kết HĐ nội bộ (Module 9.2)
    payment_transaction_id VARCHAR(50),                       -- Giao dịch thanh toán
    invoice_type           VARCHAR(20) DEFAULT 'SALES',       -- SALES | VAT
    -- Bên bán (snapshot)
    seller_name            VARCHAR(255) NOT NULL,
    seller_tax_code        VARCHAR(20) NOT NULL,
    seller_address         TEXT,
    seller_phone           VARCHAR(20),
    seller_bank_account    VARCHAR(50),
    seller_bank_name       VARCHAR(100),
    -- Bên mua (snapshot)
    buyer_name             VARCHAR(255),
    buyer_tax_code         VARCHAR(20),
    buyer_address          TEXT,
    buyer_email            VARCHAR(255),
    buyer_type             VARCHAR(20) DEFAULT 'INDIVIDUAL',  -- INDIVIDUAL | COMPANY
    -- Tài chính
    total_before_tax       DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate               DECIMAL(5,2) DEFAULT 0,
    tax_amount             DECIMAL(12,2) DEFAULT 0,
    total_after_tax        DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount        DECIMAL(12,2) DEFAULT 0,
    payment_method_text    VARCHAR(100),                       -- "Tiền mặt", "Chuyển khoản"...
    amount_in_words        TEXT,                               -- Số tiền bằng chữ
    -- Trạng thái & ký số
    status                 VARCHAR(20) DEFAULT 'DRAFT',        -- DRAFT|ISSUED|SIGNED|SENT|CANCELLED|REPLACED|ADJUSTED
    signed_at              TIMESTAMPTZ,
    signed_by              VARCHAR(50),
    cancelled_at           TIMESTAMPTZ,
    cancelled_by           VARCHAR(50),
    cancel_reason          TEXT,
    replaced_by_id         VARCHAR(50),                        -- HĐĐT thay thế
    adjustment_for_id      VARCHAR(50),                        -- HĐĐT gốc (nếu là HĐ điều chỉnh)
    adjustment_type        VARCHAR(20),                        -- INCREASE | DECREASE
    -- Metadata
    notes                  TEXT,
    currency               VARCHAR(10) DEFAULT 'VND',
    facility_id            VARCHAR(50),
    branch_id              VARCHAR(50),
    issued_at              TIMESTAMPTZ,
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id) ON DELETE SET NULL,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(payment_transactions_id) ON DELETE SET NULL,
    FOREIGN KEY (signed_by) REFERENCES users(users_id),
    FOREIGN KEY (cancelled_by) REFERENCES users(users_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_einvoice_number ON e_invoices(e_invoice_number);
CREATE INDEX IF NOT EXISTS idx_einvoice_lookup ON e_invoices(lookup_code);
CREATE INDEX IF NOT EXISTS idx_einvoice_invoice ON e_invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_status ON e_invoices(status);
CREATE INDEX IF NOT EXISTS idx_einvoice_type ON e_invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_einvoice_facility ON e_invoices(facility_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_created ON e_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_einvoice_buyer_tax ON e_invoices(buyer_tax_code) WHERE buyer_tax_code IS NOT NULL;

-- =====================================================================
-- 3. Bảng mới: e_invoice_items — Chi tiết dòng hàng trên HĐĐT
-- =====================================================================
CREATE TABLE IF NOT EXISTS e_invoice_items (
    item_id                VARCHAR(50) PRIMARY KEY,
    e_invoice_id           VARCHAR(50) NOT NULL,
    line_number            INT NOT NULL,                       -- STT dòng: 1, 2, 3...
    item_name              VARCHAR(255) NOT NULL,
    unit                   VARCHAR(50),                        -- "Lần", "Viên", "Hộp"...
    quantity               INT NOT NULL DEFAULT 1,
    unit_price             DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount        DECIMAL(12,2) DEFAULT 0,
    amount_before_tax      DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate               DECIMAL(5,2) DEFAULT 0,
    tax_amount             DECIMAL(12,2) DEFAULT 0,
    amount_after_tax       DECIMAL(12,2) NOT NULL DEFAULT 0,
    reference_type         VARCHAR(50),                        -- CONSULTATION | LAB_ORDER | DRUG
    reference_id           VARCHAR(50),
    notes                  TEXT,
    FOREIGN KEY (e_invoice_id) REFERENCES e_invoices(e_invoice_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_einvoice_items_einv ON e_invoice_items(e_invoice_id);

-- =====================================================================
-- 4. Bảng mới: billing_documents — Lưu trữ chứng từ thanh toán
-- =====================================================================
CREATE TABLE IF NOT EXISTS billing_documents (
    document_id            VARCHAR(50) PRIMARY KEY,
    document_code          VARCHAR(100) UNIQUE NOT NULL,       -- DOC-YYYYMMDD-XXXX
    document_type          VARCHAR(30) NOT NULL,               -- E_INVOICE_PDF|RECEIPT_SCAN|VAT_PAPER|BANK_SLIP|REFUND_PROOF|OTHER
    document_name          VARCHAR(255) NOT NULL,
    file_url               TEXT NOT NULL,
    file_size              INT,                                -- bytes
    mime_type              VARCHAR(100),
    -- Liên kết
    invoice_id             VARCHAR(50),
    e_invoice_id           VARCHAR(50),
    payment_transaction_id VARCHAR(50),
    -- Metadata
    description            TEXT,
    tags                   JSONB DEFAULT '[]',                  -- ["scan", "vat", "urgent"]
    uploaded_by            VARCHAR(50),
    upload_source          VARCHAR(20) DEFAULT 'MANUAL',       -- MANUAL | AUTO_GENERATED
    is_archived            BOOLEAN DEFAULT FALSE,
    archived_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id) ON DELETE SET NULL,
    FOREIGN KEY (e_invoice_id) REFERENCES e_invoices(e_invoice_id) ON DELETE SET NULL,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(payment_transactions_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_doc_invoice ON billing_documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_doc_einvoice ON billing_documents(e_invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_doc_txn ON billing_documents(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_billing_doc_type ON billing_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_billing_doc_archived ON billing_documents(is_archived) WHERE is_archived = FALSE;

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_EINVOICE_VIEW',      'BILLING_EINVOICE_VIEW',      'BILLING', 'Xem hóa đơn điện tử'),
('PERM_BILLING_EINVOICE_CREATE',    'BILLING_EINVOICE_CREATE',    'BILLING', 'Tạo hóa đơn điện tử (DRAFT → ISSUED)'),
('PERM_BILLING_EINVOICE_SIGN',      'BILLING_EINVOICE_SIGN',      'BILLING', 'Ký số hóa đơn điện tử'),
('PERM_BILLING_EINVOICE_CANCEL',    'BILLING_EINVOICE_CANCEL',    'BILLING', 'Hủy / thay thế / điều chỉnh HĐĐT'),
('PERM_BILLING_EINVOICE_CONFIG',    'BILLING_EINVOICE_CONFIG',    'BILLING', 'Cấu hình phát hành HĐĐT theo cơ sở'),
('PERM_BILLING_DOCUMENT_MANAGE',    'BILLING_DOCUMENT_MANAGE',    'BILLING', 'Upload & quản lý chứng từ thanh toán'),
('PERM_BILLING_DOCUMENT_VIEW',      'BILLING_DOCUMENT_VIEW',      'BILLING', 'Xem & tải chứng từ thanh toán')
ON CONFLICT DO NOTHING;

-- *********************************************************************
-- ROLE → JWT PERMISSIONS
-- *********************************************************************

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'BILLING_EINVOICE_VIEW','BILLING_EINVOICE_CREATE','BILLING_EINVOICE_SIGN',
    'BILLING_EINVOICE_CANCEL','BILLING_EINVOICE_CONFIG',
    'BILLING_DOCUMENT_MANAGE','BILLING_DOCUMENT_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: tạo + xem HĐĐT, upload chứng từ (không ký số, không hủy, không config)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'BILLING_EINVOICE_VIEW','BILLING_EINVOICE_CREATE',
    'BILLING_DOCUMENT_MANAGE','BILLING_DOCUMENT_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR, NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('DOCTOR','NURSE') AND p.code IN (
    'BILLING_EINVOICE_VIEW','BILLING_DOCUMENT_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Hóa đơn điện tử
('API_BIL_DOC_EINV_CREATE',       'BILLING', 'POST',  '/api/billing/documents/e-invoices',                          'Tạo HĐĐT từ HĐ nội bộ'),
('API_BIL_DOC_EINV_VAT',          'BILLING', 'POST',  '/api/billing/documents/e-invoices/vat',                      'Tạo HĐ VAT'),
('API_BIL_DOC_EINV_ISSUE',        'BILLING', 'PATCH', '/api/billing/documents/e-invoices/:id/issue',                'Phát hành HĐĐT'),
('API_BIL_DOC_EINV_SIGN',         'BILLING', 'PATCH', '/api/billing/documents/e-invoices/:id/sign',                 'Ký số HĐĐT'),
('API_BIL_DOC_EINV_SEND',         'BILLING', 'PATCH', '/api/billing/documents/e-invoices/:id/send',                 'Gửi HĐĐT cho bên mua'),
('API_BIL_DOC_EINV_CANCEL',       'BILLING', 'POST',  '/api/billing/documents/e-invoices/:id/cancel',               'Hủy HĐĐT'),
('API_BIL_DOC_EINV_REPLACE',      'BILLING', 'POST',  '/api/billing/documents/e-invoices/:id/replace',              'Thay thế HĐĐT'),
('API_BIL_DOC_EINV_ADJUST',       'BILLING', 'POST',  '/api/billing/documents/e-invoices/:id/adjust',               'Điều chỉnh HĐĐT'),
('API_BIL_DOC_EINV_DETAIL',       'BILLING', 'GET',   '/api/billing/documents/e-invoices/:id',                      'Chi tiết HĐĐT'),
('API_BIL_DOC_EINV_LIST',         'BILLING', 'GET',   '/api/billing/documents/e-invoices',                          'Danh sách HĐĐT'),
('API_BIL_DOC_EINV_LOOKUP',       'BILLING', 'GET',   '/api/billing/documents/e-invoices/lookup/:code',             'Tra cứu HĐĐT theo mã CQT'),

-- Nhóm 2: In hóa đơn
('API_BIL_DOC_PRINT',             'BILLING', 'GET',   '/api/billing/documents/e-invoices/:id/print-data',           'Dữ liệu in HĐĐT'),
('API_BIL_DOC_PRINT_HIST',        'BILLING', 'GET',   '/api/billing/documents/e-invoices/:id/print-history',        'Lịch sử in HĐĐT'),

-- Nhóm 3: Tra cứu
('API_BIL_DOC_SEARCH',            'BILLING', 'GET',   '/api/billing/documents/search',                              'Tìm kiếm hóa đơn nâng cao'),
('API_BIL_DOC_TIMELINE',          'BILLING', 'GET',   '/api/billing/documents/invoices/:invoiceId/timeline',        'Dòng thời gian hóa đơn'),

-- Nhóm 4: Chứng từ
('API_BIL_DOC_ATTACH_UPLOAD',     'BILLING', 'POST',  '/api/billing/documents/attachments',                         'Upload chứng từ'),
('API_BIL_DOC_ATTACH_LIST',       'BILLING', 'GET',   '/api/billing/documents/attachments',                         'Danh sách chứng từ'),
('API_BIL_DOC_ATTACH_DETAIL',     'BILLING', 'GET',   '/api/billing/documents/attachments/:id',                     'Chi tiết chứng từ'),
('API_BIL_DOC_ATTACH_DELETE',     'BILLING', 'DELETE','/api/billing/documents/attachments/:id',                     'Xóa chứng từ'),
('API_BIL_DOC_ATTACH_ARCHIVE',    'BILLING', 'PATCH', '/api/billing/documents/attachments/archive',                 'Lưu trữ chứng từ hàng loạt'),

-- Nhóm 5: Cấu hình HĐĐT
('API_BIL_DOC_CONFIG_GET',        'BILLING', 'GET',   '/api/billing/documents/config/:facilityId',                  'Lấy cấu hình HĐĐT'),
('API_BIL_DOC_CONFIG_UPSERT',     'BILLING', 'PUT',   '/api/billing/documents/config/:facilityId',                  'Tạo/cập nhật cấu hình HĐĐT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- *********************************************************************
-- ROLE → API PERMISSIONS
-- *********************************************************************

-- ADMIN: full 22 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_BIL_DOC_EINV_CREATE','API_BIL_DOC_EINV_VAT','API_BIL_DOC_EINV_ISSUE',
    'API_BIL_DOC_EINV_SIGN','API_BIL_DOC_EINV_SEND',
    'API_BIL_DOC_EINV_CANCEL','API_BIL_DOC_EINV_REPLACE','API_BIL_DOC_EINV_ADJUST',
    'API_BIL_DOC_EINV_DETAIL','API_BIL_DOC_EINV_LIST','API_BIL_DOC_EINV_LOOKUP',
    'API_BIL_DOC_PRINT','API_BIL_DOC_PRINT_HIST',
    'API_BIL_DOC_SEARCH','API_BIL_DOC_TIMELINE',
    'API_BIL_DOC_ATTACH_UPLOAD','API_BIL_DOC_ATTACH_LIST','API_BIL_DOC_ATTACH_DETAIL',
    'API_BIL_DOC_ATTACH_DELETE','API_BIL_DOC_ATTACH_ARCHIVE',
    'API_BIL_DOC_CONFIG_GET','API_BIL_DOC_CONFIG_UPSERT'
) ON CONFLICT DO NOTHING;

-- STAFF: tạo + xem + in + upload (không sign, cancel, config)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_BIL_DOC_EINV_CREATE','API_BIL_DOC_EINV_VAT','API_BIL_DOC_EINV_ISSUE',
    'API_BIL_DOC_EINV_SEND',
    'API_BIL_DOC_EINV_DETAIL','API_BIL_DOC_EINV_LIST','API_BIL_DOC_EINV_LOOKUP',
    'API_BIL_DOC_PRINT','API_BIL_DOC_PRINT_HIST',
    'API_BIL_DOC_SEARCH','API_BIL_DOC_TIMELINE',
    'API_BIL_DOC_ATTACH_UPLOAD','API_BIL_DOC_ATTACH_LIST','API_BIL_DOC_ATTACH_DETAIL'
) ON CONFLICT DO NOTHING;

-- DOCTOR, NURSE: chỉ xem HĐĐT + chứng từ
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR','NURSE') AND a.api_id IN (
    'API_BIL_DOC_EINV_DETAIL','API_BIL_DOC_EINV_LIST','API_BIL_DOC_EINV_LOOKUP',
    'API_BIL_DOC_ATTACH_LIST','API_BIL_DOC_ATTACH_DETAIL'
) ON CONFLICT DO NOTHING;
