-- *********************************************************************
-- MODULE 9.1: QUẢN LÝ DANH MỤC DỊCH VỤ & BẢNG GIÁ
-- (Service Catalog & Pricing Management)
-- *********************************************************************

-- 1. Chính sách giá linh hoạt theo đối tượng bệnh nhân
-- Mỗi dịch vụ cơ sở có thể có NHIỀU chính sách giá cho các đối tượng khác nhau
CREATE TABLE IF NOT EXISTS service_price_policies (
    policy_id            VARCHAR(50) PRIMARY KEY,
    facility_service_id  VARCHAR(50) NOT NULL,
    patient_type         VARCHAR(50) NOT NULL,           -- STANDARD, INSURANCE, VIP, EMPLOYEE, CHILD, ELDERLY
    price                DECIMAL(12,2) NOT NULL,
    currency             VARCHAR(10) DEFAULT 'VND',
    description          TEXT,
    effective_from       DATE NOT NULL,
    effective_to         DATE,                           -- NULL = vô thời hạn
    is_active            BOOLEAN DEFAULT TRUE,
    created_by           VARCHAR(50) NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    UNIQUE(facility_service_id, patient_type, effective_from)
);

-- 2. Giá theo chuyên khoa
-- Cùng 1 dịch vụ cơ sở, chuyên khoa khác nhau có thể áp dụng giá khác nhau
CREATE TABLE IF NOT EXISTS facility_service_specialty_prices (
    specialty_price_id   VARCHAR(50) PRIMARY KEY,
    facility_service_id  VARCHAR(50) NOT NULL,
    specialty_id         VARCHAR(50) NOT NULL,
    patient_type         VARCHAR(50) DEFAULT 'STANDARD',
    price                DECIMAL(12,2) NOT NULL,
    effective_from       DATE NOT NULL,
    effective_to         DATE,
    is_active            BOOLEAN DEFAULT TRUE,
    created_by           VARCHAR(50) NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    UNIQUE(facility_service_id, specialty_id, patient_type, effective_from)
);

-- 3. Lịch sử thay đổi giá (Audit Trail)
CREATE TABLE IF NOT EXISTS service_price_history (
    history_id           VARCHAR(50) PRIMARY KEY,
    facility_service_id  VARCHAR(50) NOT NULL,
    change_type          VARCHAR(20) NOT NULL,            -- CREATE, UPDATE, DELETE
    change_source        VARCHAR(50) NOT NULL,            -- PRICE_POLICY, SPECIALTY_PRICE, FACILITY_SERVICE
    reference_id         VARCHAR(50) NOT NULL,            -- ID bản ghi bị thay đổi
    patient_type         VARCHAR(50),
    specialty_id         VARCHAR(50),
    old_price            DECIMAL(12,2),
    new_price            DECIMAL(12,2),
    old_effective_from   DATE,
    new_effective_from   DATE,
    old_effective_to     DATE,
    new_effective_to     DATE,
    reason               TEXT,
    changed_by           VARCHAR(50) NOT NULL,
    changed_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(users_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_spp_facility_service ON service_price_policies(facility_service_id);
CREATE INDEX IF NOT EXISTS idx_spp_patient_type ON service_price_policies(patient_type);
CREATE INDEX IF NOT EXISTS idx_spp_effective ON service_price_policies(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_spp_active ON service_price_policies(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_fssp_facility_service ON facility_service_specialty_prices(facility_service_id);
CREATE INDEX IF NOT EXISTS idx_fssp_specialty ON facility_service_specialty_prices(specialty_id);
CREATE INDEX IF NOT EXISTS idx_fssp_active ON facility_service_specialty_prices(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sph_facility_service ON service_price_history(facility_service_id);
CREATE INDEX IF NOT EXISTS idx_sph_changed_at ON service_price_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sph_change_source ON service_price_history(change_source);
CREATE INDEX IF NOT EXISTS idx_sph_change_type ON service_price_history(change_type);

-- *********************************************************************
-- JWT PERMISSIONS (Quyền cấp qua token)
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_BILLING_PRICING_VIEW',   'BILLING_PRICING_VIEW',   'BILLING', 'Xem danh mục dịch vụ, bảng giá, chính sách giá, lịch sử thay đổi giá'),
('PERM_BILLING_PRICING_CREATE', 'BILLING_PRICING_CREATE', 'BILLING', 'Tạo mới chính sách giá, giá chuyên khoa'),
('PERM_BILLING_PRICING_UPDATE', 'BILLING_PRICING_UPDATE', 'BILLING', 'Cập nhật chính sách giá, giá chuyên khoa'),
('PERM_BILLING_PRICING_DELETE', 'BILLING_PRICING_DELETE', 'BILLING', 'Vô hiệu hóa (soft delete) chính sách giá, giá chuyên khoa')
ON CONFLICT DO NOTHING;

-- *********************************************************************
-- ROLE → JWT PERMISSIONS
-- *********************************************************************

-- ADMIN, STAFF: full quyền CRUD
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('ADMIN','STAFF') AND p.code IN (
    'BILLING_PRICING_VIEW','BILLING_PRICING_CREATE','BILLING_PRICING_UPDATE','BILLING_PRICING_DELETE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR, NURSE, PHARMACIST: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('DOCTOR','NURSE','PHARMACIST') AND p.code = 'BILLING_PRICING_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS (Kiểm soát API theo vai trò)
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Danh mục & Bảng giá
('API_BPR_CATALOG',            'BILLING', 'GET',    '/api/billing/pricing/catalog',                          'Danh mục dịch vụ tổng hợp'),
('API_BPR_CATALOG_FACILITY',   'BILLING', 'GET',    '/api/billing/pricing/catalog/:facilityId',               'Bảng giá tổng hợp tại cơ sở'),

-- Nhóm 2: Chính sách giá
('API_BPR_POLICY_LIST',        'BILLING', 'GET',    '/api/billing/pricing/policies/:facilityServiceId',       'Xem chính sách giá dịch vụ cơ sở'),
('API_BPR_POLICY_CREATE',      'BILLING', 'POST',   '/api/billing/pricing/policies',                          'Tạo mới chính sách giá'),
('API_BPR_POLICY_BULK',        'BILLING', 'POST',   '/api/billing/pricing/policies/bulk',                     'Tạo hàng loạt chính sách giá'),
('API_BPR_POLICY_UPDATE',      'BILLING', 'PUT',    '/api/billing/pricing/policies/:policyId',                'Cập nhật chính sách giá'),
('API_BPR_POLICY_DELETE',      'BILLING', 'DELETE', '/api/billing/pricing/policies/:policyId',                'Vô hiệu hóa chính sách giá'),
('API_BPR_RESOLVE',            'BILLING', 'GET',    '/api/billing/pricing/resolve',                           'Tra cứu giá cuối cùng (Price Resolver)'),

-- Nhóm 3: Giá chuyên khoa
('API_BPR_SP_LIST',            'BILLING', 'GET',    '/api/billing/pricing/specialty-prices/:facilityServiceId','Xem giá theo chuyên khoa'),
('API_BPR_SP_CREATE',          'BILLING', 'POST',   '/api/billing/pricing/specialty-prices',                   'Tạo giá chuyên khoa'),
('API_BPR_SP_UPDATE',          'BILLING', 'PUT',    '/api/billing/pricing/specialty-prices/:specialtyPriceId', 'Cập nhật giá chuyên khoa'),
('API_BPR_SP_DELETE',          'BILLING', 'DELETE', '/api/billing/pricing/specialty-prices/:specialtyPriceId', 'Vô hiệu hóa giá chuyên khoa'),

-- Nhóm 4: Lịch sử & Thống kê
('API_BPR_HISTORY_SERVICE',    'BILLING', 'GET',    '/api/billing/pricing/history/:facilityServiceId',         'Lịch sử thay đổi giá 1 dịch vụ'),
('API_BPR_HISTORY_FACILITY',   'BILLING', 'GET',    '/api/billing/pricing/history/facility/:facilityId',       'Lịch sử thay đổi giá toàn cơ sở'),
('API_BPR_COMPARE',            'BILLING', 'GET',    '/api/billing/pricing/compare',                            'So sánh giá liên cơ sở'),
('API_BPR_SUMMARY',            'BILLING', 'GET',    '/api/billing/pricing/summary/:facilityId',                'Thống kê bảng giá cơ sở'),
('API_BPR_EXPIRING',           'BILLING', 'GET',    '/api/billing/pricing/expiring-policies/:facilityId',      'Chính sách giá sắp hết hiệu lực')
ON CONFLICT (method, endpoint) DO NOTHING;

-- *********************************************************************
-- ROLE → API PERMISSIONS
-- *********************************************************************

-- ADMIN, STAFF: full 17 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','STAFF') AND a.api_id IN (
    'API_BPR_CATALOG','API_BPR_CATALOG_FACILITY',
    'API_BPR_POLICY_LIST','API_BPR_POLICY_CREATE','API_BPR_POLICY_BULK','API_BPR_POLICY_UPDATE','API_BPR_POLICY_DELETE',
    'API_BPR_RESOLVE',
    'API_BPR_SP_LIST','API_BPR_SP_CREATE','API_BPR_SP_UPDATE','API_BPR_SP_DELETE',
    'API_BPR_HISTORY_SERVICE','API_BPR_HISTORY_FACILITY','API_BPR_COMPARE','API_BPR_SUMMARY','API_BPR_EXPIRING'
) ON CONFLICT DO NOTHING;

-- DOCTOR, NURSE, PHARMACIST: chỉ GET APIs (xem danh mục, bảng giá, tra cứu giá, xem giá chuyên khoa)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR','NURSE','PHARMACIST') AND a.api_id IN (
    'API_BPR_CATALOG','API_BPR_CATALOG_FACILITY',
    'API_BPR_POLICY_LIST','API_BPR_RESOLVE',
    'API_BPR_SP_LIST'
) ON CONFLICT DO NOTHING;
