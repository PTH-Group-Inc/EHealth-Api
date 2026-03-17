-- =====================================================================
-- MODULE 5.7: QUẢN LÝ NHẬP KHO & NHÀ CUNG CẤP (STOCK-IN MANAGEMENT)
-- =====================================================================

-- 1. Bảng nhà cung cấp
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id      VARCHAR(50) PRIMARY KEY,
    code             VARCHAR(50) UNIQUE NOT NULL,
    name             VARCHAR(255) NOT NULL,
    contact_person   VARCHAR(100),
    phone            VARCHAR(20),
    email            VARCHAR(100),
    address          TEXT,
    tax_code         VARCHAR(50),
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Phiếu nhập kho
CREATE TABLE IF NOT EXISTS stock_in_orders (
    stock_in_order_id  VARCHAR(50) PRIMARY KEY,
    order_code         VARCHAR(50) UNIQUE NOT NULL,
    supplier_id        VARCHAR(50) NOT NULL,
    warehouse_id       VARCHAR(50) NOT NULL,
    created_by         VARCHAR(50) NOT NULL,
    status             VARCHAR(20) DEFAULT 'DRAFT',
    notes              TEXT,
    total_amount       DECIMAL(15,2) DEFAULT 0,
    received_at        TIMESTAMPTZ,
    received_by        VARCHAR(50),
    cancelled_at       TIMESTAMPTZ,
    cancelled_reason   TEXT,
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    FOREIGN KEY (received_by) REFERENCES users(users_id)
);

-- 3. Chi tiết phiếu nhập
CREATE TABLE IF NOT EXISTS stock_in_details (
    stock_in_detail_id  VARCHAR(50) PRIMARY KEY,
    stock_in_order_id   VARCHAR(50) NOT NULL,
    drug_id             VARCHAR(50) NOT NULL,
    batch_number        VARCHAR(100) NOT NULL,
    expiry_date         DATE NOT NULL,
    quantity            INT NOT NULL,
    unit_cost           DECIMAL(12,2) NOT NULL,
    unit_price          DECIMAL(12,2),
    amount              DECIMAL(15,2),
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_in_order_id) REFERENCES stock_in_orders(stock_in_order_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_in_orders_supplier ON stock_in_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_orders_warehouse ON stock_in_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_orders_status ON stock_in_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_in_details_order ON stock_in_details(stock_in_order_id);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_STOCK_IN_VIEW',   'STOCK_IN_VIEW',   'PHARMACY', 'Xem phiếu nhập kho, nhà cung cấp'),
('PERM_STOCK_IN_MANAGE', 'STOCK_IN_MANAGE', 'PHARMACY', 'Tạo/xác nhận/nhận hàng/hủy phiếu nhập kho, quản lý NCC')
ON CONFLICT DO NOTHING;

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('STOCK_IN_VIEW','STOCK_IN_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('STOCK_IN_VIEW','STOCK_IN_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_SUPP_LIST',       'PHARMACY', 'GET',   '/api/suppliers',                        'Danh sách NCC'),
('API_SUPP_DETAIL',     'PHARMACY', 'GET',   '/api/suppliers/:id',                    'Chi tiết NCC'),
('API_SUPP_CREATE',     'PHARMACY', 'POST',  '/api/suppliers',                        'Tạo NCC'),
('API_SUPP_UPDATE',     'PHARMACY', 'PATCH', '/api/suppliers/:id',                    'Cập nhật NCC'),
('API_SIO_LIST',        'PHARMACY', 'GET',   '/api/stock-in',                         'Lịch sử nhập kho'),
('API_SIO_DETAIL',      'PHARMACY', 'GET',   '/api/stock-in/:orderId',                'Chi tiết phiếu nhập'),
('API_SIO_CREATE',      'PHARMACY', 'POST',  '/api/stock-in',                         'Tạo phiếu nhập'),
('API_SIO_ADD_ITEM',    'PHARMACY', 'POST',  '/api/stock-in/:orderId/items',           'Thêm dòng thuốc'),
('API_SIO_CONFIRM',     'PHARMACY', 'PATCH', '/api/stock-in/:orderId/confirm',         'Xác nhận phiếu'),
('API_SIO_RECEIVE',     'PHARMACY', 'PATCH', '/api/stock-in/:orderId/receive',         'Nhận hàng'),
('API_SIO_CANCEL',      'PHARMACY', 'PATCH', '/api/stock-in/:orderId/cancel',          'Hủy phiếu')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_SUPP_LIST','API_SUPP_DETAIL','API_SUPP_CREATE','API_SUPP_UPDATE',
    'API_SIO_LIST','API_SIO_DETAIL','API_SIO_CREATE','API_SIO_ADD_ITEM','API_SIO_CONFIRM','API_SIO_RECEIVE','API_SIO_CANCEL'
) ON CONFLICT DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_SUPP_LIST','API_SUPP_DETAIL','API_SUPP_CREATE','API_SUPP_UPDATE',
    'API_SIO_LIST','API_SIO_DETAIL','API_SIO_CREATE','API_SIO_ADD_ITEM','API_SIO_CONFIRM','API_SIO_RECEIVE','API_SIO_CANCEL'
) ON CONFLICT DO NOTHING;
