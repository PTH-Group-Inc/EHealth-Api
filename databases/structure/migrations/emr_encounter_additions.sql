-- =====================================================================
-- MODULE 4.1: EMR — Encounter Management (Bổ sung)
-- Bảng `encounters` đã tồn tại. File này bổ sung cột, index,
-- api_permissions, permissions và phân quyền role.
-- =====================================================================

-- ==============================================================================
-- 1. BỔ SUNG CỘT & INDEX CHO BẢNG ENCOUNTERS
-- ==============================================================================

-- Thêm cột hỗ trợ encounter mở rộng
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS visit_number INT DEFAULT 1;
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS notes TEXT;

-- UNIQUE constraint: 1 appointment = tối đa 1 encounter
CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_appointment_unique 
  ON encounters(appointment_id) 
  WHERE appointment_id IS NOT NULL;

-- Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_doctor ON encounters(doctor_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_encounters_room ON encounters(room_id);

-- ==============================================================================
-- 2. API PERMISSIONS — Đăng ký API Endpoints vào api_permissions
-- ==============================================================================

INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Encounter CRUD & Query
('API_ENC_LIST',            'EMR', 'GET',   '/api/encounters',                              'Danh sách tất cả lượt khám (filter + phân trang)'),
('API_ENC_ACTIVE',          'EMR', 'GET',   '/api/encounters/active',                       'Danh sách lượt khám đang diễn ra (dashboard)'),
('API_ENC_DETAIL',          'EMR', 'GET',   '/api/encounters/:id',                          'Chi tiết lượt khám theo ID'),
('API_ENC_BY_PATIENT',      'EMR', 'GET',   '/api/encounters/by-patient/:patientId',         'Danh sách lượt khám của 1 bệnh nhân'),
('API_ENC_BY_APPOINTMENT',  'EMR', 'GET',   '/api/encounters/by-appointment/:appointmentId', 'Lấy hồ sơ khám từ lịch khám'),
-- Encounter Create
('API_ENC_CREATE',          'EMR', 'POST',  '/api/encounters',                              'Tạo encounter walk-in / cấp cứu'),
('API_ENC_FROM_APT',        'EMR', 'POST',  '/api/encounters/from-appointment/:appointmentId', 'Mở hồ sơ khám từ lịch khám (luồng chính)'),
-- Encounter Update
('API_ENC_UPDATE',          'EMR', 'PATCH', '/api/encounters/:id',                          'Cập nhật hồ sơ khám (notes, loại khám)'),
('API_ENC_ASSIGN_DOCTOR',   'EMR', 'PATCH', '/api/encounters/:id/assign-doctor',             'Đổi bác sĩ phụ trách giữa chừng'),
('API_ENC_ASSIGN_ROOM',     'EMR', 'PATCH', '/api/encounters/:id/assign-room',               'Đổi phòng khám giữa chừng'),
('API_ENC_STATUS',          'EMR', 'PATCH', '/api/encounters/:id/status',                    'Chuyển trạng thái encounter (state machine)')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 3. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN: full quyền trên tất cả encounter endpoints
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_ENC_LIST', 'API_ENC_ACTIVE', 'API_ENC_DETAIL', 'API_ENC_BY_PATIENT', 'API_ENC_BY_APPOINTMENT',
    'API_ENC_CREATE', 'API_ENC_FROM_APT',
    'API_ENC_UPDATE', 'API_ENC_ASSIGN_DOCTOR', 'API_ENC_ASSIGN_ROOM', 'API_ENC_STATUS'
  )
ON CONFLICT DO NOTHING;

-- STAFF: xem + tạo encounter (lễ tân mở hồ sơ khám cho BN)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN (
    'API_ENC_LIST', 'API_ENC_ACTIVE', 'API_ENC_DETAIL', 'API_ENC_BY_PATIENT', 'API_ENC_BY_APPOINTMENT',
    'API_ENC_CREATE', 'API_ENC_FROM_APT',
    'API_ENC_ASSIGN_ROOM'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: xem + tạo + sửa + đổi BS + chuyển trạng thái
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_ENC_LIST', 'API_ENC_ACTIVE', 'API_ENC_DETAIL', 'API_ENC_BY_PATIENT', 'API_ENC_BY_APPOINTMENT',
    'API_ENC_CREATE', 'API_ENC_FROM_APT',
    'API_ENC_UPDATE', 'API_ENC_ASSIGN_DOCTOR', 'API_ENC_STATUS'
  )
ON CONFLICT DO NOTHING;

-- NURSE: xem + tạo encounter + đổi phòng
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN (
    'API_ENC_LIST', 'API_ENC_ACTIVE', 'API_ENC_DETAIL', 'API_ENC_BY_PATIENT', 'API_ENC_BY_APPOINTMENT',
    'API_ENC_CREATE', 'API_ENC_FROM_APT',
    'API_ENC_ASSIGN_ROOM'
  )
ON CONFLICT DO NOTHING;

-- PATIENT: chỉ xem encounter của chính mình
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'PATIENT'
  AND a.api_id IN (
    'API_ENC_DETAIL', 'API_ENC_BY_PATIENT', 'API_ENC_BY_APPOINTMENT'
  )
ON CONFLICT DO NOTHING;

-- CUSTOMER: chỉ xem encounter liên kết với lịch khám
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'CUSTOMER'
  AND a.api_id IN (
    'API_ENC_DETAIL', 'API_ENC_BY_APPOINTMENT'
  )
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 4. JWT PERMISSIONS — Đăng ký quyền cho middleware authorizePermissions
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_ENC_VIEW',   'EMR_ENCOUNTER_VIEW',   'EMR', 'Xem danh sách, chi tiết, và tra cứu lượt khám'),
    ('PERM_ENC_CREATE', 'EMR_ENCOUNTER_CREATE', 'EMR', 'Tạo mới lượt khám (walk-in, cấp cứu, từ lịch khám)'),
    ('PERM_ENC_EDIT',   'EMR_ENCOUNTER_EDIT',   'EMR', 'Cập nhật, đổi BS/phòng, chuyển trạng thái lượt khám')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('EMR_ENCOUNTER_VIEW', 'EMR_ENCOUNTER_CREATE', 'EMR_ENCOUNTER_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: xem + tạo (lễ tân mở hồ sơ, không sửa nội dung y khoa)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('EMR_ENCOUNTER_VIEW', 'EMR_ENCOUNTER_CREATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: toàn quyền (khám, sửa, đổi BS, chuyển trạng thái)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('EMR_ENCOUNTER_VIEW', 'EMR_ENCOUNTER_CREATE', 'EMR_ENCOUNTER_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem + tạo (điều dưỡng mở hồ sơ, không sửa nội dung y khoa)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('EMR_ENCOUNTER_VIEW', 'EMR_ENCOUNTER_CREATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'PATIENT'
  AND p.code IN ('EMR_ENCOUNTER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CUSTOMER: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'CUSTOMER'
  AND p.code IN ('EMR_ENCOUNTER_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;
