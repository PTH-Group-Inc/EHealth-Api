-- =====================================================================
-- MODULE 5.5: CẤP PHÁT THUỐC & XUẤT KHO (DISPENSING MANAGEMENT)
-- Bổ sung cột cho drug_dispense_orders + Permissions
-- =====================================================================

-- 1. Bổ sung cột cho drug_dispense_orders
ALTER TABLE drug_dispense_orders
    ADD COLUMN IF NOT EXISTS dispense_code VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- 2. Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_dispense_orders_pharmacist ON drug_dispense_orders(pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_dispense_orders_status ON drug_dispense_orders(status);
CREATE INDEX IF NOT EXISTS idx_dispense_orders_dispensed_at ON drug_dispense_orders(dispensed_at);
CREATE INDEX IF NOT EXISTS idx_dispense_details_order ON drug_dispense_details(dispense_order_id);

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_DISPENSING_CREATE', 'DISPENSING_CREATE', 'PHARMACY', 'Tạo phiếu cấp phát thuốc, hủy phiếu'),
('PERM_DISPENSING_VIEW',   'DISPENSING_VIEW',   'PHARMACY', 'Xem phiếu cấp phát, tồn kho, lịch sử')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('DISPENSING_CREATE','DISPENSING_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACIST: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PHARMACIST' AND p.code IN ('DISPENSING_CREATE','DISPENSING_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('DISPENSING_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('DISPENSING_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_DISP_CREATE',       'PHARMACY', 'POST',  '/api/dispensing/:prescriptionId',               'Tạo phiếu cấp phát thuốc'),
('API_DISP_GET',          'PHARMACY', 'GET',   '/api/dispensing/:prescriptionId',               'Xem phiếu cấp phát theo đơn thuốc'),
('API_DISP_HISTORY',      'PHARMACY', 'GET',   '/api/dispensing/history',                       'Lịch sử cấp phát (phân trang)'),
('API_DISP_INVENTORY',    'PHARMACY', 'GET',   '/api/dispensing/inventory/:drugId',             'Xem tồn kho theo thuốc'),
('API_DISP_CHECK_STOCK',  'PHARMACY', 'GET',   '/api/dispensing/inventory/:drugId/check',       'Kiểm tra tồn kho đủ'),
('API_DISP_BY_PHARM',     'PHARMACY', 'GET',   '/api/dispensing/by-pharmacist/:pharmacistId',   'Lịch sử cấp phát theo dược sĩ'),
('API_DISP_CANCEL',       'PHARMACY', 'POST',  '/api/dispensing/:dispenseOrderId/cancel',       'Hủy phiếu cấp phát + hoàn kho')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_DISP_CREATE','API_DISP_GET','API_DISP_HISTORY',
    'API_DISP_INVENTORY','API_DISP_CHECK_STOCK','API_DISP_BY_PHARM','API_DISP_CANCEL'
) ON CONFLICT DO NOTHING;

-- PHARMACIST: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PHARMACIST' AND a.api_id IN (
    'API_DISP_CREATE','API_DISP_GET','API_DISP_HISTORY',
    'API_DISP_INVENTORY','API_DISP_CHECK_STOCK','API_DISP_BY_PHARM','API_DISP_CANCEL'
) ON CONFLICT DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_DISP_GET','API_DISP_HISTORY','API_DISP_INVENTORY','API_DISP_CHECK_STOCK'
) ON CONFLICT DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN (
    'API_DISP_GET','API_DISP_HISTORY','API_DISP_INVENTORY','API_DISP_CHECK_STOCK'
) ON CONFLICT DO NOTHING;
