-- *********************************************************************
-- MODULE 8.2: ĐẶT LỊCH TƯ VẤN & KHÁM TỪ XA
-- (Teleconsultation Booking Management)
-- *********************************************************************

-- =====================================================================
-- 1. tele_booking_sessions — Phiên đặt lịch từ xa
-- =====================================================================
CREATE TABLE IF NOT EXISTS tele_booking_sessions (
    session_id             VARCHAR(50) PRIMARY KEY,
    session_code           VARCHAR(50) UNIQUE NOT NULL,            -- TBS-YYYYMMDD-XXXX
    patient_id             VARCHAR(50) NOT NULL,
    specialty_id           VARCHAR(50) NOT NULL,
    facility_id            VARCHAR(50) NOT NULL,
    -- Liên kết Module 8.1
    type_id                VARCHAR(50) NOT NULL,                   -- Hình thức (VIDEO/AUDIO/CHAT/HYBRID)
    config_id              VARCHAR(50),                            -- Config chuyên khoa (giá, thời lượng)
    -- BS & Lịch
    doctor_id              VARCHAR(50),                            -- BS được chọn/gán
    appointment_id         VARCHAR(50),                            -- Appointment được tạo sau xác nhận
    tele_consultation_id   VARCHAR(50),                            -- Phiên tư vấn được tạo
    invoice_id             VARCHAR(50),                            -- Hóa đơn thanh toán trước
    -- Thông tin lịch
    booking_date           DATE NOT NULL,
    booking_start_time     TIME,
    booking_end_time       TIME,
    duration_minutes       INT DEFAULT 30,
    slot_id                VARCHAR(50),                            -- Slot appointment (nếu dùng)
    shift_id               VARCHAR(50),                            -- Ca khám
    -- Platform & giá
    platform               VARCHAR(50) DEFAULT 'AGORA',
    price_amount           DECIMAL(12,2) DEFAULT 0,
    price_type             VARCHAR(20) DEFAULT 'BASE',             -- BASE, INSURANCE, VIP
    -- Trạng thái
    status                 VARCHAR(30) DEFAULT 'DRAFT',            -- DRAFT, PENDING_PAYMENT, PAYMENT_COMPLETED, CONFIRMED, CANCELLED, EXPIRED
    payment_required       BOOLEAN DEFAULT FALSE,
    payment_status         VARCHAR(30) DEFAULT 'UNPAID',           -- UNPAID, PAID, REFUNDED
    -- Ghi chú
    reason_for_visit       TEXT,
    symptoms_notes         TEXT,
    patient_notes          TEXT,
    cancellation_reason    TEXT,
    cancelled_by           VARCHAR(50),
    cancelled_at           TIMESTAMPTZ,
    confirmed_at           TIMESTAMPTZ,
    confirmed_by           VARCHAR(50),
    expires_at             TIMESTAMPTZ,                            -- Hết hạn chờ thanh toán
    -- Audit
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- FK
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id),
    FOREIGN KEY (type_id) REFERENCES tele_consultation_types(type_id),
    FOREIGN KEY (config_id) REFERENCES tele_type_specialty_config(config_id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE SET NULL,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE SET NULL,
    FOREIGN KEY (slot_id) REFERENCES appointment_slots(slot_id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(users_id),
    FOREIGN KEY (cancelled_by) REFERENCES users(users_id),
    FOREIGN KEY (confirmed_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_tbs_patient ON tele_booking_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_tbs_doctor ON tele_booking_sessions(doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tbs_specialty ON tele_booking_sessions(specialty_id);
CREATE INDEX IF NOT EXISTS idx_tbs_facility ON tele_booking_sessions(facility_id);
CREATE INDEX IF NOT EXISTS idx_tbs_type ON tele_booking_sessions(type_id);
CREATE INDEX IF NOT EXISTS idx_tbs_status ON tele_booking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tbs_date ON tele_booking_sessions(booking_date);
CREATE INDEX IF NOT EXISTS idx_tbs_appointment ON tele_booking_sessions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tbs_code ON tele_booking_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_tbs_expires ON tele_booking_sessions(expires_at) WHERE status = 'PENDING_PAYMENT';

-- =====================================================================
-- 2. ALTER appointments — Bổ sung flag teleconsultation
-- =====================================================================
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS is_teleconsultation BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tele_booking_session_id VARCHAR(50);

DO $$ BEGIN
    ALTER TABLE appointments
        ADD CONSTRAINT fk_apt_tele_booking_session FOREIGN KEY (tele_booking_session_id) REFERENCES tele_booking_sessions(session_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_apt_tele ON appointments(is_teleconsultation) WHERE is_teleconsultation = TRUE;
CREATE INDEX IF NOT EXISTS idx_apt_tele_session ON appointments(tele_booking_session_id) WHERE tele_booking_session_id IS NOT NULL;

-- =====================================================================
-- 3. ALTER tele_consultations — Liên kết ngược booking & appointment
-- =====================================================================
ALTER TABLE tele_consultations
    ADD COLUMN IF NOT EXISTS booking_session_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(50);

DO $$ BEGIN
    ALTER TABLE tele_consultations
        ADD CONSTRAINT fk_tele_booking_session FOREIGN KEY (booking_session_id) REFERENCES tele_booking_sessions(session_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE tele_consultations
        ADD CONSTRAINT fk_tele_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tele_consult_booking ON tele_consultations(booking_session_id) WHERE booking_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tele_consult_appointment ON tele_consultations(appointment_id) WHERE appointment_id IS NOT NULL;

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_TELE_BOOKING_VIEW',     'TELE_BOOKING_VIEW',     'REMOTE_CONSULTATION', 'Xem phiên đặt lịch khám từ xa'),
('PERM_TELE_BOOKING_CREATE',   'TELE_BOOKING_CREATE',   'REMOTE_CONSULTATION', 'Tạo phiên đặt lịch khám từ xa'),
('PERM_TELE_BOOKING_MANAGE',   'TELE_BOOKING_MANAGE',   'REMOTE_CONSULTATION', 'Quản lý, xác nhận, hủy phiên đặt lịch')
ON CONFLICT DO NOTHING;

-- ADMIN: full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'TELE_BOOKING_VIEW','TELE_BOOKING_CREATE','TELE_BOOKING_MANAGE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: xem + xác nhận
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'DOCTOR' AND p.code IN (
    'TELE_BOOKING_VIEW','TELE_BOOKING_MANAGE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PATIENT: tạo + xem lịch sử bản thân
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'PATIENT' AND p.code IN (
    'TELE_BOOKING_VIEW','TELE_BOOKING_CREATE'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Tìm BS & Slot
('API_TELE_BK_DOCTORS',          'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/booking/doctors',                      'DS bác sĩ khả dụng cho đặt lịch từ xa'),
('API_TELE_BK_SLOTS',            'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/booking/slots',                        'DS khung giờ trống'),
('API_TELE_BK_CHECK_DOC',        'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/booking/check-doctor',                 'Kiểm tra availability 1 BS'),
-- Nhóm 2: Đặt lịch
('API_TELE_BK_CREATE',           'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/booking',                              'Tạo phiên đặt lịch'),
('API_TELE_BK_UPDATE',           'REMOTE_CONSULTATION', 'PUT',    '/api/teleconsultation/booking/:sessionId',                   'Cập nhật phiên đặt lịch'),
('API_TELE_BK_CONFIRM',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/booking/:sessionId/confirm',           'Xác nhận phiên → tạo Appointment'),
('API_TELE_BK_CANCEL',           'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/booking/:sessionId/cancel',            'Hủy phiên đặt lịch'),
-- Nhóm 3: Thanh toán
('API_TELE_BK_PAYMENT',          'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/booking/:sessionId/payment',           'Khởi tạo thanh toán trước'),
('API_TELE_BK_PAY_CALLBACK',     'REMOTE_CONSULTATION', 'POST',   '/api/teleconsultation/booking/:sessionId/payment-callback',  'Callback thanh toán thành công'),
-- Nhóm 4: Tra cứu
('API_TELE_BK_DETAIL',           'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/booking/:sessionId',                   'Chi tiết phiên đặt lịch'),
('API_TELE_BK_LIST',             'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/booking',                              'Danh sách phiên đặt lịch'),
('API_TELE_BK_MY',               'REMOTE_CONSULTATION', 'GET',    '/api/teleconsultation/booking/my-bookings',                  'Lịch sử đặt lịch BN')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API: ADMIN (full)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_TELE_BK_DOCTORS','API_TELE_BK_SLOTS','API_TELE_BK_CHECK_DOC',
    'API_TELE_BK_CREATE','API_TELE_BK_UPDATE','API_TELE_BK_CONFIRM','API_TELE_BK_CANCEL',
    'API_TELE_BK_PAYMENT','API_TELE_BK_PAY_CALLBACK',
    'API_TELE_BK_DETAIL','API_TELE_BK_LIST','API_TELE_BK_MY'
) ON CONFLICT DO NOTHING;

-- ROLE → API: DOCTOR
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR' AND a.api_id IN (
    'API_TELE_BK_DOCTORS','API_TELE_BK_SLOTS','API_TELE_BK_CHECK_DOC',
    'API_TELE_BK_CONFIRM','API_TELE_BK_CANCEL',
    'API_TELE_BK_DETAIL','API_TELE_BK_LIST'
) ON CONFLICT DO NOTHING;

-- ROLE → API: PATIENT
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'PATIENT' AND a.api_id IN (
    'API_TELE_BK_DOCTORS','API_TELE_BK_SLOTS','API_TELE_BK_CHECK_DOC',
    'API_TELE_BK_CREATE','API_TELE_BK_UPDATE','API_TELE_BK_CANCEL',
    'API_TELE_BK_PAYMENT',
    'API_TELE_BK_DETAIL','API_TELE_BK_MY'
) ON CONFLICT DO NOTHING;
