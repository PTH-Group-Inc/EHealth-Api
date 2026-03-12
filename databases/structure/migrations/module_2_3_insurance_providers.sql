-- =========================================================================
-- MODULE 2.3: QUẢN LÝ BẢO HIỂM & THANH TOÁN (INSURANCE & BILLING)
-- =========================================================================

-- ==============================================================================
-- 1. TẠO BẢNG insurance_providers (Đơn vị Bảo hiểm)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS insurance_providers (
    insurance_providers_id VARCHAR(50) PRIMARY KEY,
    provider_code VARCHAR(50) UNIQUE NOT NULL, -- VD: BHYT, PVI, BAOVIET
    provider_name VARCHAR(255) NOT NULL,
    insurance_type VARCHAR(50) NOT NULL, -- STATE (BHYT), PRIVATE (BH Tư nhân)
    contact_phone VARCHAR(50), 
    contact_email VARCHAR(100),
    address TEXT,
    support_notes TEXT, -- Ghi chú thủ tục thanh toán
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. CHUYỂN ĐỔI BẢNG patient_insurances (provider_name → provider_id FK)
-- ==============================================================================

ALTER TABLE patient_insurances
DROP COLUMN IF EXISTS provider_name;

ALTER TABLE patient_insurances
ADD COLUMN provider_id VARCHAR(50) REFERENCES insurance_providers(insurance_providers_id);

-- ==============================================================================
-- 3. API PERMISSIONS - Đăng ký API Endpoints
-- ==============================================================================

-- 3.1 Insurance Providers APIs
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_INS_PRV_LIST',    'INSURANCE', 'GET',    '/api/insurance-providers',     'Lấy danh sách đơn vị bảo hiểm'),
('API_INS_PRV_DETAIL',  'INSURANCE', 'GET',    '/api/insurance-providers/:id', 'Xem chi tiết đơn vị bảo hiểm'),
('API_INS_PRV_CREATE',  'INSURANCE', 'POST',   '/api/insurance-providers',     'Tạo mới đơn vị bảo hiểm'),
('API_INS_PRV_UPDATE',  'INSURANCE', 'PUT',    '/api/insurance-providers/:id', 'Cập nhật đơn vị bảo hiểm'),
('API_INS_PRV_DISABLE', 'INSURANCE', 'DELETE', '/api/insurance-providers/:id', 'Vô hiệu hóa đơn vị bảo hiểm')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 3.2 Patient Insurances APIs
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PAT_INS_LIST',    'INSURANCE', 'GET',    '/api/patient-insurances',     'Lấy danh sách thẻ bảo hiểm bệnh nhân'),
('API_PAT_INS_DETAIL',  'INSURANCE', 'GET',    '/api/patient-insurances/:id', 'Xem chi tiết thẻ bảo hiểm'),
('API_PAT_INS_CREATE',  'INSURANCE', 'POST',   '/api/patient-insurances',     'Thêm thẻ bảo hiểm cho bệnh nhân'),
('API_PAT_INS_UPDATE',  'INSURANCE', 'PUT',    '/api/patient-insurances/:id', 'Cập nhật thẻ bảo hiểm'),
('API_PAT_INS_DELETE',  'INSURANCE', 'DELETE', '/api/patient-insurances/:id', 'Xóa thẻ bảo hiểm')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 4. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền trên cả 2 module
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_INS_PRV_LIST', 'API_INS_PRV_DETAIL', 'API_INS_PRV_CREATE', 'API_INS_PRV_UPDATE', 'API_INS_PRV_DISABLE',
    'API_PAT_INS_LIST', 'API_PAT_INS_DETAIL', 'API_PAT_INS_CREATE', 'API_PAT_INS_UPDATE', 'API_PAT_INS_DELETE'
  )
ON CONFLICT DO NOTHING;

-- STAFF: toàn quyền (trừ vô hiệu hóa đơn vị BH)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN (
    'API_INS_PRV_LIST', 'API_INS_PRV_DETAIL', 'API_INS_PRV_CREATE', 'API_INS_PRV_UPDATE',
    'API_PAT_INS_LIST', 'API_PAT_INS_DETAIL', 'API_PAT_INS_CREATE', 'API_PAT_INS_UPDATE', 'API_PAT_INS_DELETE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: chỉ xem danh sách, chi tiết
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_INS_PRV_LIST', 'API_INS_PRV_DETAIL',
    'API_PAT_INS_LIST', 'API_PAT_INS_DETAIL'
  )
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. JWT PERMISSIONS - Đăng ký quyền cho middleware authorizePermissions
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_INS_VIEW',   'INSURANCE_VIEW',   'INSURANCE', 'Xem danh sách và chi tiết đơn vị bảo hiểm'),
    ('PERM_INS_CREATE', 'INSURANCE_CREATE', 'INSURANCE', 'Tạo mới đơn vị bảo hiểm'),
    ('PERM_INS_UPDATE', 'INSURANCE_UPDATE', 'INSURANCE', 'Cập nhật thông tin đơn vị bảo hiểm'),
    ('PERM_INS_DELETE', 'INSURANCE_DELETE', 'INSURANCE', 'Vô hiệu hóa đơn vị bảo hiểm')
ON CONFLICT (code) DO NOTHING;

-- Lưu ý: Thẻ bảo hiểm bệnh nhân sử dụng chung quyền PATIENT_VIEW và PATIENT_UPDATE
-- đã được tạo ở module 2.1 (module_2_1_patients.sql)

-- ==============================================================================
-- 6. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền Insurance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('INSURANCE_VIEW', 'INSURANCE_CREATE', 'INSURANCE_UPDATE', 'INSURANCE_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: xem, tạo, sửa (không xóa/disable)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('INSURANCE_VIEW', 'INSURANCE_CREATE', 'INSURANCE_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR & NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND p.code IN ('INSURANCE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

