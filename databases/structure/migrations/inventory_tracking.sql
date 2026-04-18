-- =====================================================================
-- MODULE 5.6: THEO DÕI TỒN KHO THUỐC (DRUG INVENTORY TRACKING)
-- =====================================================================

-- 1. Bổ sung cột ngưỡng cảnh báo tồn kho thấp
ALTER TABLE pharmacy_inventory
    ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 50;

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_INVENTORY_VIEW',   'INVENTORY_VIEW',   'PHARMACY', 'Xem tồn kho thuốc, dashboard cảnh báo'),
('PERM_INVENTORY_MANAGE', 'INVENTORY_MANAGE', 'PHARMACY', 'Nhập kho, cập nhật số lượng tồn kho')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS
-- ==============================================================================
-- ADMIN: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('INVENTORY_VIEW','INVENTORY_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('INVENTORY_VIEW','INVENTORY_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code = 'INVENTORY_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code = 'INVENTORY_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_INV_LIST',       'PHARMACY', 'GET',   '/api/inventory',                    'Danh sách tồn kho'),
('API_INV_DETAIL',     'PHARMACY', 'GET',   '/api/inventory/:batchId',           'Chi tiết 1 lô'),
('API_INV_EXPIRING',   'PHARMACY', 'GET',   '/api/inventory/alerts/expiring',    'Cảnh báo sắp hết hạn'),
('API_INV_LOW_STOCK',  'PHARMACY', 'GET',   '/api/inventory/alerts/low-stock',   'Cảnh báo tồn kho thấp'),
('API_INV_CREATE',     'PHARMACY', 'POST',  '/api/inventory',                    'Nhập kho lô mới'),
('API_INV_UPDATE',     'PHARMACY', 'PATCH', '/api/inventory/:batchId',           'Cập nhật tồn kho')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================
-- ADMIN: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_INV_LIST','API_INV_DETAIL','API_INV_EXPIRING','API_INV_LOW_STOCK','API_INV_CREATE','API_INV_UPDATE'
) ON CONFLICT DO NOTHING;

-- PHARMACIST: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_INV_LIST','API_INV_DETAIL','API_INV_EXPIRING','API_INV_LOW_STOCK','API_INV_CREATE','API_INV_UPDATE'
) ON CONFLICT DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_INV_LIST','API_INV_DETAIL','API_INV_EXPIRING','API_INV_LOW_STOCK'
) ON CONFLICT DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_INV_LIST','API_INV_DETAIL','API_INV_EXPIRING','API_INV_LOW_STOCK'
) ON CONFLICT DO NOTHING;
