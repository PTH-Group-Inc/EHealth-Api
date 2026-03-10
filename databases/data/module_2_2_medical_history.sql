-- ==============================================================================
-- MODULE 2.2: QUẢN LÝ LỊCH SỬ KHÁM & ĐIỀU TRỊ (MEDICAL HISTORY - READ-ONLY)
-- Chỉ seed permissions, KHÔNG tạo bảng mới (dùng encounters, clinical_examinations... đã có)
-- ==============================================================================

-- ==============================================================================
-- 1. API PERMISSIONS
-- ==============================================================================

INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_MH_LIST',        'MEDICAL_HISTORY', 'GET', '/api/medical-history',                              'Lấy danh sách lượt khám'),
('API_MH_DETAIL',      'MEDICAL_HISTORY', 'GET', '/api/medical-history/:encounterId',                  'Xem chi tiết đầy đủ lượt khám'),
('API_MH_LATEST',      'MEDICAL_HISTORY', 'GET', '/api/medical-history/patient/:patientId/latest',     'Tra cứu lần khám gần nhất'),
('API_MH_TIMELINE',    'MEDICAL_HISTORY', 'GET', '/api/medical-history/patient/:patientId/timeline',   'Xem dòng thời gian sức khỏe'),
('API_MH_SUMMARY',     'MEDICAL_HISTORY', 'GET', '/api/medical-history/patient/:patientId/summary',    'Tổng hợp lịch sử khám bệnh nhân')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 2. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN & STAFF: xem tất cả
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN ('API_MH_LIST', 'API_MH_DETAIL', 'API_MH_LATEST', 'API_MH_TIMELINE', 'API_MH_SUMMARY')
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: xem tất cả (cần xem lịch sử BN để khám)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN ('API_MH_LIST', 'API_MH_DETAIL', 'API_MH_LATEST', 'API_MH_TIMELINE', 'API_MH_SUMMARY')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 3. JWT PERMISSIONS
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_ENC_VIEW', 'ENCOUNTER_VIEW', 'MEDICAL_HISTORY', 'Xem lịch sử khám bệnh, chi tiết lượt khám, dòng thời gian sức khỏe')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 4. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: xem lịch sử
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('ENCOUNTER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: xem lịch sử
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('ENCOUNTER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: xem lịch sử (quan trọng nhất — BS cần biết tiền sử khi khám)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('ENCOUNTER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem lịch sử (cần biết tiền sử khi chuẩn bị hồ sơ)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('ENCOUNTER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;
