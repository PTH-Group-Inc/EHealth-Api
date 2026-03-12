-- =========================================================================
-- MODULE 2.7: TÌM KIẾM & TRA CỨU BỆNH NHÂN — INDEXES TỐI ƯU TỐC ĐỘ
-- =========================================================================

-- Tăng tốc tìm theo tên bệnh nhân (ILIKE full_name)
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients USING btree (full_name);

-- Tăng tốc tìm theo mã bệnh nhân
CREATE INDEX IF NOT EXISTS idx_patients_patient_code ON patients USING btree (patient_code);

-- Tăng tốc tìm theo số điện thoại
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients USING btree (phone_number);

-- Tăng tốc tìm theo CCCD/CMND
CREATE INDEX IF NOT EXISTS idx_patients_id_card ON patients USING btree (id_card_number);

-- Tăng tốc lọc theo ngày sinh (cho age-range filter)
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients USING btree (date_of_birth);

-- Tăng tốc filter kết hợp trạng thái + soft delete (dùng nhiều nhất)
CREATE INDEX IF NOT EXISTS idx_patients_status_deleted ON patients (status, deleted_at);


-- ==============================================================================
-- ĐĂNG KÝ API PERMISSIONS
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_PATIENT_SEARCH',       'PATIENT', 'GET', '/api/patients/search',        'Tìm kiếm nâng cao bệnh nhân (keyword, age, gender, status)'),
('API_PATIENT_QUICK_SEARCH', 'PATIENT', 'GET', '/api/patients/quick-search',  'Tra cứu nhanh bệnh nhân (autocomplete)'),
('API_PATIENT_SUMMARY',      'PATIENT', 'GET', '/api/patients/:id/summary',   'Xem tóm tắt hồ sơ bệnh nhân (tags, bảo hiểm, tiền sử)')
ON CONFLICT (method, endpoint) DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF', 'DOCTOR', 'NURSE')
  AND a.api_id IN ('API_PATIENT_SEARCH', 'API_PATIENT_QUICK_SEARCH', 'API_PATIENT_SUMMARY')
ON CONFLICT DO NOTHING;
