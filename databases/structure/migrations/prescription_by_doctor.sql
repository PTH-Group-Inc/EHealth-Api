-- =====================================================================
-- MODULE 5.3: QUẢN LÝ ĐƠN THUỐC THEO LƯỢT KHÁM
-- Bổ sung API permission cho endpoint by-doctor
-- =====================================================================

-- API Permission mới
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EMR_RX_DOCTOR', 'EMR', 'GET', '/api/prescriptions/by-doctor/:doctorId', 'Lịch sử đơn thuốc theo bác sĩ')
ON CONFLICT (method, endpoint) DO NOTHING;

-- Gán quyền cho các vai trò
-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, 'API_EMR_RX_DOCTOR'
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- DOCTOR: xem lịch sử kê đơn của mình
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, 'API_EMR_RX_DOCTOR'
FROM roles r
WHERE r.code = 'DOCTOR'
ON CONFLICT DO NOTHING;

-- NURSE: xem đơn thuốc (hỗ trợ BS)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, 'API_EMR_RX_DOCTOR'
FROM roles r
WHERE r.code = 'NURSE'
ON CONFLICT DO NOTHING;

-- PHARMACIST: xem đơn thuốc (cấp phát)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, 'API_EMR_RX_DOCTOR'
FROM roles r
WHERE r.code = 'PHARMACIST'
ON CONFLICT DO NOTHING;
