-- =====================================================================
-- MODULE 4.2: Bổ sung cột cho bảng clinical_examinations
-- Mục đích: Hỗ trợ lưu nháp, ghi chú lâm sàng, tiền sử, phân loại mức độ
-- =====================================================================

-- 1. Trạng thái phiếu (hỗ trợ lưu nháp)
ALTER TABLE clinical_examinations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';

-- 2. Ghi chú lâm sàng tự do (BS ghi bất kỳ)
ALTER TABLE clinical_examinations ADD COLUMN IF NOT EXISTS clinical_notes TEXT;

-- 3. Tiền sử liên quan lượt khám này
ALTER TABLE clinical_examinations ADD COLUMN IF NOT EXISTS relevant_history TEXT;

-- 4. Phân loại mức độ bệnh: MILD | MODERATE | SEVERE | CRITICAL
ALTER TABLE clinical_examinations ADD COLUMN IF NOT EXISTS severity_level VARCHAR(20);

-- 5. Đường huyết
ALTER TABLE clinical_examinations ADD COLUMN IF NOT EXISTS blood_glucose DECIMAL(5,2);

-- Index
CREATE INDEX IF NOT EXISTS idx_clinical_exam_encounter ON clinical_examinations(encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_exam_status ON clinical_examinations(status);

-- ==============================================================================
-- API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_CEXAM_CREATE',       'EMR', 'POST',  '/api/clinical-examinations/:encounterId',            'Tạo phiếu khám lâm sàng cho encounter'),
('API_CEXAM_DETAIL',       'EMR', 'GET',   '/api/clinical-examinations/:encounterId',            'Lấy chi tiết phiếu khám lâm sàng'),
('API_CEXAM_UPDATE',       'EMR', 'PATCH', '/api/clinical-examinations/:encounterId',            'Cập nhật phiếu khám lâm sàng'),
('API_CEXAM_VITALS',       'EMR', 'PATCH', '/api/clinical-examinations/:encounterId/vitals',     'Cập nhật riêng sinh hiệu'),
('API_CEXAM_FINALIZE',     'EMR', 'PATCH', '/api/clinical-examinations/:encounterId/finalize',   'Chuyển phiếu khám DRAFT → FINAL'),
('API_CEXAM_BY_PATIENT',   'EMR', 'GET',   '/api/clinical-examinations/by-patient/:patientId',   'Lịch sử khám lâm sàng theo BN'),
('API_CEXAM_SUMMARY',      'EMR', 'GET',   '/api/clinical-examinations/:encounterId/summary',    'Tóm tắt khám lâm sàng')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- ROLE → API PERMISSIONS
-- ==============================================================================

-- ADMIN: full quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN (
    'API_CEXAM_CREATE', 'API_CEXAM_DETAIL', 'API_CEXAM_UPDATE',
    'API_CEXAM_VITALS', 'API_CEXAM_FINALIZE', 'API_CEXAM_BY_PATIENT', 'API_CEXAM_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: tạo + xem + sửa + finalize + lịch sử + tóm tắt
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN (
    'API_CEXAM_CREATE', 'API_CEXAM_DETAIL', 'API_CEXAM_UPDATE',
    'API_CEXAM_VITALS', 'API_CEXAM_FINALIZE', 'API_CEXAM_BY_PATIENT', 'API_CEXAM_SUMMARY'
  )
ON CONFLICT DO NOTHING;

-- NURSE: tạo + xem + sửa vitals + lịch sử (không finalize, không sửa phần khám BS)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN (
    'API_CEXAM_CREATE', 'API_CEXAM_DETAIL', 'API_CEXAM_UPDATE',
    'API_CEXAM_VITALS', 'API_CEXAM_BY_PATIENT'
  )
ON CONFLICT DO NOTHING;

-- STAFF: chỉ xem
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN ('API_CEXAM_DETAIL', 'API_CEXAM_BY_PATIENT')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- JWT PERMISSIONS
-- ==============================================================================
INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_CEXAM_VIEW',   'EMR_CLINICAL_EXAM_VIEW',   'EMR', 'Xem phiếu khám lâm sàng, sinh hiệu'),
    ('PERM_CEXAM_CREATE', 'EMR_CLINICAL_EXAM_CREATE', 'EMR', 'Tạo mới phiếu khám lâm sàng'),
    ('PERM_CEXAM_EDIT',   'EMR_CLINICAL_EXAM_EDIT',   'EMR', 'Cập nhật, finalize phiếu khám lâm sàng')
ON CONFLICT DO NOTHING;

-- ROLE → JWT PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('EMR_CLINICAL_EXAM_VIEW', 'EMR_CLINICAL_EXAM_CREATE', 'EMR_CLINICAL_EXAM_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('EMR_CLINICAL_EXAM_VIEW', 'EMR_CLINICAL_EXAM_CREATE', 'EMR_CLINICAL_EXAM_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'NURSE' AND p.code IN ('EMR_CLINICAL_EXAM_VIEW', 'EMR_CLINICAL_EXAM_CREATE', 'EMR_CLINICAL_EXAM_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN ('EMR_CLINICAL_EXAM_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;
