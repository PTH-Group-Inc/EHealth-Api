-- ==============================================================================
-- MODULE 6.4: KẾT QUẢ XÉT NGHIỆM & CẬN LÂM SÀNG (Clinical Results)
-- Chỉ cần permissions — KHÔNG tạo bảng mới
-- ==============================================================================

-- JWT PERMISSIONS
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EHR_RESULTS_VIEW', 'EHR_RESULTS_VIEW', 'EHR', 'Xem kết quả xét nghiệm & cận lâm sàng tổng hợp (EHR)')
ON CONFLICT DO NOTHING;

-- ROLE → JWT PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('ADMIN','DOCTOR','NURSE','STAFF') AND p.code = 'EHR_RESULTS_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- API PERMISSIONS
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EHR_RESULTS_LIST',       'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results',                              'Danh sách kết quả CLS tổng hợp'),
('API_EHR_RESULTS_DETAIL',     'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results/:orderId',                     'Chi tiết kết quả CLS'),
('API_EHR_RESULTS_ENCOUNTER',  'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results/by-encounter/:encounterId',    'Kết quả CLS theo encounter'),
('API_EHR_RESULTS_TRENDS',     'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results/trends',                       'Xu hướng kết quả theo service_code'),
('API_EHR_RESULTS_SUMMARY',    'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results/summary',                      'Thống kê tổng quan kết quả CLS'),
('API_EHR_RESULTS_ATTACH',     'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results/attachments',                  'Danh sách file đính kèm'),
('API_EHR_RESULTS_ABNORMAL',   'EHR', 'GET', '/api/ehr/patients/:patientId/clinical-results/abnormal',                     'Kết quả bất thường')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API PERMISSIONS

-- ADMIN, DOCTOR, NURSE: full 7 APIs
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','DOCTOR','NURSE') AND a.api_id IN (
    'API_EHR_RESULTS_LIST','API_EHR_RESULTS_DETAIL','API_EHR_RESULTS_ENCOUNTER',
    'API_EHR_RESULTS_TRENDS','API_EHR_RESULTS_SUMMARY','API_EHR_RESULTS_ATTACH','API_EHR_RESULTS_ABNORMAL'
) ON CONFLICT DO NOTHING;

-- STAFF: danh sách, encounter, thống kê
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_EHR_RESULTS_LIST','API_EHR_RESULTS_ENCOUNTER','API_EHR_RESULTS_SUMMARY'
) ON CONFLICT DO NOTHING;
