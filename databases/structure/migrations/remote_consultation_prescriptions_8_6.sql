-- *********************************************************************
-- MODULE 8.6: KÊ ĐƠN & CHỈ ĐỊNH TỪ XA
-- (Remote Prescriptions & Orders)
-- *********************************************************************

-- =====================================================================
-- 1. tele_prescriptions — Đơn thuốc từ xa (bổ sung cho prescriptions)
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_prescriptions (
    tele_prescription_id         VARCHAR(50) PRIMARY KEY,
    prescription_id              VARCHAR(50) NOT NULL UNIQUE,
    tele_consultation_id         VARCHAR(50) NOT NULL,
    encounter_id                 VARCHAR(50),
    -- Kiểm soát từ xa
    is_remote_prescription       BOOLEAN DEFAULT TRUE,
    remote_restrictions_checked  BOOLEAN DEFAULT FALSE,
    restriction_notes            TEXT,
    -- Gửi đơn cho BN
    delivery_method              VARCHAR(30),                        -- PICKUP, DELIVERY, DIGITAL
    delivery_address             TEXT,
    delivery_phone               VARCHAR(20),
    delivery_notes               TEXT,
    sent_to_patient              BOOLEAN DEFAULT FALSE,
    sent_at                      TIMESTAMPTZ,
    -- Pháp lý
    legal_disclaimer             TEXT,
    doctor_confirmed_identity    BOOLEAN DEFAULT FALSE,
    -- Chỉ định kèm
    has_lab_orders               BOOLEAN DEFAULT FALSE,
    has_referral                 BOOLEAN DEFAULT FALSE,
    referral_notes               TEXT,
    -- Đồng bộ kho
    pharmacy_notes               TEXT,
    stock_checked                BOOLEAN DEFAULT FALSE,
    stock_check_result           JSONB,
    -- Metadata
    created_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescriptions_id) ON DELETE CASCADE,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tp_prescription ON tele_prescriptions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_tp_consultation ON tele_prescriptions(tele_consultation_id);
CREATE INDEX IF NOT EXISTS idx_tp_encounter ON tele_prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_tp_sent ON tele_prescriptions(sent_to_patient) WHERE sent_to_patient = FALSE;

-- =====================================================================
-- 2. tele_drug_restrictions — Danh mục thuốc hạn chế kê từ xa
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_drug_restrictions (
    restriction_id               VARCHAR(50) PRIMARY KEY,
    drug_id                      VARCHAR(50) NOT NULL,
    restriction_type             VARCHAR(50) NOT NULL,               -- BANNED, REQUIRES_IN_PERSON, QUANTITY_LIMITED
    max_quantity                 INT,                                -- Giới hạn SL (nếu QUANTITY_LIMITED)
    reason                       TEXT NOT NULL,
    legal_reference              TEXT,                               -- Tham chiếu văn bản pháp luật
    is_active                    BOOLEAN DEFAULT TRUE,
    created_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id) ON DELETE CASCADE,
    UNIQUE (drug_id)
);

CREATE INDEX IF NOT EXISTS idx_tdr_drug ON tele_drug_restrictions(drug_id);
CREATE INDEX IF NOT EXISTS idx_tdr_active ON tele_drug_restrictions(is_active) WHERE is_active = TRUE;

-- *********************************************************************
-- PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_RX_VIEW',     'TELE_RX_VIEW',     'REMOTE_CONSULTATION', 'Xem đơn thuốc từ xa'),
('PERM_TELE_RX_MANAGE',   'TELE_RX_MANAGE',   'REMOTE_CONSULTATION', 'Kê đơn / chỉ định từ xa'),
('PERM_TELE_RX_RESTRICT', 'TELE_RX_RESTRICT',  'REMOTE_CONSULTATION', 'Quản lý danh mục thuốc hạn chế')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN ('TELE_RX_VIEW','TELE_RX_MANAGE','TELE_RX_RESTRICT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN ('TELE_RX_VIEW','TELE_RX_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT (chỉ xem)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN ('TELE_RX_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Kê đơn
('API_TELE_RX_CREATE',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/prescriptions/:consultationId',                   'Tạo đơn thuốc từ xa'),
('API_TELE_RX_ADD_ITEM',        'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/prescriptions/:consultationId/items',             'Thêm thuốc vào đơn'),
('API_TELE_RX_REMOVE_ITEM',     'REMOTE_CONSULTATION', 'DELETE', '/api/teleconsultation/prescriptions/:consultationId/items/:detailId',   'Xóa thuốc khỏi đơn'),
('API_TELE_RX_PRESCRIBE',       'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/prescriptions/:consultationId/prescribe',         'Chuyển PRESCRIBED'),
('API_TELE_RX_DETAIL',          'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions/:consultationId',                   'Chi tiết đơn'),
-- Gửi & Kiểm soát
('API_TELE_RX_SEND',            'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/prescriptions/:consultationId/send',              'Gửi đơn cho BN'),
('API_TELE_RX_STOCK',           'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions/:consultationId/stock-check',       'Kiểm tra tồn kho'),
('API_TELE_RX_RESTRICTIONS',    'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions/drug-restrictions',                 'DS thuốc hạn chế'),
-- Chỉ định XN & Tái khám
('API_TELE_RX_LAB_CREATE',      'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/prescriptions/:consultationId/lab-orders',        'Chỉ định XN'),
('API_TELE_RX_LAB_LIST',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions/:consultationId/lab-orders',        'DS chỉ định XN'),
('API_TELE_RX_REFERRAL',        'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/prescriptions/:consultationId/referral',          'Chỉ định tái khám'),
-- Tra cứu
('API_TELE_RX_LIST',            'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions',                                   'DS đơn từ xa'),
('API_TELE_RX_PATIENT',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions/patient/:patientId',                'Lịch sử đơn BN'),
('API_TELE_RX_SUMMARY',         'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/prescriptions/:consultationId/summary',           'Tổng kết đơn')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ADMIN → all
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id LIKE 'API_TELE_RX_%'
ON CONFLICT DO NOTHING;

-- DOCTOR
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_RX_CREATE','API_TELE_RX_ADD_ITEM','API_TELE_RX_REMOVE_ITEM',
    'API_TELE_RX_PRESCRIBE','API_TELE_RX_DETAIL','API_TELE_RX_SEND',
    'API_TELE_RX_STOCK','API_TELE_RX_RESTRICTIONS',
    'API_TELE_RX_LAB_CREATE','API_TELE_RX_LAB_LIST','API_TELE_RX_REFERRAL',
    'API_TELE_RX_LIST','API_TELE_RX_PATIENT','API_TELE_RX_SUMMARY'
) ON CONFLICT DO NOTHING;

-- PATIENT (xem đơn + XN)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_TELE_RX_DETAIL','API_TELE_RX_LAB_LIST','API_TELE_RX_PATIENT'
) ON CONFLICT DO NOTHING;
