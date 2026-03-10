-- =========================================================================
-- MODULE 2.1: QUẢN LÝ HỒ SƠ BỆNH NHÂN (PATIENT PROFILE)
-- =========================================================================

-- 1. Tạo Sequence để tự động sinh mã bệnh nhân (Ví dụ: BN260300001)
CREATE SEQUENCE IF NOT EXISTS patient_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 2. Tạo bảng patients (Hồ sơ bệnh nhân)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Mã bệnh nhân: BN + YYMM + 5 số tự tăng (Vd: BN260300001)
    patient_code VARCHAR(30) UNIQUE NOT NULL, 
    
    -- Liên kết với tài khoản người dùng Mobile App (nếu bệnh nhân tự đặt lịch qua App)
    -- Một tài khoản có thể quản lý nhiều hồ sơ (ví dụ: Mẹ đặt lịch cho con)
    account_id VARCHAR(255) REFERENCES users(users_id) ON DELETE SET NULL, 
    
    -- Thông tin hành chính cơ bản
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    id_card_number VARCHAR(50) UNIQUE, -- Số CMND/CCCD có thể Null, nhưng nếu có phải duy nhất
    
    -- Thông tin địa chỉ
    address TEXT,
    province_id INT,
    district_id INT,
    ward_id INT,
    
    -- Người liên hệ khẩn cấp
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Trạng thái hồ sơ
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Tạo các Index để tối ưu tìm kiếm
CREATE INDEX IF NOT EXISTS idx_patients_account_id ON patients(account_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_patients_patient_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_id_card ON patients(id_card_number);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients USING gin (to_tsvector('simple', full_name));

-- 4. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_patients_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patients_updated_at_column();

-- ==============================================================================
-- 5. API PERMISSIONS - Đăng ký API Endpoints vào api_permissions
-- ==============================================================================

INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PAT_LIST',           'PATIENT', 'GET',    '/api/patients',                       'Lấy danh sách hồ sơ bệnh nhân'),
('API_PAT_DETAIL',         'PATIENT', 'GET',    '/api/patients/:id',                   'Xem chi tiết hồ sơ bệnh nhân'),
('API_PAT_CREATE',         'PATIENT', 'POST',   '/api/patients',                       'Tạo mới hồ sơ bệnh nhân'),
('API_PAT_UPDATE',         'PATIENT', 'PUT',    '/api/patients/:id',                   'Cập nhật thông tin hành chính bệnh nhân'),
('API_PAT_STATUS',         'PATIENT', 'PATCH',  '/api/patients/:id/status',             'Cập nhật trạng thái hồ sơ bệnh nhân'),
('API_PAT_LINK_ACCOUNT',   'PATIENT', 'PATCH',  '/api/patients/:id/link-account',       'Liên kết hồ sơ BN với tài khoản App'),
('API_PAT_UNLINK_ACCOUNT', 'PATIENT', 'PATCH',  '/api/patients/:id/unlink-account',     'Hủy liên kết tài khoản khỏi hồ sơ BN'),
('API_PAT_DELETE',         'PATIENT', 'DELETE', '/api/patients/:id',                   'Xóa hồ sơ bệnh nhân (soft delete)')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 6. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN & STAFF: toàn quyền trên tất cả endpoints bệnh nhân
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_PAT_LIST', 'API_PAT_DETAIL', 'API_PAT_CREATE', 'API_PAT_UPDATE',
    'API_PAT_STATUS', 'API_PAT_LINK_ACCOUNT', 'API_PAT_UNLINK_ACCOUNT', 'API_PAT_DELETE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: xem danh sách, chi tiết
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_PAT_LIST', 'API_PAT_DETAIL'
  )
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 7. JWT PERMISSIONS - Đăng ký quyền cho middleware authorizePermissions
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_PAT_VIEW',   'PATIENT_VIEW',   'PATIENT', 'Xem danh sách và chi tiết hồ sơ bệnh nhân'),
    ('PERM_PAT_CREATE', 'PATIENT_CREATE', 'PATIENT', 'Tạo mới hồ sơ bệnh nhân'),
    ('PERM_PAT_UPDATE', 'PATIENT_UPDATE', 'PATIENT', 'Cập nhật thông tin, trạng thái và liên kết tài khoản bệnh nhân'),
    ('PERM_PAT_DELETE', 'PATIENT_DELETE', 'PATIENT', 'Xóa hồ sơ bệnh nhân')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 8. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('PATIENT_VIEW', 'PATIENT_CREATE', 'PATIENT_UPDATE', 'PATIENT_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: toàn quyền quản lý (trừ xóa)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('PATIENT_VIEW', 'PATIENT_CREATE', 'PATIENT_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: xem + cập nhật (cần cập nhật thông tin BN khi khám)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('PATIENT_VIEW', 'PATIENT_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('PATIENT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;
