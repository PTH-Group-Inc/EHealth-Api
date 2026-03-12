-- =========================================================================
-- MODULE 2.4: QUẢN LÝ NGƯỜI THÂN & LOẠI QUAN HỆ (PATIENT RELATIONS)
-- ĐÃ CẬP NHẬT: Dùng bảng có sẵn `patient_contacts` và ID `VARCHAR(50)`
-- =========================================================================

-- 1. Tạo hoặc Cập nhật bảng relation_types (Loại quan hệ)
CREATE TABLE IF NOT EXISTS relation_types (
    relation_types_id VARCHAR(50) PRIMARY KEY, -- ID Form: REL_240503_abcd1234
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., FATHER, MOTHER, SPOUSE
    name VARCHAR(100) NOT NULL,       -- e.g., Cha, Mẹ, Vợ/Chồng
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Trigger cập nhật thời gian updated_at cho relation_types
CREATE OR REPLACE FUNCTION update_relation_types_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_relation_types_updated_at ON relation_types;
CREATE TRIGGER update_relation_types_updated_at
    BEFORE UPDATE ON relation_types
    FOR EACH ROW
    EXECUTE FUNCTION update_relation_types_updated_at_column();

-- Dữ liệu mẫu (Seed Data)
INSERT INTO relation_types (relation_types_id, code, name, description) VALUES
('REL_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5(random()::text), 1, 8), 'FATHER', 'Cha', 'Cha ruột/Cha đi kèm'),
('REL_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5(random()::text), 1, 8), 'MOTHER', 'Mẹ', 'Mẹ ruột/Mẹ đi kèm'),
('REL_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5(random()::text), 1, 8), 'SPOUSE', 'Vợ / Chồng', 'Người bạn đời'),
('REL_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5(random()::text), 1, 8), 'CHILD', 'Con', 'Con ruột/Con nuôi'),
('REL_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5(random()::text), 1, 8), 'SIBLING', 'Anh / Chị / Em', 'Anh chị em ruột'),
('REL_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5(random()::text), 1, 8), 'GUARDIAN', 'Người giám hộ', 'Người giám hộ hợp pháp')
ON CONFLICT (code) DO NOTHING;


-- 2. Cập nhật bảng patient_contacts (Người thân của bệnh nhân)
-- Thêm các trường audit cho Soft Delete và đổi trường relationship thành khóa ngoại trỏ về relation_types
CREATE TABLE IF NOT EXISTS patient_contacts (
    patient_contacts_id VARCHAR(50) PRIMARY KEY, -- ID Form: PTC_240503_abcd1234
    patient_id UUID NOT NULL,                    -- Kiểu UUID khớp với patients.id
    relation_type_id VARCHAR(50) NOT NULL,       -- Dùng Khóa ngoại thay cho nhập chuỗi String tự do
    
    -- Thông tin liên hệ
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (relation_type_id) REFERENCES relation_types(relation_types_id)
);

-- Index tối ưu
CREATE INDEX IF NOT EXISTS idx_patient_contacts_patient_id ON patient_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_contacts_relation_type_id ON patient_contacts(relation_type_id);

-- Trigger cập nhật thời gian
CREATE OR REPLACE FUNCTION update_patient_contacts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patient_contacts_updated_at ON patient_contacts;
CREATE TRIGGER update_patient_contacts_updated_at
    BEFORE UPDATE ON patient_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_contacts_updated_at_column();


-- ==============================================================================
-- 3. API PERMISSIONS - Đăng ký API Endpoints vào api_permissions
-- ==============================================================================

INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Master Data: Relation Types
('API_REL_TYPE_CREATE', 'PATIENT', 'POST',   '/api/relation-types',       'Tạo loại quan hệ'),
('API_REL_TYPE_LIST',   'PATIENT', 'GET',    '/api/relation-types',       'Danh sách loại quan hệ'),
('API_REL_TYPE_UPDATE', 'PATIENT', 'PUT',    '/api/relation-types/:id',   'Cập nhật loại quan hệ'),
('API_REL_TYPE_DELETE', 'PATIENT', 'DELETE', '/api/relation-types/:id',   'Xóa loại quan hệ'),

-- Patient Contacts (Giao diện hiển thị qua route patient-relations)
('API_PAT_REL_CREATE',  'PATIENT', 'POST',   '/api/patient-relations',     'Thêm người thân cho bệnh nhân'),
('API_PAT_REL_LIST',    'PATIENT', 'GET',    '/api/patient-relations',     'Danh sách người thân của bệnh nhân'),
('API_PAT_REL_DETAIL',  'PATIENT', 'GET',    '/api/patient-relations/:id', 'Chi tiết người thân'),
('API_PAT_REL_UPDATE',  'PATIENT', 'PUT',    '/api/patient-relations/:id', 'Cập nhật thông tin người thân'),
('API_PAT_REL_DELETE',  'PATIENT', 'DELETE', '/api/patient-relations/:id', 'Xóa người thân khỏi hồ sơ')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 4. ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN & STAFF toàn quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_REL_TYPE_CREATE', 'API_REL_TYPE_LIST', 'API_REL_TYPE_UPDATE', 'API_REL_TYPE_DELETE',
    'API_PAT_REL_CREATE', 'API_PAT_REL_LIST', 'API_PAT_REL_DETAIL', 'API_PAT_REL_UPDATE', 'API_PAT_REL_DELETE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE xem danh sách
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_REL_TYPE_LIST', 'API_PAT_REL_LIST', 'API_PAT_REL_DETAIL'
  )
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. JWT PERMISSIONS (Dành cho authorization middleware)
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_PAT_REL_VIEW',   'PATIENT_RELATION_VIEW',   'PATIENT', 'Xem danh sách và chi tiết người thân / loại quan hệ'),
    ('PERM_PAT_REL_MANAGE', 'PATIENT_RELATION_MANAGE', 'PATIENT', 'Thêm, sửa, xóa người thân và loại quan hệ')
ON CONFLICT (code) DO NOTHING;

-- Map Role -> Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'STAFF')
  AND p.code IN ('PATIENT_RELATION_VIEW', 'PATIENT_RELATION_MANAGE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND p.code = 'PATIENT_RELATION_VIEW'
ON CONFLICT DO NOTHING;
