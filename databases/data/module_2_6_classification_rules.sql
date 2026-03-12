-- =========================================================================
-- MODULE 2.6.4 & 2.6.5: LỌC VÀ TỰ ĐỘNG GẮN THẺ BỆNH NHÂN (CLASSIFICATION RULES)
-- Tạo bảng quản lý luật (rules) phân loại
-- =========================================================================

-- ==============================================================================
-- 1. BẢNG DANH MỤC LUẬT PHÂN LOẠI (PATIENT_CLASSIFICATION_RULES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patient_classification_rules (
    rule_id VARCHAR(50) PRIMARY KEY, -- Form: RUL_YYMMDD_8char
    name VARCHAR(150) NOT NULL, -- vd: "Thành viên VIP (Khám > 10 lần)", "Nguy cơ cao - Tiểu đường"
    criteria_type VARCHAR(50) NOT NULL, -- Enum: VISIT_COUNT (Số lần khám), DIAGNOSIS (Chẩn đoán), TOTAL_SPEND (Tổng chi tiêu)
    criteria_operator VARCHAR(10) NOT NULL, -- Enum: >, <, =, >=, <=, IN
    criteria_value VARCHAR(255) NOT NULL, -- Giá trị: vd '10', 'E11.9', '5000000'
    target_tag_id VARCHAR(50) NOT NULL REFERENCES tags(tags_id) ON DELETE CASCADE, -- Thẻ sẽ được gắn
    timeframe_days INT DEFAULT NULL, -- Khung thời gian xét duyệt (null = all time)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_rules_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rules_updated_at ON patient_classification_rules;
CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON patient_classification_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_rules_updated_at_column();

-- SEED DATA (Một số luật cơ bản)
-- Lưu ý: target_tag_id lấy các mã được gen ngẫu nhiên từ file trước, nếu chạy seed này cần đổi UUID thực tế
-- Khuyến nghị dùng giao diện Admin tạo Rule để đảm bảo target_tag_id chuẩn, nhưng đây là cấu trúc mẫu:

-- INSERT INTO patient_classification_rules (rule_id, name, criteria_type, criteria_operator, criteria_value, target_tag_id, timeframe_days)
-- VALUES
-- ('RUL_260312_1a2b3c4d', 'Auto VIP (>10 lần/năm)', 'VISIT_COUNT', '>=', '10', (SELECT tags_id FROM tags WHERE code='VIP'), 365),
-- ('RUL_260312_5e6f7g8h', 'Bệnh tiểu đường', 'DIAGNOSIS', '=', 'E11.9', (SELECT tags_id FROM tags WHERE code='HIGH_RISK'), NULL);


-- ==============================================================================
-- 2. ĐĂNG KÝ API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- 2.6.4 Patient Tag Filtering
('API_PATIENT_FILTER_TAG', 'PATIENT', 'GET', '/api/patients/filter-by-tags', 'Lọc danh sách bệnh nhân theo danh mục thẻ'),

-- 2.6.5 Rule-based Auto Tagging CRUD
('API_RULE_CREATE', 'PATIENT', 'POST',   '/api/patient-classification-rules',       'Tạo mới luật phân loại'),
('API_RULE_LIST',   'PATIENT', 'GET',    '/api/patient-classification-rules',       'Danh sách các luật phân loại'),
('API_RULE_DETAIL', 'PATIENT', 'GET',    '/api/patient-classification-rules/:id',   'Chi tiết luật phân loại'),
('API_RULE_UPDATE', 'PATIENT', 'PUT',    '/api/patient-classification-rules/:id',   'Cập nhật luật phân loại'),
('API_RULE_DELETE', 'PATIENT', 'DELETE', '/api/patient-classification-rules/:id',   'Xóa mềm/Vô hiệu hóa luật')
ON CONFLICT (method, endpoint) DO NOTHING;


-- ==============================================================================
-- 3. JWT PERMISSIONS & ROLE MAPPING
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_RULE_MANAGE', 'RULE_MANAGE', 'PATIENT', 'Quản trị cấu hình Rule phân loại tự động'),
('PERM_RULE_VIEW',   'RULE_VIEW',   'PATIENT', 'Xem danh sách Rule cấu hình')
ON CONFLICT (code) DO NOTHING;

-- Map cho Role ADMIN / STAFF
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'STAFF')
  AND p.code IN ('RULE_MANAGE', 'RULE_VIEW')
ON CONFLICT DO NOTHING;

-- Map Role -> API Permissions
-- (Quyền filter-by-tags dùng chung quyền PATIENT_VIEW có sẵn từ trước, nên chỉ map API_ID)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF', 'DOCTOR', 'NURSE')
  AND a.api_id IN ('API_PATIENT_FILTER_TAG')
ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_RULE_CREATE', 'API_RULE_LIST', 'API_RULE_DETAIL', 'API_RULE_UPDATE', 'API_RULE_DELETE'
  )
ON CONFLICT DO NOTHING;
