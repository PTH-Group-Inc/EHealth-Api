-- =====================================================================
-- WAREHOUSE MANAGEMENT — Quản lý kho thuốc theo cơ sở
-- =====================================================================

-- 1. Bảng warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id     VARCHAR(50) PRIMARY KEY,
    branch_id        VARCHAR(50) NOT NULL,
    code             VARCHAR(50) NOT NULL,
    name             VARCHAR(100) NOT NULL,
    warehouse_type   VARCHAR(20) DEFAULT 'MAIN',  -- MAIN | SECONDARY
    address          TEXT,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    UNIQUE(branch_id, code)
);

-- 2. Gắn pharmacy_inventory vào kho
ALTER TABLE pharmacy_inventory
    ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(50) REFERENCES warehouses(warehouse_id);

-- Index tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_warehouses_branch ON warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_warehouse ON pharmacy_inventory(warehouse_id);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_WAREHOUSE_VIEW',   'WAREHOUSE_VIEW',   'PHARMACY', 'Xem danh sách và chi tiết kho thuốc'),
('PERM_WAREHOUSE_MANAGE', 'WAREHOUSE_MANAGE', 'PHARMACY', 'Tạo, sửa, bật/tắt kho thuốc')
ON CONFLICT DO NOTHING;

-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('WAREHOUSE_VIEW','WAREHOUSE_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('WAREHOUSE_VIEW','WAREHOUSE_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code = 'WAREHOUSE_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code = 'WAREHOUSE_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_WH_LIST',     'PHARMACY', 'GET',   '/api/warehouses',              'Danh sách kho'),
('API_WH_DETAIL',   'PHARMACY', 'GET',   '/api/warehouses/:id',          'Chi tiết kho'),
('API_WH_CREATE',   'PHARMACY', 'POST',  '/api/warehouses',              'Tạo kho mới'),
('API_WH_UPDATE',   'PHARMACY', 'PATCH', '/api/warehouses/:id',          'Cập nhật kho'),
('API_WH_TOGGLE',   'PHARMACY', 'PATCH', '/api/warehouses/:id/toggle',   'Bật/tắt kho')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN ('API_WH_LIST','API_WH_DETAIL','API_WH_CREATE','API_WH_UPDATE','API_WH_TOGGLE')
ON CONFLICT DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN ('API_WH_LIST','API_WH_DETAIL','API_WH_CREATE','API_WH_UPDATE','API_WH_TOGGLE')
ON CONFLICT DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN ('API_WH_LIST','API_WH_DETAIL')
ON CONFLICT DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN ('API_WH_LIST','API_WH_DETAIL')
ON CONFLICT DO NOTHING;
