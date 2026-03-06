--Core System & Phân quyền.
--1. Quản lý Người dùng & Hồ sơ (User & Profile)

-- Bảng tài khoản người dùng (Xác thực)
CREATE TABLE users (
    users_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BANNED
    last_login_at TIMESTAMP,
    failed_login_count INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL -- Nguyên tắc Soft Delete
);

-- Partial Indexes for User Soft Delete
CREATE UNIQUE INDEX users_email_key ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX users_phone_number_key ON users (phone_number) WHERE phone_number IS NOT NULL AND deleted_at IS NULL;

-- Bảng hồ sơ người dùng
CREATE TABLE user_profiles (
    user_profiles_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    dob DATE,
    gender VARCHAR(20), -- Chọc sang Master Data (MALE, FEMALE, OTHER)
    identity_card_number VARCHAR(50) UNIQUE, -- CMND/CCCD/Passport
    avatar_url TEXT,
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);


--*******************************************************************
-- QUẢN LÝ BẢO MẬT & PHIÊN ĐĂNG NHẬP (SECURITY & SESSIONS)

CREATE TABLE password_resets (
    password_resets_id VARCHAR(50) PRIMARY KEY,

    user_id VARCHAR(50) NOT NULL,
    reset_token VARCHAR(255) NOT NULL,

    expired_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id)
        REFERENCES users(users_id)
        ON DELETE CASCADE
);


CREATE TABLE user_sessions (
    -- Session ID có ý nghĩa
    user_sessions_id VARCHAR(50) PRIMARY KEY,

    -- Liên kết với người dùng
    user_id VARCHAR(50) NOT NULL
        REFERENCES users(users_id)
        ON DELETE CASCADE,

    -- Hash refresh token
    refresh_token_hash VARCHAR(512) NOT NULL,

    -- Device info (optional)
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Session state
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE account_verifications (
    account_verifications_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    verify_token_hash VARCHAR(255) NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_account_verifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(users_id)
        ON DELETE CASCADE
);

-- Bổ sung Index tối ưu truy vấn Auth/Session
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX idx_user_sessions_user_device ON user_sessions(user_id, device_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_revoked_expired ON user_sessions(revoked_at, expired_at);
CREATE INDEX idx_account_verif_token ON account_verifications(verify_token_hash);
CREATE INDEX idx_account_verif_user_token ON account_verifications(user_id, verify_token_hash);


--2. Quản lý Vai trò & Phân quyền (RBAC - Role-Based Access Control)
-- Bảng Vai trò
CREATE TABLE roles (
    roles_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: ADMIN, DOCTOR, NURSE, PATIENT,..
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- TRUE: Không cho phép admin sửa/xóa
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE / INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Bảng Quyền hạn (Gắn với từng tính năng cụ thể)
CREATE TABLE permissions (
    permissions_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- vd: PATIENT_CREATE, EMR_VIEW
    module VARCHAR(100) NOT NULL, -- vd: PATIENT_MANAGEMENT, EMR
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Bảng N/N: Vai trò - Quyền hạn
CREATE TABLE role_permissions (
    role_id VARCHAR(50) NOT NULL,
    permission_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permissions_id) ON DELETE CASCADE
);

-- Bảng Danh mục Menu hiển thị trên giao diện
CREATE TABLE menus (
    menus_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- vd: DASHBOARD, USER, PATIENT...
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    icon VARCHAR(100),
    parent_id VARCHAR(50), -- Cho phép Menu đa cấp (Nested Menu)
    sort_order INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE / INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(menus_id) ON DELETE SET NULL
);

-- Bảng N/N: Vai trò - Menu hiển thị
CREATE TABLE role_menus (
    role_id VARCHAR(50) NOT NULL,
    menu_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(menus_id) ON DELETE CASCADE
);

-- Bảng Quản lý Danh mục API Endpoint
CREATE TABLE api_permissions (
    api_id VARCHAR(50) PRIMARY KEY,
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, PATCH, DELETE, vv
    endpoint VARCHAR(255) NOT NULL, -- /api/users, /api/patients, vv (Có thể dùng pattern)
    description TEXT,
    module VARCHAR(50), -- e.g. USER_MANAGEMENT, PATIENT_MANAGEMENT
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE / INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(method, endpoint)
);

-- Bảng N/N: Khớp Role với API Permission
CREATE TABLE role_api_permissions (
    role_id VARCHAR(50) NOT NULL,
    api_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, api_id),
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE,
    FOREIGN KEY (api_id) REFERENCES api_permissions(api_id) ON DELETE CASCADE
);

-- Bảng N/N: Người dùng - Vai trò (Một người có thể có nhiều vai trò)
CREATE TABLE user_roles (
    user_id VARCHAR(50) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE
);

--3. Quản lý Danh mục nền (Master Data)
-- Nhóm danh mục
CREATE TABLE master_data_categories (
    master_data_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: ETHNICITY, RELIGION, CITY
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Giá trị chi tiết của danh mục
CREATE TABLE master_data_items (
    master_data_items_id VARCHAR(50) PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL, -- vd: KINH, TAY, NUNG
    value VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_code) REFERENCES master_data_categories(code) ON DELETE CASCADE,
    UNIQUE (category_code, code)
);

--4. Cấu hình hệ thống & Thông báo (Settings & Notifications)

-- Cấu hình hệ thống linh hoạt
CREATE TABLE system_settings (
    system_settings_id VARCHAR(50) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL, -- vd: MAX_APPOINTMENTS_PER_DAY
    setting_value JSON NOT NULL, -- Dùng JSON để lưu cấu hình đa dạng (string, array, object)
    description TEXT,
    updated_by VARCHAR(50) REFERENCES users(users_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mẫu thông báo (Notification Templates)
CREATE TABLE notifications (
    notifications_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50), -- SYSTEM, APPOINTMENT, REMINDER
    reference_id VARCHAR(50), -- ID của lịch hẹn hoặc hồ sơ liên quan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trạng thái thông báo của từng người dùng
CREATE TABLE user_notifications (
    user_notifications_id VARCHAR(50) PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(notifications_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

--5. Nhật ký Hệ thống (Audit & Logging)
CREATE TABLE audit_logs (
    audit_logs_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50), -- Ai thực hiện hành động
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN
    table_name VARCHAR(100) NOT NULL, -- Bảng nào bị thay đổi
    record_id VARCHAR(50) NOT NULL, -- ID của dòng dữ liệu bị tác động
    old_values JSON, -- Dữ liệu trước khi sửa (Lưu dạng JSON)
    new_values JSON, -- Dữ liệu sau khi sửa
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE SET NULL
);


--*******************************************************************
-- QUẢN LÝ BỆNH NHÂN (PATIENT MANAGEMENT)														
-- 1. Hồ sơ Y tế Bệnh nhân cơ sở (Core Patient Data)
-- Bảng Bệnh nhân (Mở rộng từ user_profiles)
CREATE TABLE patients (
    patients_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE, -- Liên kết 1-1 với tài khoản người dùng
    patient_code VARCHAR(50) UNIQUE NOT NULL, -- Mã số bệnh nhân (MRN - Medical Record Number)
    blood_type VARCHAR(5), -- A, B, AB, O
    rhesus_factor VARCHAR(5), -- Rh+, Rh-
    marital_status VARCHAR(50), -- Chọc sang Master Data (SINGLE, MARRIED,...)
    occupation VARCHAR(100), -- Nghề nghiệp (có thể ảnh hưởng đến bệnh lý)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- Bảng Người thân & Liên hệ khẩn cấp (Patient Relations)
CREATE TABLE patient_contacts (
    patient_contacts_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- Cha, Mẹ, Vợ/Chồng, Con...
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    is_emergency_contact BOOLEAN DEFAULT FALSE, -- Cờ đánh dấu liên hệ khẩn cấp
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);

--2. Thông tin Bảo hiểm (Insurance Info)
CREATE TABLE patient_insurances (
    patient_insurances_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    insurance_type VARCHAR(50) NOT NULL, -- STATE (BHYT), PRIVATE (BH Tư nhân)
    provider_name VARCHAR(255) NOT NULL, -- Tên công ty BH (Bảo Việt, Generali...)
    insurance_number VARCHAR(100) NOT NULL UNIQUE, -- Số thẻ bảo hiểm
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_percent INT, -- Mức hưởng (vd: 80, 95, 100)
    is_primary BOOLEAN DEFAULT TRUE, -- Thẻ chính/phụ nếu có nhiều thẻ
    document_url TEXT, -- Link ảnh chụp thẻ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);

--3. Tiền sử Lâm sàng & Yếu tố nguy cơ (Clinical Histories & Allergies)
-- Bảng Tiền sử bệnh lý (Medical History)
CREATE TABLE patient_medical_histories (
    patient_medical_histories_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    condition_code VARCHAR(20), -- Mã ICD-10 (Lấy từ Master Data)
    condition_name VARCHAR(255) NOT NULL, -- Tên bệnh (Tiểu đường type 2, Tăng huyết áp...)
    history_type VARCHAR(50) NOT NULL, -- PERSONAL (Bản thân), FAMILY (Gia đình)
    diagnosis_date DATE, -- Ngày phát hiện bệnh
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE (Đang mắc), RESOLVED (Đã khỏi)
    notes TEXT,
    reported_by VARCHAR(50), -- Bác sĩ ghi nhận hoặc bệnh nhân tự khai
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- Bảng Dị ứng & Tác dụng phụ (Allergies) - Cực kỳ quan trọng khi Kê đơn
CREATE TABLE patient_allergies (
    patient_allergies_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    allergen_type VARCHAR(50), -- DRUG (Thuốc), FOOD (Thức ăn), ENVIRONMENT (Môi trường)
    allergen_name VARCHAR(255) NOT NULL, -- Tên tác nhân (Penicillin, Hải sản...)
    reaction TEXT, -- Biểu hiện (Nổi mề đay, khó thở...)
    severity VARCHAR(50), -- Mức độ: MILD (Nhẹ), MODERATE (Vừa), SEVERE (Nghiêm trọng/Sốc phản vệ)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);

--4. Phân loại & Gắn thẻ Bệnh nhân (Tags & Classifications)
-- Bảng danh sách các Thẻ (Tags)
CREATE TABLE tags (
    tags_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: VIP, CHRONIC_CARE, HIGH_RISK
    name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(10) DEFAULT '#000000', -- Màu sắc hiển thị trên UI
    description TEXT
);

-- Bảng liên kết Bệnh nhân - Thẻ
CREATE TABLE patient_tags (
    patient_id VARCHAR(50) NOT NULL,
    tag_id VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(50), -- Ai gắn thẻ này
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_id, tag_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tags_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(users_id) ON DELETE SET NULL
);

--5. Hồ sơ đính kèm (Patient Documents)
CREATE TABLE patient_documents (
    patient_documents_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(50), -- LAB_RESULT, EXTERNAL_EMR, CONSENT_FORM
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- Đường dẫn file trên S3/Cloud Storage
    uploaded_by VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(users_id) ON DELETE SET NULL
);

--*******************************************************************
-- ĐT LỊCH KHÁM (APPOINTMENT MANAGEMENT)

--1. Quản lý Bác sĩ & Phòng khám (Resources)

-- Bảng chuyên khoa (Master Data)
CREATE TABLE specialties (
    specialties_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: CARDIOLOGY, PEDIATRICS
    name VARCHAR(150) NOT NULL,
    description TEXT
);

-- Bảng thông tin chuyên môn của Bác sĩ
CREATE TABLE doctors (
    doctors_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE, -- Liên kết với tài khoản User
    specialty_id VARCHAR(50) NOT NULL,
    title VARCHAR(100), -- Học hàm/Học vị (GS, TS, BS.CKII)
    biography TEXT,
    consultation_fee DECIMAL(12,2), -- Phí khám tiêu chuẩn
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id)
);

-- Bảng Quản lý Phòng khám/Tài nguyên (Clinics & Rooms)
CREATE TABLE clinic_rooms (
    clinic_rooms_id VARCHAR(50) PRIMARY KEY,
    room_code VARCHAR(50) UNIQUE NOT NULL, -- vd: P101, P205
    room_name VARCHAR(100) NOT NULL, -- Tên phòng (Phòng khám nội 1, Phòng X-Quang)
    room_type VARCHAR(50), -- CONSULTATION (Khám), LAB (Xét nghiệm), IMAGING (CĐHA)
    capacity INT DEFAULT 1, -- Sức chứa bệnh nhân cùng lúc
    is_active BOOLEAN DEFAULT TRUE
);

--2. Quản lý Khung giờ & Lịch làm việc (Schedules & Time Slots)

-- Bảng Lịch làm việc tổng quát (Doctor Schedules)
-- Ví dụ: Bác sĩ A làm việc ngày 15/10/2026 tại Phòng 101.
CREATE TABLE doctor_schedules (
    doctor_schedules_id VARCHAR(50) PRIMARY KEY,
    doctor_id VARCHAR(50) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    schedule_date DATE NOT NULL,
    shift_type VARCHAR(50), -- MORNING, AFTERNOON, NIGHT
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, CANCELLED (Bác sĩ nghỉ đột xuất)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES clinic_rooms(clinic_rooms_id),
    UNIQUE (doctor_id, schedule_date, shift_type) -- Một bác sĩ không thể có 2 ca sáng cùng ngày
);

-- Bảng Khung giờ chi tiết (Time Slots)
-- Hệ thống tự động sinh ra các dòng này dựa trên cấu hình (ví dụ mỗi slot 15 phút)
CREATE TABLE schedule_slots (
    schedule_slots_id VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL, -- vd: 08:00
    end_time TIME NOT NULL,   -- vd: 08:15
    max_patients INT DEFAULT 1, -- Số bệnh nhân tối đa cho slot này (Thường là 1)
    booked_patients INT DEFAULT 0, -- Số bệnh nhân đã đặt
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, FULL, LOCKED
    FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(doctor_schedules_id) ON DELETE CASCADE
);

3. Đặt lịch khám Đa kênh (Appointments)

-- Bảng Lịch hẹn khám (Appointments)
CREATE TABLE appointments (
    appointments_id VARCHAR(50) PRIMARY KEY,
    appointment_code VARCHAR(50) UNIQUE NOT NULL, -- Mã tra cứu cho bệnh nhân (vd: APP-20260305-123)
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    slot_id VARCHAR(50) NOT NULL,
    
    -- Booking Đa kênh
    booking_channel VARCHAR(50) NOT NULL, -- APP, WEB, HOTLINE, DIRECT_CLINIC, ZALO
    
    -- Thông tin y tế sơ bộ
    reason_for_visit TEXT, -- Lý do khám/Triệu chứng
    symptoms_notes TEXT,
    
    -- State Machine (Trạng thái)
    status VARCHAR(50) DEFAULT 'PENDING', 
    -- PENDING (Chờ xác nhận), CONFIRMED (Đã chốt), CHECKED_IN (Đã đến viện), 
    -- CANCELLED (Đã hủy), NO_SHOW (Bỏ lịch), COMPLETED (Đã khám xong)
    
    -- Tracking thời gian thực tế
    checked_in_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id),
    FOREIGN KEY (slot_id) REFERENCES schedule_slots(schedule_slots_id)
);

-- Bảng Nhật ký thay đổi lịch khám (Appointment Audit Trail)
-- Đáp ứng yêu cầu 3.10: Theo dõi & audit lịch khám
CREATE TABLE appointment_audit_logs (
    appointment_audit_logs_id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50), -- ID người dùng (Nhân viên tổng đài, hoặc chính bệnh nhân)
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    action_note TEXT, -- Ghi chú (vd: "Bệnh nhân gọi điện xin dời lịch")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(users_id) ON DELETE SET NULL
);

		

--*****************************
--KHÁM BỆNH & HỒ SƠ BỆNH ÁN (EMR)

--1. Bảng Lượt khám / Bệnh án (Encounter Management)
CREATE TABLE encounters (
    encounters_id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50), -- Liên kết với Lịch hẹn (Có thể NULL nếu bệnh nhân cấp cứu/vãng lai)
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    
    encounter_type VARCHAR(50) DEFAULT 'OUTPATIENT', -- OUTPATIENT (Ngoại trú), INPATIENT (Nội trú), EMERGENCY (Cấp cứu), TELEMED (Khám từ xa)
    
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Bắt đầu khám
    end_time TIMESTAMP, -- Kết thúc khám
    
    -- State Machine cho Lượt khám
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', 
    -- IN_PROGRESS (Đang khám), WAITING_FOR_RESULTS (Chờ KQ Xét nghiệm), 
    -- COMPLETED (Hoàn tất khám), CLOSED (Đã đóng hồ sơ/Ký số)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id),
    FOREIGN KEY (room_id) REFERENCES clinic_rooms(clinic_rooms_id)
);

--2. Ghi nhận Khám Lâm sàng & Sinh hiệu (Clinical Examination & Vital Signs)
CREATE TABLE clinical_examinations (
    clinical_examinations_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE, -- Mỗi lượt khám có 1 phiếu khám lâm sàng
    
    -- 1. Sinh hiệu (Vital Signs - Thường do điều dưỡng đo trước)
    pulse INT, -- Nhịp tim (bpm)
    blood_pressure_systolic INT, -- Huyết áp tâm thu
    blood_pressure_diastolic INT, -- Huyết áp tâm trương
    temperature DECIMAL(4,2), -- Nhiệt độ (Độ C)
    respiratory_rate INT, -- Nhịp thở (lần/phút)
    spo2 INT, -- Nồng độ Oxy máu (%)
    weight DECIMAL(5,2), -- Cân nặng (kg)
    height DECIMAL(5,2), -- Chiều cao (cm)
    bmi DECIMAL(4,2), -- Chỉ số khối cơ thể (Có thể auto-calc ở Frontend/Backend)
    
    -- 2. Khám lâm sàng (Bác sĩ ghi nhận)
    chief_complaint TEXT, -- Lý do vào viện (vd: Đau bụng từng cơn)
    medical_history_notes TEXT, -- Bệnh sử (Diễn biến bệnh từ lúc bắt đầu)
    physical_examination TEXT, -- Khám thực thể (Nhìn, sờ, gõ, nghe)
    
    recorded_by VARCHAR(50), -- Ai là người nhập thông tin này (Điều dưỡng/Bác sĩ)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(users_id)
);

--3. Chẩn đoán Y khoa (Diagnosis Management)

CREATE TABLE encounter_diagnoses (
    encounter_diagnoses_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL,
    icd10_code VARCHAR(20) NOT NULL, -- Mã ICD-10 (Lấy từ bảng Master Data ICD-10)
    diagnosis_name VARCHAR(255) NOT NULL, -- Tên bệnh (Theo ICD-10 hoặc bác sĩ gõ thêm chi tiết)
    
    diagnosis_type VARCHAR(50) DEFAULT 'PRIMARY', 
    -- PRIMARY (Chẩn đoán chính), SECONDARY (Bệnh kèm theo), 
    -- PRELIMINARY (Chẩn đoán sơ bộ ban đầu), FINAL (Chẩn đoán xác định sau khi có XN)
    
    notes TEXT, -- Ghi chú thêm của bác sĩ
    diagnosed_by VARCHAR(50) NOT NULL, -- Bác sĩ nào chẩn đoán
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (diagnosed_by) REFERENCES users(users_id)
);

--4. Chỉ định Dịch vụ Cận lâm sàng (Medical Orders / Lab & Imaging)

-- Bảng Lệnh chỉ định (Medical Orders)
CREATE TABLE medical_orders (
    medical_orders_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(50) NOT NULL, -- Mã dịch vụ (vd: XN-MAU-01, SA-BUNG) -> Lấy từ bảng Danh mục Dịch vụ (Phase 9)
    service_name VARCHAR(255) NOT NULL,
    
    clinical_indicator TEXT, -- Chỉ định lâm sàng (Lý do cần chụp/xét nghiệm)
    priority VARCHAR(50) DEFAULT 'ROUTINE', -- ROUTINE (Thường), URGENT (Khẩn cấp/Cấp cứu)
    
    status VARCHAR(50) DEFAULT 'PENDING', 
    -- PENDING (Chờ thanh toán/Thực hiện), IN_PROGRESS (Đang làm XN), 
    -- COMPLETED (Đã có kết quả), CANCELLED (Đã hủy)
    
    ordered_by VARCHAR(50) NOT NULL, -- Bác sĩ chỉ định
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (ordered_by) REFERENCES users(users_id)
);

-- Bảng Kết quả Cận lâm sàng (Order Results)
CREATE TABLE medical_order_results (
    medical_order_results_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    result_summary TEXT, -- Kết luận tóm tắt (vd: "Gan nhiễm mỡ độ 1")
    result_details JSON, -- Dữ liệu chi tiết dạng JSON (vd: {"RBC": 4.5, "WBC": 7.2} cho xét nghiệm máu)
    attachment_urls JSON, -- Mảng chứa link ảnh X-Quang, Siêu âm, file PDF kết quả
    
    performed_by VARCHAR(50), -- Bác sĩ/Kỹ thuật viên thực hiện
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES medical_orders(medical_orders_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(users_id)
);

--5. Ký số & Khóa Bệnh án (Medical Sign-off)

CREATE TABLE emr_signatures (
    emr_signatures_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE,
    signed_by VARCHAR(50) NOT NULL, -- Tài khoản bác sĩ
    
    -- Lưu trữ bằng chứng ký số (Digital Signature Proof)
    signature_hash VARCHAR(255) NOT NULL, -- Chuỗi mã hóa nội dung hồ sơ tại thời điểm ký
    certificate_serial VARCHAR(100), -- Số serial của chứng thư số (USB Token / SmartCA)
    
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45),
    
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (signed_by) REFERENCES users(users_id)
);




--*******************************************************************
--KÊ ĐƠN & QUẢN LÝ THUỐC


--1. Danh mục Thuốc & Dữ liệu chuẩn (Master Drug Data)
-- Bảng Phân nhóm thuốc (Drug Categories)
CREATE TABLE drug_categories (
    drug_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: KS (Kháng sinh), DGD (Giảm đau)
    name VARCHAR(150) NOT NULL,
    description TEXT
);

-- Bảng Danh mục Thuốc (Master Drugs)
CREATE TABLE drugs (
    drugs_id VARCHAR(50) PRIMARY KEY,
    drug_code VARCHAR(50) UNIQUE NOT NULL, -- Mã thuốc nội bộ
    national_drug_code VARCHAR(100), -- Mã thuốc Quốc gia (DQG)
    
    brand_name VARCHAR(255) NOT NULL, -- Tên thương mại (vd: Panadol Extra)
    active_ingredients TEXT NOT NULL, -- Hoạt chất chính (vd: Paracetamol 500mg, Caffeine 65mg)
    
    category_id VARCHAR(50) REFERENCES drug_categories(drug_categories_id),
    
    route_of_administration VARCHAR(50), -- Đường dùng: ORAL (Uống), INJECTION (Tiêm), TOPICAL (Bôi)
    dispensing_unit VARCHAR(20) NOT NULL, -- Đơn vị cấp phát (Viên, Lọ, Tuýp)
    
    is_prescription_only BOOLEAN DEFAULT TRUE, -- Thuốc kê đơn (ETC) hay không kê đơn (OTC)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--2. Kê đơn thuốc điện tử (E-Prescription)
-- Bảng Đơn thuốc (Prescription Header)
CREATE TABLE prescriptions (
    prescriptions_id VARCHAR(50) PRIMARY KEY,
    prescription_code VARCHAR(50) UNIQUE NOT NULL, -- Mã đơn thuốc (vd: RX-20260305-001)
    encounter_id VARCHAR(50) NOT NULL UNIQUE, -- 1 Lượt khám thường chốt bằng 1 Đơn thuốc
    doctor_id VARCHAR(50) NOT NULL, -- Bác sĩ kê đơn
    patient_id VARCHAR(50) NOT NULL, 
    
    status VARCHAR(50) DEFAULT 'DRAFT', 
    -- DRAFT (Đang nháp), PRESCRIBED (Đã chốt, gửi xuống nhà thuốc), 
    -- DISPENSED (Đã phát thuốc), CANCELLED (Hủy)
    
    clinical_diagnosis TEXT, -- Lưu lại chẩn đoán cuối cùng tại thời điểm kê đơn
    doctor_notes TEXT, -- Lời dặn dò chung (vd: Uống nhiều nước, kiêng đồ biển)
    
    prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(users_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id)
);

-- Bảng Chi tiết Đơn thuốc (Prescription Details)
CREATE TABLE prescription_details (
    prescription_details_id VARCHAR(50) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL,
    drug_id VARCHAR(50) NOT NULL,
    
    quantity INT NOT NULL, -- Số lượng tổng cấp phát (vd: 20 viên)
    dosage VARCHAR(100) NOT NULL, -- Liều lượng 1 lần (vd: 1 viên)
    frequency VARCHAR(100) NOT NULL, -- Tần suất (vd: Sáng 1, Tối 1)
    duration_days INT, -- Số ngày dùng (vd: 10 ngày)
    
    usage_instruction TEXT, -- Hướng dẫn cụ thể (vd: Uống sau ăn no 30 phút)
    
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescriptions_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id)
);

--3. Quản lý Kho thuốc (Pharmacy Inventory)
-- Bảng Tồn kho (Inventory)
CREATE TABLE pharmacy_inventory (
    pharmacy_inventory_id VARCHAR(50) PRIMARY KEY,
    drug_id VARCHAR(50) NOT NULL,
    
    batch_number VARCHAR(100) NOT NULL, -- Số lô sản xuất
    expiry_date DATE NOT NULL, -- Hạn sử dụng
    
    stock_quantity INT NOT NULL DEFAULT 0, -- Số lượng tồn hiện tại
    unit_cost DECIMAL(12,2), -- Giá vốn nhập vào
    unit_price DECIMAL(12,2), -- Giá bán lẻ
    
    location_bin VARCHAR(50), -- Vị trí trên kệ thuốc (vd: Kệ A-Tầng 2)
    
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id) ON DELETE CASCADE,
    UNIQUE (drug_id, batch_number) -- Mỗi lô của 1 thuốc là duy nhất
);

--4. Cấp phát thuốc (Dispensing Management)
-- Bảng Phiếu xuất/Cấp phát thuốc (Dispensing Header)
CREATE TABLE drug_dispense_orders (
    drug_dispense_orders_id VARCHAR(50) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL UNIQUE, -- Map với Đơn thuốc của bác sĩ
    pharmacist_id VARCHAR(50) NOT NULL, -- Dược sĩ thao tác
    
    status VARCHAR(50) DEFAULT 'COMPLETED', -- PENDING, COMPLETED, PARTIALLY_DISPENSED
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescriptions_id),
    FOREIGN KEY (pharmacist_id) REFERENCES users(users_id)
);

-- Bảng Chi tiết Cấp phát & Trừ kho (Dispense Details)
CREATE TABLE drug_dispense_details (
    drug_dispense_details_id VARCHAR(50) PRIMARY KEY,
    dispense_order_id VARCHAR(50) NOT NULL,
    prescription_detail_id VARCHAR(50) NOT NULL, -- Dòng thuốc tương ứng trong đơn
    inventory_id VARCHAR(50) NOT NULL, -- Lấy từ lô nào trong kho
    
    dispensed_quantity INT NOT NULL, -- Số lượng thực xuất
    
    FOREIGN KEY (dispense_order_id) REFERENCES drug_dispense_orders(drug_dispense_orders_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_detail_id) REFERENCES prescription_details(prescription_details_id),
    FOREIGN KEY (inventory_id) REFERENCES pharmacy_inventory(pharmacy_inventory_id)
);





--*******************************************************************
--HỒ SƠ SỨC KHỎE ĐIỆN TỬ

--1. Dòng thời gian sức khỏe (Health Timeline Events)
CREATE TABLE health_timeline_events (
    health_timeline_events_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    
    event_date TIMESTAMP NOT NULL, -- Ngày giờ xảy ra sự kiện
    
    event_type VARCHAR(50) NOT NULL, 
    -- Các loại sự kiện: ENCOUNTER (Khám bệnh), LAB_RESULT (Kết quả XN), 
    -- PRESCRIPTION (Đơn thuốc), VACCINATION (Tiêm chủng), SURGERY (Phẫu thuật)
    
    title VARCHAR(255) NOT NULL, -- Tiêu đề hiển thị (vd: "Khám chuyên khoa Tim mạch")
    summary TEXT, -- Trích yếu nội dung (vd: "Chẩn đoán: Tăng huyết áp vô căn. Kê 2 loại thuốc.")
    
    reference_id VARCHAR(50), -- ID trỏ về bảng gốc (encounters.id, prescriptions.id...) để xem chi tiết
    reference_table VARCHAR(50), -- Tên bảng gốc (vd: 'encounters')
    
    source_system VARCHAR(100) DEFAULT 'INTERNAL_HIS', -- Nguồn dữ liệu (Nội bộ, Apple Health, BV Chợ Rẫy...)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);

-- Tạo Index để tăng tốc độ truy vấn Timeline theo thời gian
CREATE INDEX idx_timeline_patient_date ON health_timeline_events(patient_id, event_date DESC);

2. Chỉ số sức khỏe liên tục (Continuous Health Metrics)
CREATE TABLE patient_health_metrics (
    patient_health_metrics_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    
    metric_code VARCHAR(50) NOT NULL, -- BLOOD_PRESSURE, BLOOD_SUGAR, HEART_RATE, WEIGHT
    metric_name VARCHAR(100) NOT NULL, 
    
    -- Dùng JSON để linh hoạt lưu nhiều giá trị. 
    -- Vd Huyết áp có 2 số: {"systolic": 120, "diastolic": 80}
    -- Vd Cân nặng có 1 số: {"value": 65}
    metric_value JSON NOT NULL, 
    unit VARCHAR(20) NOT NULL, -- mmHg, mg/dL, bpm, kg
    
    measured_at TIMESTAMP NOT NULL, -- Thời điểm đo thực tế
    
    source_type VARCHAR(50) DEFAULT 'SELF_REPORTED', -- Tự nhập, CLINIC (Phòng khám), DEVICE (Thiết bị)
    device_info VARCHAR(255), -- vd: "Apple Watch Series 9"
    
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);

--3. Đồng bộ dữ liệu bên ngoài (Health Data Integration)
CREATE TABLE external_health_records (
    external_health_records_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    
    provider_name VARCHAR(255) NOT NULL, -- Tên đối tác (Cổng dữ liệu BYT, Bệnh viện X...)
    integration_protocol VARCHAR(50), -- REST_API, HL7_FHIR, SOAP
    
    data_type VARCHAR(50), -- VACCINE_CERT, LAB_HISTORY
    raw_payload JSONB NOT NULL, -- Lưu trữ toàn bộ cục data JSON nguyên bản để đối chiếu
    
    sync_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);

--4. Quyền truy cập & Chia sẻ hồ sơ (EHR Access Control)
CREATE TABLE ehr_access_grants (
    ehr_access_grants_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    granted_to_user_id VARCHAR(50) NOT NULL, -- Cấp quyền cho Bác sĩ/Người thân nào đó (Link tới bảng users)
    
    access_level VARCHAR(50) DEFAULT 'READ_ONLY', -- READ_ONLY, FULL_ACCESS
    
    -- Granular control: Cho phép xem những gì? (Nếu mảng rỗng thì mặc định xem hết)
    allowed_modules JSON, -- vd: ["LAB_RESULTS", "PRESCRIPTIONS"], không cho xem "PSYCHIATRIC_NOTES"
    
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP, -- Có thể NULL (Vĩnh viễn) hoặc có thời hạn (vd: 7 ngày)
    
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, REVOKED (Đã thu hồi quyền)
    granted_by VARCHAR(50), -- Do ai cấp quyền (Thường là chính bệnh nhân hoặc admin)
    
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE,
    FOREIGN KEY (granted_to_user_id) REFERENCES users(users_id) ON DELETE CASCADE
);




-------------------------------------
--TƯ VẤN & KHÁM TỪ XA
--1. Quản lý Phòng khám trực tuyến (Virtual Consultation Room)
CREATE TABLE tele_consultations (
    tele_consultations_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE, -- Liên kết 1-1 với Lượt khám (Phase 4)
    
    -- Thông tin nền tảng Video Call
    platform VARCHAR(50) DEFAULT 'AGORA', -- Tên nền tảng (ZOOM, AGORA, STRINGEE...)
    meeting_id VARCHAR(100), -- ID phòng họp do bên thứ 3 cấp
    meeting_password VARCHAR(100), -- Mật khẩu phòng (nếu có)
    
    -- Link tham gia (Access Links)
    host_url TEXT, -- Link dành cho Bác sĩ (có quyền Host)
    join_url TEXT NOT NULL, -- Link dành cho Bệnh nhân
    
    -- Ghi âm & Lưu trữ (Legal & Audit)
    recording_url TEXT, -- Đường dẫn đến file video ghi hình cuộc gọi (Lưu trên S3/Cloud)
    recording_duration INT, -- Thời lượng gọi thực tế (tính bằng giây)
    
    -- Trạng thái kỹ thuật của cuộc gọi
    call_status VARCHAR(50) DEFAULT 'SCHEDULED', 
    -- SCHEDULED (Đã lên lịch), ONGOING (Đang diễn ra), 
    -- COMPLETED (Đã kết thúc), MISSED (Lỡ cuộc gọi/Bệnh nhân không vào)
    
    actual_start_time TIMESTAMP, -- Thời điểm bác sĩ bấm "Bắt đầu gọi"
    actual_end_time TIMESTAMP, -- Thời điểm kết thúc cuộc gọi
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE
);

--2. Trao đổi thông tin y tế trực tuyến (Chat & Attachments)
CREATE TABLE tele_messages (
    tele_messages_id VARCHAR(50) PRIMARY KEY,
    tele_consultation_id VARCHAR(50) NOT NULL,
    
    sender_id VARCHAR(50) NOT NULL, -- Ai là người gửi (Bác sĩ hay Bệnh nhân)
    sender_type VARCHAR(50), -- DOCTOR, PATIENT, SYSTEM (Tin nhắn tự động của hệ thống)
    
    message_type VARCHAR(50) DEFAULT 'TEXT', -- TEXT, IMAGE, FILE_PDF, SYSTEM_ALERT
    content TEXT, -- Nội dung tin nhắn text
    file_url TEXT, -- Đường dẫn nếu là file đính kèm
    
    is_read BOOLEAN DEFAULT FALSE, -- Cờ đánh dấu đã đọc
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- Index để tối ưu việc load lịch sử chat theo thứ tự thời gian
CREATE INDEX idx_tele_messages_time ON tele_messages(tele_consultation_id, sent_at ASC);

--3. Đánh giá chất lượng dịch vụ (Service Rating)
CREATE TABLE tele_feedbacks (
    tele_feedbacks_id VARCHAR(50) PRIMARY KEY,
    tele_consultation_id VARCHAR(50) NOT NULL UNIQUE,
    patient_id VARCHAR(50) NOT NULL,
    
    -- Đánh giá chuyên môn bác sĩ
    doctor_rating INT CHECK (doctor_rating >= 1 AND doctor_rating <= 5), 
    doctor_feedback TEXT,
    
    -- Đánh giá kỹ thuật (Chất lượng video/âm thanh)
    tech_rating INT CHECK (tech_rating >= 1 AND tech_rating <= 5),
    tech_feedback TEXT, -- Vd: "Hình ảnh bị mờ", "Không nghe tiếng bác sĩ"
    tech_issues_tags JSON, -- Vd: ["AUDIO_ISSUE", "DISCONNECTED"]
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE
);



-----------------------------------
--THANH TOÁN & THU NGÂN


--1. Quản lý Danh mục Dịch vụ & Bảng giá (Services & Pricing)
-- Nhóm dịch vụ (vd: Khám bệnh, Chẩn đoán hình ảnh, Xét nghiệm)
CREATE TABLE service_categories (
    service_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Danh mục Dịch vụ & Giá chuẩn
CREATE TABLE services (
    services_id VARCHAR(50) PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL, -- vd: SA-BUNG-01 (Siêu âm bụng)
    category_id VARCHAR(50) REFERENCES service_categories(service_categories_id),
    
    name VARCHAR(255) NOT NULL,
    standard_price DECIMAL(12,2) NOT NULL, -- Giá niêm yết
    insurance_covered_price DECIMAL(12,2) DEFAULT 0, -- Mức giá tối đa BHYT chi trả
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quản lý Ưu đãi/Khuyến mãi (Discounts & Promotions)
CREATE TABLE promotions (
    promotions_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: TET2026, KHAM_LAN_DAU
    name VARCHAR(150) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- PERCENTAGE (%), FIXED_AMOUNT (VNĐ)
    discount_value DECIMAL(12,2) NOT NULL,
    
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

--2. Quản lý Hóa đơn & Chi tiết thu phí (Invoices & Line Items)
-- Hóa đơn tổng (Invoices)
CREATE TABLE invoices (
    invoices_id VARCHAR(50) PRIMARY KEY,
    invoice_code VARCHAR(50) UNIQUE NOT NULL, -- vd: INV-20260305-999
    patient_id VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50), -- Thường sẽ map với Encounter, có thể NULL nếu khách chỉ mua thuốc ở quầy
    
    -- Các cột tính toán dòng tiền
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- Tổng tiền gốc
    discount_amount DECIMAL(12,2) DEFAULT 0, -- Tiền được giảm giá (áp dụng promotion)
    insurance_amount DECIMAL(12,2) DEFAULT 0, -- Tiền bảo hiểm chi trả
    net_amount DECIMAL(12,2) NOT NULL, -- Tiền thực tế bệnh nhân phải trả (Total - Discount - Insurance)
    paid_amount DECIMAL(12,2) DEFAULT 0, -- Tiền đã thanh toán thực tế
    
    status VARCHAR(50) DEFAULT 'UNPAID', 
    -- UNPAID (Chưa thanh toán), PARTIAL (Thanh toán 1 phần), PAID (Đã thanh toán đủ), CANCELLED (Hủy)
    
    created_by VARCHAR(50), -- Thường là hệ thống auto-generate hoặc Thu ngân tạo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patients_id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE SET NULL
);

-- Chi tiết Hóa đơn (Invoice Details - Móc nối toàn bộ hệ thống)
CREATE TABLE invoice_details (
    invoice_details_id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    
    -- Reference để biết dòng thu tiền này đến từ đâu
    reference_type VARCHAR(50) NOT NULL, -- CONSULTATION (Khám), LAB_ORDER (Xét nghiệm), DRUG (Thuốc)
    reference_id VARCHAR(50) NOT NULL, -- ID trỏ về bảng appointments, medical_orders, hoặc prescription_details
    
    item_name VARCHAR(255) NOT NULL, -- Lưu lại tên dịch vụ/thuốc tại thời điểm tạo để chống thay đổi quá khứ
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL, -- quantity * unit_price
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id) ON DELETE CASCADE
);

--3. Giao dịch Thanh toán, Hoàn tiền & Thu ngân (Payments, Refunds & Cashier Shifts)
-- Giao dịch Thanh toán & Hoàn tiền (Payment Transactions)
CREATE TABLE payment_transactions (
    payment_transactions_id VARCHAR(50) PRIMARY KEY,
    transaction_code VARCHAR(100) UNIQUE NOT NULL, -- Mã GD duy nhất
    invoice_id VARCHAR(50) NOT NULL,
    
    transaction_type VARCHAR(50) DEFAULT 'PAYMENT', -- PAYMENT (Thanh toán vào), REFUND (Hoàn tiền ra)
    payment_method VARCHAR(50) NOT NULL, -- CASH, CREDIT_CARD, VNPAY, MOMO, BANK_TRANSFER
    
    amount DECIMAL(12,2) NOT NULL,
    
    -- Dành cho thanh toán Online (Ví điện tử/Cổng thanh toán)
    gateway_transaction_id VARCHAR(255), -- Mã GD trả về từ VNPay/Momo
    gateway_response JSON, -- Lưu log JSON gốc từ cổng thanh toán để đối soát
    
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, REFUNDED
    
    cashier_id VARCHAR(50), -- Thu ngân nào thực hiện thu tiền (Nếu là Offline)
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (cashier_id) REFERENCES users(users_id)
);

-- Quản lý Ca làm việc của Thu ngân (Cashier Shifts)
-- Đảm bảo tiền trong két sắt (Cash Drawer) khớp với hệ thống cuối ngày
CREATE TABLE cashier_shifts (
    cashier_shifts_id VARCHAR(50) PRIMARY KEY,
    cashier_id VARCHAR(50) NOT NULL,
    
    shift_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shift_end TIMESTAMP,
    
    opening_balance DECIMAL(12,2) NOT NULL, -- Tiền lẻ đầu ca trong két
    system_calculated_balance DECIMAL(12,2) DEFAULT 0, -- Tiền hệ thống tính toán (Opening + Cash Payments - Cash Refunds)
    actual_closing_balance DECIMAL(12,2), -- Tiền thu ngân đếm thực tế cuối ca
    
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN (Đang trong ca), CLOSED (Đã chốt ca), DISCREPANCY (Có sai lệch)
    notes TEXT, -- Giải trình nếu tiền thực tế và hệ thống bị lệch
    
    FOREIGN KEY (cashier_id) REFERENCES users(users_id)
);

--*******************************************************************
-- 6. QUẢN LÝ CƠ SỞ Y TẾ (FACILITY MANAGEMENT - MULTI-CLINIC)

-- 6.1 Cơ sở y tế (Healthcare Facilities) - Bảng gốc (Root)
CREATE TABLE facilities (
    facilities_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã cơ sở (vd: EHEALTH_HCM)
    name VARCHAR(255) NOT NULL, -- Tên cơ sở chính
    tax_code VARCHAR(50), -- Mã số thuế
    email VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(255),
    logo_url TEXT,
    headquarters_address TEXT, -- Địa chỉ trụ sở chính
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng giờ hoạt động của cơ sở (Operation Hours)
CREATE TABLE facility_operation_hours (
    operation_hours_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL, -- 0 (Chủ nhật) -> 6 (Thứ 7)
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE, -- Đánh dấu ngày nghỉ bán thời gian hoặc toàn thời gian
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    UNIQUE(facility_id, day_of_week)
);

-- 6.2 Quản lý chi nhánh (Branches) thuộc Cơ sở y tế
CREATE TABLE branches (
    branches_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã chi nhánh (vd: CN01_HCM)
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, UNDER_MAINTENANCE
    established_date DATE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE
);

-- 6.3 Quản lý phòng ban / chuyên khoa (Departments)
CREATE TABLE departments (
    departments_id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL, -- Mã khoa (vd: KHOA_NOI)
    name VARCHAR(255) NOT NULL, -- Khoa Nội, Khoa Nhi
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    UNIQUE(branch_id, code) -- Trong 1 chi nhánh không trùng mã khoa
);

-- 6.4 Quản lý phòng khám / phòng chức năng (Medical Rooms)
CREATE TABLE medical_rooms (
    medical_rooms_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL, -- Mã phòng (vd: P101)
    name VARCHAR(100) NOT NULL, -- Tên phòng (Phòng Nội 1)
    room_type VARCHAR(50), -- CONSULTATION (Khám), LAB (Xét nghiệm), IMAGING (CĐHA), OPERATING (Phẫu thuật)
    capacity INT DEFAULT 1, -- Số lượng bệnh nhân có thể phục vụ cùng lúc
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, INACTIVE
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE CASCADE,
    UNIQUE(department_id, code) 
);

-- 6.5 Quản lý nhân sự y tế (Gắn Staff vào Chi nhánh/Khoa)
CREATE TABLE user_branch_dept (
    user_branch_dept_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL, -- Liên kết accounts/users
    branch_id VARCHAR(50) NOT NULL,
    department_id VARCHAR(50), -- Có thể nhân sự thuộc khối back-office chi nhánh, không thuộc khoa
    role_title VARCHAR(100), -- VD: Trưởng khoa, Bác sĩ điều trị, Y tá trưởng
    status VARCHAR(50) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE SET NULL,
    UNIQUE(user_id, branch_id) -- 1 Staff chỉ gán 1 lần tại 1 chi nhánh
);

-- Quản lý bằng cấp, chứng chỉ hành nghề của nhân sự (Licenses)
CREATE TABLE user_licenses (
    licenses_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    license_type VARCHAR(100) NOT NULL, -- Chứng chỉ hành nghề (CCHN), Bằng ĐH...
    license_number VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE, -- Cảnh báo hết hạn dựa vào cột này
    issued_by VARCHAR(255), -- Nơi cấp (vd: Sở Y tế TP.HCM)
    document_url TEXT, -- Link ảnh chụp/PDF bằng cấp
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- 6.6 Quản lý lịch làm việc linh hoạt (Staff Schedules)
CREATE TABLE staff_schedules (
    staff_schedules_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    medical_room_id VARCHAR(50) NOT NULL, -- Lịch làm việc tại phòng cụ thể
    working_date DATE NOT NULL,
    shift_type VARCHAR(50), -- MORNING, AFTERNOON, EVENING
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_leave BOOLEAN DEFAULT FALSE, -- Cờ báo nghỉ phép/tạm ngưng lịch
    leave_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (medical_room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE CASCADE
);

-- 6.9 Quản lý Danh mục Dịch vụ theo Cơ sở (Medical Services)
CREATE TABLE facility_services (
    facility_services_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    department_id VARCHAR(50), -- Có thể map gán DV vào chuyên khoa cụ thể
    code VARCHAR(50) NOT NULL, -- Mã dịch vụ (vd: XN_MAU)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(15,2) NOT NULL, -- Giá gốc
    insurance_price DECIMAL(15,2), -- Giá BHYT (nếu có)
    vip_price DECIMAL(15,2), -- Giá dịch vụ chất lượng cao
    estimated_duration_minutes INT DEFAULT 15, -- Thời gian định mức (giúp chia slot)
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE SET NULL,
    UNIQUE(facility_id, code)
);

-- 6.10 Quản lý Trang thiết bị Y tế (Assets/Equipment)
CREATE TABLE medical_equipment (
    equipment_id VARCHAR(50) PRIMARY KEY,
    medical_room_id VARCHAR(50), -- Đặt tại phòng nào
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã thiết bị, Barcode
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(150),
    serial_number VARCHAR(100),
    manufacturing_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, BROKEN, RETIRED
    next_maintenance_date DATE,
    FOREIGN KEY (medical_room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE SET NULL
);

-- 6.11 Quản lý Giường bệnh (Bed Management)
CREATE TABLE hospital_beds (
    beds_id VARCHAR(50) PRIMARY KEY,
    medical_room_id VARCHAR(50) NOT NULL, -- Nằm ở phòng nào
    code VARCHAR(10) NOT NULL, -- Số/Mã giường (G01, G02)
    bed_type VARCHAR(50) DEFAULT 'STANDARD', -- STANDARD (Thường), ICU (Hồi sức), EMERGENCY
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, CLEANING, BROKEN
    current_patient_id VARCHAR(50), -- Ai đang nằm
    FOREIGN KEY (medical_room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE CASCADE,
    FOREIGN KEY (current_patient_id) REFERENCES patients(patients_id) ON DELETE SET NULL,
    UNIQUE(medical_room_id, code)
);
