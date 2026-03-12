-- =========================================================================
-- MODULE 2.6: PHÂN LOẠI & GẮN THẺ BỆNH NHÂN (PATIENT CLASSIFICATIONS & TAGS)
-- Cập nhật danh mục Tag và tạo bảng Assignment (Mapping)
-- =========================================================================

-- ==============================================================================
-- 1. BẢNG DANH MỤC THẺ (TAGS)
-- (Nếu db.sql đã có, ta thêm các cột tracking để quản lý tốt hơn)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tags (
    tags_id VARCHAR(50) PRIMARY KEY, -- Form: TAG_YYMMDD_8char
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: VIP, CHRONIC_CARE, HIGH_RISK
    name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(10) DEFAULT '#000000', -- Dùng mã HEX cho Web (#FF5733)
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_tags_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tags_updated_at_column();

-- SEED DATA (Danh mục Tag cơ bản)
INSERT INTO tags (tags_id, code, name, color_hex, description) VALUES
('TAG_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5('tags_vip'), 1, 8), 'VIP', 'Khách hàng VIP', '#FFD700', 'Bệnh nhân có tiêu chuẩn phục vụ ưu tiên'),
('TAG_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5('tags_chronic'), 1, 8), 'CHRONIC', 'Bệnh mãn tính', '#FF5733', 'Cần theo dõi và hẹn khám định kỳ thường xuyên'),
('TAG_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5('tags_highrisk'), 1, 8), 'HIGH_RISK', 'Nguy cơ cao', '#C70039', 'Bệnh nhân có bệnh lý nền nặng (Tim mạch, Tiểu đường)'),
('TAG_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5('tags_pregnant'), 1, 8), 'PREGNANT', 'Thai phụ', '#FFC0CB', 'Nhóm đối tượng cần cẩn trọng khi kê đơn thuốc'),
('TAG_' || to_char(current_date, 'YYMMDD') || '_' || substr(md5('tags_corporate'), 1, 8), 'CORPORATE', 'Khách hàng Doanh nghiệp', '#007BFF', 'Bệnh nhân khám theo luồng khám sức khỏe công ty')
ON CONFLICT (code) DO NOTHING;


-- ==============================================================================
-- 2. BẢNG MAPPING GẮN THẺ CHO BỆNH NHÂN (PATIENT_TAGS)
-- (Chú ý: Chuẩn hóa lại bằng cách thêm column ID độc lập patient_tags_id)
-- ==============================================================================
/*
Ghi chú: Nếu db.sql cũ đã tạo `patient_tags` không có `patient_tags_id`, 
các bản script trước cần DROP table này đi hoặc ta ALTER nó.
Ở đây ta cung cấp script tiêu chuẩn dùng PK độc lập.
*/
DROP TABLE IF EXISTS patient_tags CASCADE; -- Recreate cho chuẩn kiến trúc

CREATE TABLE IF NOT EXISTS patient_tags (
    patient_tags_id VARCHAR(50) PRIMARY KEY, -- Form: PTAG_YYMMDD_8char
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tag_id VARCHAR(50) NOT NULL REFERENCES tags(tags_id) ON DELETE CASCADE,
    assigned_by VARCHAR(50) REFERENCES users(users_id) ON DELETE SET NULL, -- Ai đã gán thẻ này
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Quan trọng: Một bệnh nhân chỉ được gán củng 1 Tag duy nhất 1 lần (để tránh trùng lặp)
    UNIQUE(patient_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_tags_patient ON patient_tags(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tags_tag ON patient_tags(tag_id);


-- ==============================================================================
-- 3. ĐĂNG KÝ API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- 2.6.1 Master Data Tags
('API_TAG_CREATE', 'PATIENT', 'POST',   '/api/patient-tags',       'Tạo mới thẻ bệnh nhân'),
('API_TAG_LIST',   'PATIENT', 'GET',    '/api/patient-tags',       'Danh sách thẻ bệnh nhân'),
('API_TAG_DETAIL', 'PATIENT', 'GET',    '/api/patient-tags/:id',   'Chi tiết thẻ'),
('API_TAG_UPDATE', 'PATIENT', 'PUT',    '/api/patient-tags/:id',   'Cập nhật màu sắc/tên thẻ'),
('API_TAG_DELETE', 'PATIENT', 'DELETE', '/api/patient-tags/:id',   'Xóa mềm thẻ'),

-- 2.6.2 Patient - Tag Assignment (Gắn thẻ trực tiếp trên hồ sơ)
('API_PTAG_ASSIGN', 'PATIENT', 'POST',   '/api/patients/:patientId/tags',         'Gắn thẻ cho bệnh nhân'),
('API_PTAG_LIST',   'PATIENT', 'GET',    '/api/patients/:patientId/tags',         'Tất cả thẻ của bệnh nhân'),
('API_PTAG_REMOVE', 'PATIENT', 'DELETE', '/api/patients/:patientId/tags/:tagId',  'Gỡ bỏ thẻ khỏi bệnh nhân')
ON CONFLICT (method, endpoint) DO NOTHING;


-- ==============================================================================
-- 4. JWT PERMISSIONS & ROLE MAPPING
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TAG_MANAGE',        'TAG_MANAGE',         'PATIENT', 'Quản trị danh mục Thẻ (CRUD Tags)'),
('PERM_TAG_VIEW',          'TAG_VIEW',           'PATIENT', 'Xem danh mục Thẻ'),
('PERM_PAT_TAG_MANAGE',    'PATIENT_TAG_MANAGE', 'PATIENT', 'Gắn và Gỡ thẻ khỏi hồ sơ bệnh nhân'),
('PERM_PAT_TAG_VIEW',      'PATIENT_TAG_VIEW',   'PATIENT', 'Xem thẻ trên hồ sơ bệnh nhân')
ON CONFLICT (code) DO NOTHING;

-- Map cho Role ADMIN / STAFF (Toàn quyền quản trị danh mục và gắn thẻ)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'STAFF')
  AND p.code IN ('TAG_MANAGE', 'TAG_VIEW', 'PATIENT_TAG_MANAGE', 'PATIENT_TAG_VIEW')
ON CONFLICT DO NOTHING;

-- Map cho Bác sĩ & Y tá (Được quyền Xem danh mục Thẻ và thao tác Gắn/Gỡ thẻ cho bệnh nhân)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND p.code IN ('TAG_VIEW', 'PATIENT_TAG_MANAGE', 'PATIENT_TAG_VIEW')
ON CONFLICT DO NOTHING;

-- Map Role -> API Permissions
-- ADMIN & STAFF (Full)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_TAG_CREATE', 'API_TAG_LIST', 'API_TAG_DETAIL', 'API_TAG_UPDATE', 'API_TAG_DELETE',
    'API_PTAG_ASSIGN', 'API_PTAG_LIST', 'API_PTAG_REMOVE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE (Xem tag + Quản lý gắn thẻ)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_TAG_LIST', 'API_TAG_DETAIL', 'API_PTAG_ASSIGN', 'API_PTAG_LIST', 'API_PTAG_REMOVE'
  )
ON CONFLICT DO NOTHING;
