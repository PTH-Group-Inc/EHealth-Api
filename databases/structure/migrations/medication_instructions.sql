-- =====================================================================
-- MODULE 5.8: QUẢN LÝ HƯỚNG DẪN SỬ DỤNG THUỐC (MEDICATION INSTRUCTIONS)
-- =====================================================================

-- 1. Mẫu hướng dẫn (templates chuẩn hóa)
CREATE TABLE IF NOT EXISTS medication_instruction_templates (
    template_id    VARCHAR(50) PRIMARY KEY,
    type           VARCHAR(20) NOT NULL,
    label          VARCHAR(255) NOT NULL,
    value          VARCHAR(255) NOT NULL,
    sort_order     INT DEFAULT 0,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, value)
);

-- 2. Hướng dẫn mặc định theo thuốc
CREATE TABLE IF NOT EXISTS drug_default_instructions (
    default_instruction_id VARCHAR(50) PRIMARY KEY,
    drug_id               VARCHAR(50) NOT NULL,
    default_dosage        VARCHAR(100),
    default_frequency     VARCHAR(100),
    default_duration_days INT,
    default_route         VARCHAR(50),
    default_instruction   TEXT,
    notes                 TEXT,
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id) ON DELETE CASCADE,
    UNIQUE(drug_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_med_templates_type ON medication_instruction_templates(type);
CREATE INDEX IF NOT EXISTS idx_drug_defaults_drug ON drug_default_instructions(drug_id);

-- ==============================================================================
-- SEED DATA — Dữ liệu mẫu chuẩn hóa
-- ==============================================================================

-- DOSAGE (liều lượng phổ biến)
INSERT INTO medication_instruction_templates (template_id, type, label, value, sort_order) VALUES
('MIT_DOS_001', 'DOSAGE', '1 viên', '1 viên', 1),
('MIT_DOS_002', 'DOSAGE', '2 viên', '2 viên', 2),
('MIT_DOS_003', 'DOSAGE', '5mg', '5mg', 3),
('MIT_DOS_004', 'DOSAGE', '10mg', '10mg', 4),
('MIT_DOS_005', 'DOSAGE', '25mg', '25mg', 5),
('MIT_DOS_006', 'DOSAGE', '50mg', '50mg', 6),
('MIT_DOS_007', 'DOSAGE', '100mg', '100mg', 7),
('MIT_DOS_008', 'DOSAGE', '250mg', '250mg', 8),
('MIT_DOS_009', 'DOSAGE', '500mg', '500mg', 9),
('MIT_DOS_010', 'DOSAGE', '5ml', '5ml', 10),
('MIT_DOS_011', 'DOSAGE', '10ml', '10ml', 11),
('MIT_DOS_012', 'DOSAGE', '1 gói', '1 gói', 12)
ON CONFLICT DO NOTHING;

-- FREQUENCY (tần suất)
INSERT INTO medication_instruction_templates (template_id, type, label, value, sort_order) VALUES
('MIT_FRQ_001', 'FREQUENCY', '1 lần/ngày', '1 lần/ngày', 1),
('MIT_FRQ_002', 'FREQUENCY', '2 lần/ngày', '2 lần/ngày', 2),
('MIT_FRQ_003', 'FREQUENCY', '3 lần/ngày', '3 lần/ngày', 3),
('MIT_FRQ_004', 'FREQUENCY', '4 lần/ngày', '4 lần/ngày', 4),
('MIT_FRQ_005', 'FREQUENCY', 'Mỗi 6 giờ', 'Mỗi 6 giờ', 5),
('MIT_FRQ_006', 'FREQUENCY', 'Mỗi 8 giờ', 'Mỗi 8 giờ', 6),
('MIT_FRQ_007', 'FREQUENCY', 'Mỗi 12 giờ', 'Mỗi 12 giờ', 7),
('MIT_FRQ_008', 'FREQUENCY', 'Khi cần', 'Khi cần', 8),
('MIT_FRQ_009', 'FREQUENCY', '1 lần/tuần', '1 lần/tuần', 9)
ON CONFLICT DO NOTHING;

-- ROUTE (đường dùng)
INSERT INTO medication_instruction_templates (template_id, type, label, value, sort_order) VALUES
('MIT_RTE_001', 'ROUTE', 'Uống', 'ORAL', 1),
('MIT_RTE_002', 'ROUTE', 'Tiêm tĩnh mạch', 'IV', 2),
('MIT_RTE_003', 'ROUTE', 'Tiêm bắp', 'IM', 3),
('MIT_RTE_004', 'ROUTE', 'Tiêm dưới da', 'SC', 4),
('MIT_RTE_005', 'ROUTE', 'Bôi ngoài da', 'TOPICAL', 5),
('MIT_RTE_006', 'ROUTE', 'Nhỏ mắt', 'OPHTHALMIC', 6),
('MIT_RTE_007', 'ROUTE', 'Nhỏ mũi', 'NASAL', 7),
('MIT_RTE_008', 'ROUTE', 'Đặt hậu môn', 'RECTAL', 8),
('MIT_RTE_009', 'ROUTE', 'Xịt họng', 'INHALATION', 9),
('MIT_RTE_010', 'ROUTE', 'Ngậm dưới lưỡi', 'SUBLINGUAL', 10)
ON CONFLICT DO NOTHING;

-- INSTRUCTION (hướng dẫn đặc biệt)
INSERT INTO medication_instruction_templates (template_id, type, label, value, sort_order) VALUES
('MIT_INS_001', 'INSTRUCTION', 'Uống sau ăn', 'Uống sau ăn', 1),
('MIT_INS_002', 'INSTRUCTION', 'Uống trước ăn 30 phút', 'Uống trước ăn 30 phút', 2),
('MIT_INS_003', 'INSTRUCTION', 'Uống với nhiều nước', 'Uống với nhiều nước', 3),
('MIT_INS_004', 'INSTRUCTION', 'Uống vào buổi sáng', 'Uống vào buổi sáng', 4),
('MIT_INS_005', 'INSTRUCTION', 'Uống trước khi đi ngủ', 'Uống trước khi đi ngủ', 5),
('MIT_INS_006', 'INSTRUCTION', 'Không nhai, nuốt nguyên viên', 'Không nhai, nuốt nguyên viên', 6),
('MIT_INS_007', 'INSTRUCTION', 'Tránh ánh nắng sau khi dùng', 'Tránh ánh nắng sau khi dùng', 7),
('MIT_INS_008', 'INSTRUCTION', 'Không dùng với sữa hoặc antacid', 'Không dùng với sữa hoặc antacid', 8),
('MIT_INS_009', 'INSTRUCTION', 'Lắc đều trước khi dùng', 'Lắc đều trước khi dùng', 9),
('MIT_INS_010', 'INSTRUCTION', 'Bôi lên vùng da bị tổn thương', 'Bôi lên vùng da bị tổn thương', 10)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_MED_INSTR_VIEW',   'MED_INSTRUCTION_VIEW',   'PHARMACY', 'Xem mẫu hướng dẫn và hướng dẫn mặc định thuốc'),
('PERM_MED_INSTR_MANAGE', 'MED_INSTRUCTION_MANAGE', 'PHARMACY', 'Tạo/sửa/xóa mẫu hướng dẫn và hướng dẫn mặc định thuốc')
ON CONFLICT DO NOTHING;

-- ADMIN, PHARMACIST, DOCTOR: full
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code IN ('ADMIN','PHARMACIST','DOCTOR') AND p.code IN ('MED_INSTRUCTION_VIEW','MED_INSTRUCTION_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code = 'MED_INSTRUCTION_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_MIT_LIST',       'PHARMACY', 'GET',    '/api/medication-instructions/templates',         'Danh sách mẫu'),
('API_MIT_CREATE',     'PHARMACY', 'POST',   '/api/medication-instructions/templates',         'Tạo mẫu'),
('API_MIT_UPDATE',     'PHARMACY', 'PATCH',  '/api/medication-instructions/templates/:id',     'Sửa mẫu'),
('API_MIT_DELETE',     'PHARMACY', 'DELETE', '/api/medication-instructions/templates/:id',     'Xóa mẫu'),
('API_DDI_GET',        'PHARMACY', 'GET',    '/api/medication-instructions/drugs/:drugId',     'HĐ mặc định thuốc'),
('API_DDI_UPSERT',     'PHARMACY', 'PUT',    '/api/medication-instructions/drugs/:drugId',     'Tạo/cập nhật HĐ'),
('API_DDI_DELETE',     'PHARMACY', 'DELETE', '/api/medication-instructions/drugs/:drugId',     'Xóa HĐ thuốc'),
('API_DDI_LIST',       'PHARMACY', 'GET',    '/api/medication-instructions/drugs',             'DS thuốc có HĐ')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN, PHARMACIST, DOCTOR: full
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN','PHARMACIST','DOCTOR') AND a.api_id IN (
    'API_MIT_LIST','API_MIT_CREATE','API_MIT_UPDATE','API_MIT_DELETE',
    'API_DDI_GET','API_DDI_UPSERT','API_DDI_DELETE','API_DDI_LIST'
) ON CONFLICT DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'NURSE' AND a.api_id IN ('API_MIT_LIST','API_DDI_GET','API_DDI_LIST')
ON CONFLICT DO NOTHING;
