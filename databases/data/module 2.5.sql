-- =========================================================================
-- MODULE 2.5.3 - 2.5.5: QUẢN LÝ PHIÊN BẢN TÀI LIỆU & PROXY DOWNLOAD
-- Bổ sung schema và permission cho chức năng versioning
-- =========================================================================
-- 1. Bổ sung version_number vào bảng patient_documents
ALTER TABLE patient_documents
ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1;
-- 2. Tạo bảng lưu trữ lịch sử version tài liệu (patient_document_versions)
CREATE TABLE IF NOT EXISTS patient_document_versions (
    version_id VARCHAR(50) PRIMARY KEY, -- Form: DOCV_YYMMDD_8char
    document_id VARCHAR(50) NOT NULL REFERENCES patient_documents(patient_documents_id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_url TEXT NOT NULL,
    file_format VARCHAR(20),
    file_size_bytes BIGINT,
    uploaded_by VARCHAR(50), -- Map ngầm tới users_id
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_patient_document_versions_doc_id ON patient_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_patient_document_versions_ver_num ON patient_document_versions(document_id, version_number);
-- ==============================================================================
-- 3. API PERMISSIONS - Đăng ký API Endpoints mới
-- ==============================================================================
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- 2.5.3 Patient-centric document routes
('API_PATIENT_DOC_LIST_NESTED', 'PATIENT', 'GET',  '/api/patients/:patientId/documents', 'DS tài liệu của bệnh nhân'),
('API_PATIENT_DOC_UPLOAD_NESTED','PATIENT','POST', '/api/patients/:patientId/documents', 'Upload tài liệu cho bệnh nhân'),
-- 2.5.4 Document Versioning
('API_PAT_DOC_VERSION_UPLOAD', 'PATIENT', 'POST', '/api/patient-documents/:id/versions', 'Upload phiên bản mới của tài liệu'),
('API_PAT_DOC_VERSION_LIST',   'PATIENT', 'GET',  '/api/patient-documents/:id/versions', 'Danh sách phiên bản tài liệu'),
('API_PAT_DOC_VERSION_DETAIL', 'PATIENT', 'GET',  '/api/patient-documents/:id/versions/:versionId', 'Chi tiết một phiên bản cũ'),
-- 2.5.5 Proxy Download/View
('API_PAT_DOC_INLINE_VIEW',    'PATIENT', 'GET',  '/api/patient-documents/:id/view', 'Xem trực tiếp tài liệu'),
('API_PAT_DOC_DOWNLOAD',       'PATIENT', 'GET',  '/api/patient-documents/:id/download', 'Tải tài liệu (Ép download)')
ON CONFLICT (method, endpoint) DO NOTHING;
-- ==============================================================================
-- 4. ROLE → API PERMISSIONS
-- Chú ý: Chúng ta đã có JWT permissions (PATIENT_DOC_VIEW, PATIENT_DOC_MANAGE) 
-- Map Roles -> API Permissions
-- ==============================================================================
-- ADMIN & STAFF toàn quyền
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_PATIENT_DOC_LIST_NESTED', 'API_PATIENT_DOC_UPLOAD_NESTED', 
    'API_PAT_DOC_VERSION_UPLOAD', 'API_PAT_DOC_VERSION_LIST', 'API_PAT_DOC_VERSION_DETAIL',
    'API_PAT_DOC_INLINE_VIEW', 'API_PAT_DOC_DOWNLOAD'
  )
ON CONFLICT DO NOTHING;
-- DOCTOR & NURSE xem các API list/download + Upload route API_PATIENT_DOC_UPLOAD_NESTED
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_PATIENT_DOC_LIST_NESTED', 'API_PATIENT_DOC_UPLOAD_NESTED',
    'API_PAT_DOC_VERSION_LIST', 'API_PAT_DOC_VERSION_DETAIL',
    'API_PAT_DOC_INLINE_VIEW', 'API_PAT_DOC_DOWNLOAD'
  )
ON CONFLICT DO NOTHING;