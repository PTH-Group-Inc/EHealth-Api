-- =====================================================================
-- Permissions Seed cho Module 2.9: Quản lý Danh mục Dịch vụ
-- Ngày tạo: 2026-03-10
-- =====================================================================

-- ========================
-- 1. Đăng ký API Endpoints vào api_permissions
-- ========================

-- Specialty-Service Mapping (2.9.1)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_SSRV_VIEW_BY_SPECIALTY', 'MEDICAL_SERVICE', 'GET', '/api/specialty-services/:specialtyId/services', 'Xem danh sách dịch vụ gắn với chuyên khoa'),
('API_SSRV_VIEW_BY_SERVICE', 'MEDICAL_SERVICE', 'GET', '/api/specialty-services/by-service/:serviceId', 'Xem danh sách chuyên khoa gắn với dịch vụ'),
('API_SSRV_ASSIGN', 'MEDICAL_SERVICE', 'POST', '/api/specialty-services/:specialtyId/services', 'Gán danh sách dịch vụ vào chuyên khoa'),
('API_SSRV_REMOVE', 'MEDICAL_SERVICE', 'DELETE', '/api/specialty-services/:specialtyId/services/:serviceId', 'Gỡ 1 dịch vụ khỏi chuyên khoa')
ON CONFLICT (method, endpoint) DO NOTHING;

-- Doctor-Service Mapping (2.9.2)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_DSRV_VIEW_BY_DOCTOR', 'MEDICAL_SERVICE', 'GET', '/api/doctor-services/:doctorId/services', 'Xem danh sách dịch vụ gắn với bác sĩ'),
('API_DSRV_VIEW_BY_FSRV', 'MEDICAL_SERVICE', 'GET', '/api/doctor-services/by-facility-service/:facilityServiceId', 'Xem danh sách bác sĩ thực hiện dịch vụ cơ sở'),
('API_DSRV_ASSIGN', 'MEDICAL_SERVICE', 'POST', '/api/doctor-services/:doctorId/services', 'Gán danh sách dịch vụ cho bác sĩ'),
('API_DSRV_REMOVE', 'MEDICAL_SERVICE', 'DELETE', '/api/doctor-services/:doctorId/services/:facilityServiceId', 'Gỡ 1 dịch vụ khỏi bác sĩ')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ========================
-- 2. Map Role → API Permissions (role_api_permissions)
-- ========================

-- ADMIN & STAFF: full quyền trên tất cả endpoints
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_SSRV_VIEW_BY_SPECIALTY', 'API_SSRV_VIEW_BY_SERVICE', 'API_SSRV_ASSIGN', 'API_SSRV_REMOVE',
    'API_DSRV_VIEW_BY_DOCTOR', 'API_DSRV_VIEW_BY_FSRV', 'API_DSRV_ASSIGN', 'API_DSRV_REMOVE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: chỉ GET (xem)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_SSRV_VIEW_BY_SPECIALTY', 'API_SSRV_VIEW_BY_SERVICE',
    'API_DSRV_VIEW_BY_DOCTOR', 'API_DSRV_VIEW_BY_FSRV'
  )
ON CONFLICT DO NOTHING;

-- ========================
-- 3. Đăng ký quyền JWT (Permissions)
-- ========================

-- Quyền cho Specialty-Service Mapping (2.9.1)
INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_SSRV_VIEW', 'SPECIALTY_SERVICE_VIEW', 'MEDICAL_SERVICE', 'Xem danh sách dịch vụ gắn với chuyên khoa'),
    ('PERM_SSRV_ASSIGN', 'SPECIALTY_SERVICE_ASSIGN', 'MEDICAL_SERVICE', 'Gán/Gỡ dịch vụ vào chuyên khoa')
ON CONFLICT (code) DO NOTHING;

-- Quyền cho Doctor-Service Mapping (2.9.2)
INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_DSRV_VIEW', 'DOCTOR_SERVICE_VIEW', 'MEDICAL_SERVICE', 'Xem danh sách dịch vụ gắn với bác sĩ'),
    ('PERM_DSRV_ASSIGN', 'DOCTOR_SERVICE_ASSIGN', 'MEDICAL_SERVICE', 'Gán/Gỡ dịch vụ cho bác sĩ thực hiện')
ON CONFLICT (code) DO NOTHING;

-- ========================
-- 4. Map Role → JWT Permissions (role_permissions)
-- ========================

-- ADMIN: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('SPECIALTY_SERVICE_VIEW', 'SPECIALTY_SERVICE_ASSIGN', 'DOCTOR_SERVICE_VIEW', 'DOCTOR_SERVICE_ASSIGN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: toàn quyền quản lý
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('SPECIALTY_SERVICE_VIEW', 'SPECIALTY_SERVICE_ASSIGN', 'DOCTOR_SERVICE_VIEW', 'DOCTOR_SERVICE_ASSIGN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('SPECIALTY_SERVICE_VIEW', 'DOCTOR_SERVICE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('SPECIALTY_SERVICE_VIEW', 'DOCTOR_SERVICE_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

