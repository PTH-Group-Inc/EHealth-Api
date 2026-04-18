-- =====================================================================
-- MODULE 5.9: XUẤT KHO & HỦY HÀNG (STOCK-OUT MANAGEMENT)
-- =====================================================================

-- 1. Phiếu xuất kho
CREATE TABLE IF NOT EXISTS stock_out_orders (
    stock_out_order_id   VARCHAR(50) PRIMARY KEY,
    order_code           VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id         VARCHAR(50) NOT NULL,
    reason_type          VARCHAR(30) NOT NULL,
    supplier_id          VARCHAR(50),
    dest_warehouse_id    VARCHAR(50),
    created_by           VARCHAR(50) NOT NULL,
    status               VARCHAR(20) DEFAULT 'DRAFT',
    notes                TEXT,
    total_quantity       INT DEFAULT 0,
    confirmed_at         TIMESTAMPTZ,
    confirmed_by         VARCHAR(50),
    cancelled_at         TIMESTAMPTZ,
    cancelled_reason     TEXT,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (dest_warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    FOREIGN KEY (confirmed_by) REFERENCES users(users_id)
);

-- 2. Chi tiết xuất kho
CREATE TABLE IF NOT EXISTS stock_out_details (
    stock_out_detail_id  VARCHAR(50) PRIMARY KEY,
    stock_out_order_id   VARCHAR(50) NOT NULL,
    inventory_id         VARCHAR(50) NOT NULL,
    drug_id              VARCHAR(50) NOT NULL,
    batch_number         VARCHAR(100) NOT NULL,
    quantity             INT NOT NULL,
    reason_note          TEXT,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_out_order_id) REFERENCES stock_out_orders(stock_out_order_id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES pharmacy_inventory(pharmacy_inventory_id),
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_out_orders_warehouse ON stock_out_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_orders_status ON stock_out_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_out_orders_reason ON stock_out_orders(reason_type);
CREATE INDEX IF NOT EXISTS idx_stock_out_details_order ON stock_out_details(stock_out_order_id);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_STOCK_OUT_VIEW',   'STOCK_OUT_VIEW',   'PHARMACY', 'Xem phiếu xuất kho, lịch sử xuất kho'),
('PERM_STOCK_OUT_MANAGE', 'STOCK_OUT_MANAGE', 'PHARMACY', 'Tạo/xác nhận/hủy phiếu xuất kho')
ON CONFLICT DO NOTHING;

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('STOCK_OUT_VIEW','STOCK_OUT_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('STOCK_OUT_VIEW','STOCK_OUT_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_SOO_LIST',       'PHARMACY', 'GET',    '/api/stock-out',                            'Lịch sử xuất kho'),
('API_SOO_DETAIL',     'PHARMACY', 'GET',    '/api/stock-out/:orderId',                   'Chi tiết phiếu xuất'),
('API_SOO_CREATE',     'PHARMACY', 'POST',   '/api/stock-out',                            'Tạo phiếu xuất'),
('API_SOO_ADD_ITEM',   'PHARMACY', 'POST',   '/api/stock-out/:orderId/items',             'Thêm dòng thuốc'),
('API_SOO_DEL_ITEM',   'PHARMACY', 'DELETE', '/api/stock-out/:orderId/items/:detailId',   'Xóa dòng thuốc'),
('API_SOO_CONFIRM',    'PHARMACY', 'PATCH',  '/api/stock-out/:orderId/confirm',            'Xác nhận + trừ kho'),
('API_SOO_CANCEL',     'PHARMACY', 'PATCH',  '/api/stock-out/:orderId/cancel',             'Hủy + hoàn kho')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_SOO_LIST','API_SOO_DETAIL','API_SOO_CREATE','API_SOO_ADD_ITEM','API_SOO_DEL_ITEM','API_SOO_CONFIRM','API_SOO_CANCEL'
) ON CONFLICT DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_SOO_LIST','API_SOO_DETAIL','API_SOO_CREATE','API_SOO_ADD_ITEM','API_SOO_DEL_ITEM','API_SOO_CONFIRM','API_SOO_CANCEL'
) ON CONFLICT DO NOTHING;
