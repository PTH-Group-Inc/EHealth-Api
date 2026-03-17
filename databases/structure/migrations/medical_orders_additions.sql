-- ==============================================================================
-- MODULE 4.4: MEDICAL ORDERS — BỔ SUNG CỘT + PERMISSIONS + SEED DATA
-- ==============================================================================

-- Thêm cột bổ sung cho bảng medical_orders
ALTER TABLE medical_orders
    ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'OTHER',
    ADD COLUMN IF NOT EXISTS service_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- FK service_id → services
ALTER TABLE medical_orders
    ADD CONSTRAINT fk_medical_orders_service
    FOREIGN KEY (service_id) REFERENCES services(services_id) ON DELETE SET NULL;

-- Index cho truy vấn thường dùng
CREATE INDEX IF NOT EXISTS idx_medical_orders_encounter ON medical_orders(encounter_id);
CREATE INDEX IF NOT EXISTS idx_medical_orders_status ON medical_orders(status);
CREATE INDEX IF NOT EXISTS idx_medical_orders_order_type ON medical_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_medical_orders_ordered_by ON medical_orders(ordered_by);
CREATE INDEX IF NOT EXISTS idx_medical_order_results_order ON medical_order_results(order_id);

-- ==============================================================================
-- JWT PERMISSIONS (bảng permissions: code, module, description)
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_EMR_ORDER_CREATE',  'EMR_ORDER_CREATE',  'EMR', 'Tạo chỉ định dịch vụ CLS'),
('PERM_EMR_ORDER_VIEW',    'EMR_ORDER_VIEW',    'EMR', 'Xem danh sách chỉ định CLS'),
('PERM_EMR_ORDER_UPDATE',  'EMR_ORDER_UPDATE',  'EMR', 'Cập nhật chỉ định CLS'),
('PERM_EMR_ORDER_CANCEL',  'EMR_ORDER_CANCEL',  'EMR', 'Hủy chỉ định CLS'),
('PERM_EMR_ORDER_START',   'EMR_ORDER_START',   'EMR', 'Bắt đầu thực hiện chỉ định CLS'),
('PERM_EMR_ORDER_RESULT',  'EMR_ORDER_RESULT',  'EMR', 'Ghi/cập nhật kết quả CLS'),
('PERM_EMR_ORDER_HISTORY', 'EMR_ORDER_HISTORY', 'EMR', 'Xem lịch sử chỉ định theo bệnh nhân')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ROLE → JWT PERMISSIONS (bảng role_permissions)
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EMR_ORDER_CREATE','EMR_ORDER_VIEW','EMR_ORDER_UPDATE','EMR_ORDER_CANCEL','EMR_ORDER_START','EMR_ORDER_RESULT','EMR_ORDER_HISTORY')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EMR_ORDER_CREATE','EMR_ORDER_VIEW','EMR_ORDER_UPDATE','EMR_ORDER_CANCEL','EMR_ORDER_START','EMR_ORDER_RESULT','EMR_ORDER_HISTORY')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem + bắt đầu + ghi kết quả
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EMR_ORDER_VIEW','EMR_ORDER_START','EMR_ORDER_RESULT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EMR_ORDER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS (bảng api_permissions: api_id, method, endpoint)
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EMR_ORDER_CREATE',    'EMR', 'POST',  '/api/medical-orders/:encounterId',           'Tạo chỉ định CLS'),
('API_EMR_ORDER_LIST',      'EMR', 'GET',   '/api/medical-orders/:encounterId',           'Danh sách chỉ định theo encounter'),
('API_EMR_ORDER_DETAIL',    'EMR', 'GET',   '/api/medical-orders/detail/:orderId',        'Chi tiết 1 chỉ định'),
('API_EMR_ORDER_UPDATE',    'EMR', 'PATCH', '/api/medical-orders/:orderId',               'Cập nhật chỉ định'),
('API_EMR_ORDER_CANCEL',    'EMR', 'PATCH', '/api/medical-orders/:orderId/cancel',        'Hủy chỉ định'),
('API_EMR_ORDER_START',     'EMR', 'PATCH', '/api/medical-orders/:orderId/start',         'Bắt đầu thực hiện chỉ định'),
('API_EMR_ORDER_RESULT_C',  'EMR', 'POST',  '/api/medical-orders/:orderId/result',        'Ghi kết quả CLS'),
('API_EMR_ORDER_RESULT_U',  'EMR', 'PATCH', '/api/medical-orders/:orderId/result',        'Cập nhật kết quả CLS'),
('API_EMR_ORDER_PATIENT',   'EMR', 'GET',   '/api/medical-orders/by-patient/:patientId',  'Lịch sử chỉ định theo BN'),
('API_EMR_ORDER_PENDING',   'EMR', 'GET',   '/api/medical-orders/pending',                'Dashboard chỉ định chờ'),
('API_EMR_ORDER_SEARCH',    'EMR', 'GET',   '/api/medical-orders/search-services',        'Tìm dịch vụ CLS'),
('API_EMR_ORDER_SUMMARY',   'EMR', 'GET',   '/api/medical-orders/:encounterId/summary',   'Tóm tắt chỉ định + kết quả')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS (bảng role_api_permissions)
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_EMR_ORDER_CREATE', 'API_EMR_ORDER_LIST', 'API_EMR_ORDER_DETAIL',
    'API_EMR_ORDER_UPDATE', 'API_EMR_ORDER_CANCEL', 'API_EMR_ORDER_START',
    'API_EMR_ORDER_RESULT_C', 'API_EMR_ORDER_RESULT_U',
    'API_EMR_ORDER_PATIENT', 'API_EMR_ORDER_PENDING',
    'API_EMR_ORDER_SEARCH', 'API_EMR_ORDER_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_EMR_ORDER_CREATE', 'API_EMR_ORDER_LIST', 'API_EMR_ORDER_DETAIL',
    'API_EMR_ORDER_UPDATE', 'API_EMR_ORDER_CANCEL', 'API_EMR_ORDER_START',
    'API_EMR_ORDER_RESULT_C', 'API_EMR_ORDER_RESULT_U',
    'API_EMR_ORDER_PATIENT', 'API_EMR_ORDER_PENDING',
    'API_EMR_ORDER_SEARCH', 'API_EMR_ORDER_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- NURSE: xem + start + ghi/sửa kết quả
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN (
    'API_EMR_ORDER_LIST', 'API_EMR_ORDER_DETAIL', 'API_EMR_ORDER_START',
    'API_EMR_ORDER_RESULT_C', 'API_EMR_ORDER_RESULT_U',
    'API_EMR_ORDER_PENDING'
  )
ON CONFLICT DO NOTHING;

-- STAFF: chỉ xem danh sách
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN ('API_EMR_ORDER_LIST', 'API_EMR_ORDER_DETAIL')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SEED DATA: Dịch vụ CLS mẫu (nếu bảng services chưa có)
-- ==============================================================================
INSERT INTO services (services_id, code, name, service_group, service_type, description, is_active) VALUES
-- Xét nghiệm
('SVC_XN_CTM',   'XN_CTM',   'Xét nghiệm công thức máu',          'XN',       'LABORATORY',  'Đếm tế bào máu, Hb, Hct, MCV, MCH, MCHC', TRUE),
('SVC_XN_SHM',   'XN_SHM',   'Xét nghiệm sinh hóa máu',           'XN',       'LABORATORY',  'Glucose, Ure, Creatinin, AST, ALT, Cholesterol', TRUE),
('SVC_XN_NT',    'XN_NT',    'Xét nghiệm nước tiểu',              'XN',       'LABORATORY',  'Tổng phân tích nước tiểu 10 thông số', TRUE),
('SVC_XN_DHMAU', 'XN_DHMAU', 'Xét nghiệm đông máu cơ bản',        'XN',       'LABORATORY',  'PT, APTT, Fibrinogen', TRUE),
('SVC_XN_HBA1C', 'XN_HBA1C', 'Xét nghiệm HbA1c',                  'XN',       'LABORATORY',  'Đánh giá kiểm soát đường huyết 3 tháng', TRUE),
-- Chẩn đoán hình ảnh
('SVC_XQ_NGUC',  'XQ_NGUC',  'X-quang ngực thẳng',                'CDHA',     'RADIOLOGY',   'Chụp X-quang lồng ngực 1 phim', TRUE),
('SVC_SA_BUNG',  'SA_BUNG',  'Siêu âm bụng tổng quát',            'CDHA',     'RADIOLOGY',   'Siêu âm gan, mật, tụy, lách, thận', TRUE),
('SVC_CT_SO',    'CT_SO',    'CT Scanner sọ não',                  'CDHA',     'RADIOLOGY',   'Chụp cắt lớp vi tính sọ não không tiêm thuốc', TRUE),
('SVC_ECG',      'ECG',      'Điện tâm đồ (ECG)',                  'CDHA',     'RADIOLOGY',   'Đo điện tâm đồ 12 chuyển đạo', TRUE),
-- Thủ thuật
('SVC_TT_KCS',   'TT_KCS',   'Khâu vết thương',                   'THUTHUAT', 'PROCEDURE',   'Khâu vết thương phần mềm', TRUE),
('SVC_TT_NOI',   'TT_NOI',   'Nội soi dạ dày',                    'THUTHUAT', 'PROCEDURE',   'Nội soi dạ dày - tá tràng chẩn đoán', TRUE),
('SVC_TT_SINH',  'TT_SINH',  'Sinh thiết',                        'THUTHUAT', 'PROCEDURE',   'Sinh thiết mô bằng kim', TRUE)
ON CONFLICT (code) DO NOTHING;
