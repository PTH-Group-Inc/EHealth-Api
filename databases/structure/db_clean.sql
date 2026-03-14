-- *********************************************************************
-- MODULE 1: CORE SYSTEM & PHÂN QUYỀN (AUTH, RBAC, SETTINGS)
-- *********************************************************************

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
    deleted_at TIMESTAMP NULL -- Soft Delete
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
    gender VARCHAR(20), -- MALE, FEMALE, OTHER (Master Data)
    identity_card_number VARCHAR(50) UNIQUE, -- CMND/CCCD/Passport
    avatar_url TEXT,
    address TEXT,
    preferences JSONB DEFAULT '{}', -- Cài đặt cá nhân (ngôn ngữ, theme)
    signature_url TEXT, -- Chữ ký số của bác sĩ/nhân viên
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- *********************************************************************
-- QUẢN LÝ BẢO MẬT & PHIÊN ĐĂNG NHẬP (SECURITY & SESSIONS)
-- *********************************************************************

-- Bảng Đặt lại mật khẩu
CREATE TABLE password_resets (
    password_resets_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- Bảng Phiên đăng nhập (Session Management)
CREATE TABLE user_sessions (
    user_sessions_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    refresh_token_hash VARCHAR(512) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- Bảng Xác minh tài khoản (Email verification)
CREATE TABLE account_verifications (
    account_verifications_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    verify_token_hash VARCHAR(255) NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- Index tối ưu truy vấn Auth/Session
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX idx_user_sessions_user_device ON user_sessions(user_id, device_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_account_verif_token ON account_verifications(verify_token_hash);

-- *********************************************************************
-- QUẢN LÝ VAI TRÒ & PHÂN QUYỀN (RBAC)
-- *********************************************************************

-- Bảng Vai trò
CREATE TABLE roles (
    roles_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, DOCTOR, NURSE, PATIENT
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- TRUE: Không cho admin sửa/xóa
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Bảng Quyền hạn
CREATE TABLE permissions (
    permissions_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- PATIENT_CREATE, EMR_VIEW
    module VARCHAR(100) NOT NULL, -- PATIENT_MANAGEMENT, EMR
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

-- Bảng Danh mục Menu giao diện
CREATE TABLE menus (
    menus_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    icon VARCHAR(100),
    parent_id VARCHAR(50), -- Menu đa cấp (Nested)
    sort_order INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(menus_id) ON DELETE SET NULL
);

-- Bảng N/N: Vai trò - Menu
CREATE TABLE role_menus (
    role_id VARCHAR(50) NOT NULL,
    menu_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(menus_id) ON DELETE CASCADE
);

-- Bảng Danh mục API Endpoint
CREATE TABLE api_permissions (
    api_id VARCHAR(50) PRIMARY KEY,
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE
    endpoint VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(method, endpoint)
);

-- Bảng N/N: Vai trò - API Permission
CREATE TABLE role_api_permissions (
    role_id VARCHAR(50) NOT NULL,
    api_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, api_id),
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE,
    FOREIGN KEY (api_id) REFERENCES api_permissions(api_id) ON DELETE CASCADE
);

-- Bảng N/N: Người dùng - Vai trò
CREATE TABLE user_roles (
    user_id VARCHAR(50) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE
);

-- *********************************************************************
-- DANH MỤC NỀN (MASTER DATA)
-- *********************************************************************

-- Nhóm danh mục
CREATE TABLE master_data_categories (
    master_data_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- ETHNICITY, RELIGION, CITY
    name VARCHAR(100) NOT NULL,
    description TEXT,
    deleted_at TIMESTAMP NULL
);

-- Giá trị chi tiết của danh mục
CREATE TABLE master_data_items (
    master_data_items_id VARCHAR(50) PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_code) REFERENCES master_data_categories(code) ON DELETE CASCADE,
    UNIQUE (category_code, code)
);

-- *********************************************************************
-- CẤU HÌNH HỆ THỐNG & THÔNG BÁO (SETTINGS & NOTIFICATIONS)
-- *********************************************************************

-- Cấu hình hệ thống linh hoạt
CREATE TABLE system_settings (
    system_settings_id VARCHAR(50) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    module VARCHAR(100) DEFAULT 'GENERAL',
    description TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by VARCHAR(50) REFERENCES users(users_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phân quyền chỉnh sửa cấu hình theo module
CREATE TABLE system_config_permissions (
    id VARCHAR(50) PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    updated_by VARCHAR(50) REFERENCES users(users_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_code, module)
);

-- Danh mục loại thông báo (Notification Categories)
CREATE TABLE notification_categories (
    notification_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Mẫu thông báo (Notification Templates)
CREATE TABLE notification_templates (
    notification_templates_id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    title_template VARCHAR(255) NOT NULL, -- Template tiêu đề (có placeholder)
    body_inapp TEXT NOT NULL, -- Template nội dung In-App
    body_email TEXT, -- Template nội dung Email
    body_push TEXT, -- Template nội dung Push Notification
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (category_id) REFERENCES notification_categories(notification_categories_id)
);

-- Cấu hình gửi thông báo theo vai trò
CREATE TABLE notification_role_configs (
    notification_role_configs_id VARCHAR(50) PRIMARY KEY,
    role_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    allow_inapp BOOLEAN DEFAULT TRUE,
    allow_email BOOLEAN DEFAULT FALSE,
    allow_push BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(roles_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES notification_categories(notification_categories_id) ON DELETE CASCADE
);

-- Thông báo của từng người dùng
CREATE TABLE user_notifications (
    user_notifications_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    template_id VARCHAR(50), -- Có thể NULL nếu thông báo ad-hoc
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data_payload JSONB, -- Dữ liệu đính kèm (link, reference_id)
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES notification_templates(notification_templates_id)
);

-- Bảng FCM Token cho Push Notification
CREATE TABLE user_fcm_tokens (
    token_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    fcm_token TEXT NOT NULL UNIQUE,
    device_name VARCHAR(100),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- *********************************************************************
-- NHẬT KÝ HỆ THỐNG (AUDIT & LOGGING)
-- *********************************************************************

-- Nhật ký hành động hệ thống (Audit Trail)
CREATE TABLE audit_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN
    module_name VARCHAR(100) NOT NULL, -- Tên module bị tác động
    target_id VARCHAR(100), -- ID bản ghi bị tác động
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE SET NULL
);

-- *********************************************************************
-- MODULE 2: QUAN LY BENH NHAN (PATIENT MANAGEMENT)
-- *********************************************************************

-- Bang Benh nhan (Core Patient Data)
-- Luu y: Trong db hien tai, patients dung UUID cho id va co the KHONG lien ket voi users
-- (account_id la VARCHAR(255) nullable). Day la thiet ke cho benh nhan vang lai/chua co tai khoan.
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code VARCHAR(30) UNIQUE NOT NULL, -- Ma so benh nhan (MRN)
    account_id VARCHAR(255), -- Lien ket voi users (nullable: benh nhan vang lai)
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    id_card_number VARCHAR(50), -- CMND/CCCD
    address TEXT,
    province_id INT,
    district_id INT,
    ward_id INT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    has_insurance BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Bang Loai quan he (Relation Types) - Danh muc chuan
CREATE TABLE relation_types (
    relation_types_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Bang Nguoi than & Lien he khan cap (Patient Contacts/Relations)
CREATE TABLE patient_contacts (
    patient_contacts_id VARCHAR(50) PRIMARY KEY,
    patient_id UUID NOT NULL,
    relation_type_id VARCHAR(50) NOT NULL, -- Lien ket voi bang relation_types
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    is_legal_representative BOOLEAN DEFAULT FALSE, -- Nguoi dai dien phap ly
    medical_decision_note TEXT, -- Ghi chu quyen quyet dinh y te
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (relation_type_id) REFERENCES relation_types(relation_types_id)
);

-- Bang Bao hiem benh nhan
CREATE TABLE patient_insurances (
    patient_insurances_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    insurance_type VARCHAR(50) NOT NULL, -- STATE (BHYT), PRIVATE
    insurance_number VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_percent INT,
    is_primary BOOLEAN DEFAULT TRUE,
    document_url TEXT,
    provider_id VARCHAR(50), -- Lien ket toi insurance_providers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES insurance_providers(insurance_providers_id)
);

-- Bang Tien su benh ly (Medical History)
CREATE TABLE patient_medical_histories (
    patient_medical_histories_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    condition_code VARCHAR(20), -- Ma ICD-10
    condition_name VARCHAR(255) NOT NULL,
    history_type VARCHAR(50) NOT NULL, -- PERSONAL, FAMILY
    diagnosis_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED
    notes TEXT,
    reported_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- Bang Di ung & Tac dung phu (Allergies) - Cuc ky quan trong khi ke don
CREATE TABLE patient_allergies (
    patient_allergies_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    allergen_type VARCHAR(50), -- DRUG, FOOD, ENVIRONMENT
    allergen_name VARCHAR(255) NOT NULL,
    reaction TEXT,
    severity VARCHAR(50), -- MILD, MODERATE, SEVERE
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bang danh sach cac The (Tags)
CREATE TABLE tags (
    tags_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- VIP, CHRONIC_CARE, HIGH_RISK
    name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(10) DEFAULT '#000000',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Bang lien ket Benh nhan - The
CREATE TABLE patient_tags (
    patient_tags_id VARCHAR(50) PRIMARY KEY,
    patient_id UUID NOT NULL,
    tag_id VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(50),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tags_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- Bang Quy tac phan loai benh nhan tu dong
CREATE TABLE patient_classification_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    criteria_type VARCHAR(50) NOT NULL, -- AGE, VISIT_COUNT, DIAGNOSIS_CODE
    criteria_operator VARCHAR(10) NOT NULL, -- >, <, =, >=, <=, CONTAINS
    criteria_value VARCHAR(255) NOT NULL,
    target_tag_id VARCHAR(50) NOT NULL, -- Tag se duoc gan tu dong
    timeframe_days INT, -- Khoan thoi gian xet (vd: 90 ngay gan nhat)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (target_tag_id) REFERENCES tags(tags_id)
);

-- Bang Loai tai lieu (Document Types)
CREATE TABLE document_types (
    document_type_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Bang Ho so dinh kem benh nhan (Patient Documents)
CREATE TABLE patient_documents (
    patient_documents_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    document_type_id VARCHAR(50), -- Lien ket voi document_types
    document_type VARCHAR(50), -- LAB_RESULT, EXTERNAL_EMR, CONSENT_FORM (legacy)
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_format VARCHAR(20),
    file_size_bytes BIGINT,
    notes TEXT,
    version_number INT DEFAULT 1,
    uploaded_by VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (document_type_id) REFERENCES document_types(document_type_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- Bang Phien ban tai lieu (Document Versions)
CREATE TABLE patient_document_versions (
    version_id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    version_number INT NOT NULL,
    file_url TEXT NOT NULL,
    file_format VARCHAR(20),
    file_size_bytes BIGINT,
    uploaded_by VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES patient_documents(patient_documents_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- *********************************************************************
-- MODULE 3: QUAN LY CO SO Y TE (FACILITY MANAGEMENT - MULTI-CLINIC)
-- *********************************************************************

-- Co so y te (Healthcare Facilities) - Bang goc (Root)
CREATE TABLE facilities (
    facilities_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(255),
    logo_url TEXT,
    headquarters_address TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Gio hoat dong cua co so (Operation Hours)
CREATE TABLE facility_operation_hours (
    operation_hours_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL, -- 0 (CN) -> 6 (T7)
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    UNIQUE(facility_id, day_of_week)
);

-- Ngay dong cua dinh ky (Facility Closed Days) - vd: CN hang tuan, Chieu T7
CREATE TABLE facility_closed_days (
    closed_day_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE
);

-- Ngay le / ngay nghi dac biet (Facility Holidays)
CREATE TABLE facility_holidays (
    holiday_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    holiday_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_closed BOOLEAN DEFAULT TRUE,
    special_open_time TIME, -- Gio mo cua dac biet (neu khong dong hoan toan)
    special_close_time TIME,
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE, -- Lap lai hang nam (vd: Tet, 30/4)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE
);

-- Chi nhanh (Branches) thuoc Co so y te
CREATE TABLE branches (
    branches_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    established_date DATE,
    deleted_at TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE
);

-- Phong ban / Chuyen khoa (Departments) thuoc Chi nhanh
CREATE TABLE departments (
    departments_id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    deleted_at TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    UNIQUE(branch_id, code)
);

-- Phong kham / Phong chuc nang (Medical Rooms) thuoc Phong ban
-- [!!!  OVERLAP]: Bang nay CHONG CHEO voi bang "clinic_rooms" ben duoi.
-- "medical_rooms" la phien ban day du hon (co branch_id, department_id, deleted_at).
-- "clinic_rooms" la phien ban cu/don gian hon (khong co branch, department).
-- => NEN SU DUNG: medical_rooms (loai bo clinic_rooms).
CREATE TABLE medical_rooms (
    medical_rooms_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50),
    branch_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50), -- CONSULTATION, LAB, IMAGING, OPERATING
    capacity INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    deleted_at TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    UNIQUE(department_id, code)
);



-- Quan ly nhan su y te (Gan Staff vao Chi nhanh/Khoa)
CREATE TABLE user_branch_dept (
    user_branch_dept_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    department_id VARCHAR(50),
    role_title VARCHAR(100), -- Truong khoa, Bac si dieu tri
    status VARCHAR(50) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE SET NULL,
    UNIQUE(user_id, branch_id)
);

-- Bang cap, chung chi hanh nghe (User Licenses)
CREATE TABLE user_licenses (
    licenses_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    issued_by VARCHAR(255),
    document_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- Cau hinh dat lich (Booking Configurations) - theo co so + chi nhanh
CREATE TABLE booking_configurations (
    config_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    max_patients_per_slot INT,
    buffer_duration INT, -- Thoi gian dem giua 2 slot (phut)
    advance_booking_days INT, -- Dat truoc toi da bao nhieu ngay
    minimum_booking_hours INT, -- Dat truoc toi thieu bao nhieu gio
    cancellation_allowed_hours INT, -- Huy truoc bao nhieu gio
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE
);

-- *********************************************************************
-- MODULE 4: LICH LAM VIEC & DAT LICH KHAM (SCHEDULING & APPOINTMENTS)
-- *********************************************************************

-- Chuyen khoa (Specialties) - Master Data
CREATE TABLE specialties (
    specialties_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    deleted_at TIMESTAMP
);

-- Thong tin chuyen mon Bac si
CREATE TABLE doctors (
    doctors_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    specialty_id VARCHAR(50) NOT NULL,
    title VARCHAR(100), -- GS, TS, BS.CKII
    biography TEXT,
    consultation_fee DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id)
);

-- Ca lam viec (Shifts) - Danh muc ca kham chuan
CREATE TABLE shifts (
    shifts_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- MORNING, AFTERNOON, NIGHT
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Lich lam viec cua NHAN VIEN (Staff Schedules) - Tong quat cho moi loai nhan su
-- Lien ket voi: users, medical_rooms, shifts
CREATE TABLE staff_schedules (
    staff_schedules_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    medical_room_id VARCHAR(50) NOT NULL,
    shift_id VARCHAR(50) NOT NULL,
    working_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_leave BOOLEAN DEFAULT FALSE,
    leave_reason TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (medical_room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id)
);


-- Khung gio kham (Appointment Slots) - Gan voi Ca lam viec (shifts)
-- He thong tu dong sinh slot dua tren cau hinh (vd: moi slot 15 phut)
CREATE TABLE appointment_slots (
    slot_id VARCHAR(50) PRIMARY KEY,
    shift_id VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id) ON DELETE CASCADE
);


-- Lich hen kham (Appointments)
-- Luu y: doctor_id va slot_id deu NULLABLE de ho tro benh nhan dat lich chua chon bac si/slot
CREATE TABLE appointments (
    appointments_id VARCHAR(50) PRIMARY KEY,
    appointment_code VARCHAR(50) UNIQUE NOT NULL, -- Ma tra cuu (vd: APP-20260305-123)
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50), -- Nullable: benh nhan chua chon bac si
    slot_id VARCHAR(50), -- Nullable: dat lich chua chon slot cu the
    room_id VARCHAR(50), -- Phong kham
    facility_service_id VARCHAR(50), -- Dich vu kham
    appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    booking_channel VARCHAR(50) NOT NULL, -- APP, WEB, HOTLINE, DIRECT_CLINIC, ZALO
    reason_for_visit TEXT,
    symptoms_notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    -- PENDING, CONFIRMED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED
    checked_in_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE appointments ADD COLUMN IF NOT EXISTS queue_number INT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_in_method VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS qr_token VARCHAR(100) UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS qr_token_expires_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS late_minutes INT DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. ALTER bảng medical_rooms — thêm tracking phòng khám
ALTER TABLE medical_rooms ADD COLUMN IF NOT EXISTS current_appointment_id VARCHAR(50);
ALTER TABLE medical_rooms ADD COLUMN IF NOT EXISTS current_patient_id VARCHAR(50);
ALTER TABLE medical_rooms ADD COLUMN IF NOT EXISTS room_status VARCHAR(30) DEFAULT 'AVAILABLE';




-- Nhat ky thay doi lich kham (Appointment Audit Trail)
CREATE TABLE appointment_audit_logs (
    appointment_audit_logs_id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    action_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- Yeu cau doi ca (Shift Swaps) giua cac nhan vien
CREATE TABLE shift_swaps (
    swap_id VARCHAR(50) PRIMARY KEY,
    requester_schedule_id VARCHAR(50) NOT NULL,
    target_schedule_id VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    approver_id VARCHAR(50),
    approver_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (requester_schedule_id) REFERENCES staff_schedules(staff_schedules_id),
    FOREIGN KEY (target_schedule_id) REFERENCES staff_schedules(staff_schedules_id),
    FOREIGN KEY (approver_id) REFERENCES users(users_id)
);

-- Yeu cau nghi phep (Leave Requests)
CREATE TABLE leave_requests (
    leave_requests_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    approver_id VARCHAR(50),
    approver_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(users_id)
);

-- *********************************************************************
-- MODULE 5: KHAM BENH & HO SO BENH AN (EMR - Electronic Medical Records)
-- *********************************************************************

-- Luot kham / Benh an (Encounters)
CREATE TABLE encounters (
    encounters_id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50), -- Nullable: benh nhan cap cuu/vang lai
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    encounter_type VARCHAR(50) DEFAULT 'OUTPATIENT', -- OUTPATIENT, INPATIENT, EMERGENCY, TELEMED
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    -- IN_PROGRESS, WAITING_FOR_RESULTS, COMPLETED, CLOSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id)
);

-- Kham Lam sang & Sinh hieu (Clinical Examination & Vital Signs)
CREATE TABLE clinical_examinations (
    clinical_examinations_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE,
    -- Sinh hieu (Vital Signs)
    pulse INT,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    temperature DECIMAL(4,2),
    respiratory_rate INT,
    spo2 INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2),
    -- Kham lam sang
    chief_complaint TEXT,
    medical_history_notes TEXT,
    physical_examination TEXT,
    recorded_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(users_id)
);

-- Chan doan Y khoa (Encounter Diagnoses)
CREATE TABLE encounter_diagnoses (
    encounter_diagnoses_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL,
    icd10_code VARCHAR(20) NOT NULL,
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_type VARCHAR(50) DEFAULT 'PRIMARY', -- PRIMARY, SECONDARY, PRELIMINARY, FINAL
    notes TEXT,
    diagnosed_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (diagnosed_by) REFERENCES users(users_id)
);

-- Chi dinh Dich vu Can lam sang (Medical Orders)
CREATE TABLE medical_orders (
    medical_orders_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    clinical_indicator TEXT,
    priority VARCHAR(50) DEFAULT 'ROUTINE', -- ROUTINE, URGENT
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    ordered_by VARCHAR(50) NOT NULL,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (ordered_by) REFERENCES users(users_id)
);

-- Ket qua Can lam sang (Medical Order Results)
CREATE TABLE medical_order_results (
    medical_order_results_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    result_summary TEXT,
    result_details JSON,
    attachment_urls JSON,
    performed_by VARCHAR(50),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES medical_orders(medical_orders_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(users_id)
);

-- Ky so & Khoa Benh an (EMR Digital Signatures)
CREATE TABLE emr_signatures (
    emr_signatures_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE,
    signed_by VARCHAR(50) NOT NULL,
    signature_hash VARCHAR(255) NOT NULL,
    certificate_serial VARCHAR(100),
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45),
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (signed_by) REFERENCES users(users_id)
);

-- *********************************************************************
-- MODULE 6: KE DON & QUAN LY THUOC (PRESCRIPTIONS & PHARMACY)
-- *********************************************************************

-- Phan nhom thuoc (Drug Categories)
CREATE TABLE drug_categories (
    drug_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    deleted_at TIMESTAMP
);

-- Danh muc Thuoc (Master Drugs)
CREATE TABLE drugs (
    drugs_id VARCHAR(50) PRIMARY KEY,
    drug_code VARCHAR(50) UNIQUE NOT NULL,
    national_drug_code VARCHAR(100), -- Ma thuoc Quoc gia (DQG)
    brand_name VARCHAR(255) NOT NULL,
    active_ingredients TEXT NOT NULL,
    category_id VARCHAR(50),
    route_of_administration VARCHAR(50), -- ORAL, INJECTION, TOPICAL
    dispensing_unit VARCHAR(20) NOT NULL, -- Vien, Lo, Tuyp
    is_prescription_only BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES drug_categories(drug_categories_id)
);

-- Don thuoc (Prescriptions Header)
CREATE TABLE prescriptions (
    prescriptions_id VARCHAR(50) PRIMARY KEY,
    prescription_code VARCHAR(50) UNIQUE NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PRESCRIBED, DISPENSED, CANCELLED
    clinical_diagnosis TEXT,
    doctor_notes TEXT,
    prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(users_id)
);

-- Chi tiet Don thuoc (Prescription Details)
CREATE TABLE prescription_details (
    prescription_details_id VARCHAR(50) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL,
    drug_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INT,
    usage_instruction TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescriptions_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id)
);

-- Ton kho thuoc (Pharmacy Inventory)
CREATE TABLE pharmacy_inventory (
    pharmacy_inventory_id VARCHAR(50) PRIMARY KEY,
    drug_id VARCHAR(50) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2),
    unit_price DECIMAL(12,2),
    location_bin VARCHAR(50),
    FOREIGN KEY (drug_id) REFERENCES drugs(drugs_id) ON DELETE CASCADE,
    UNIQUE (drug_id, batch_number)
);

-- Phieu xuat / Cap phat thuoc (Drug Dispense Orders)
CREATE TABLE drug_dispense_orders (
    drug_dispense_orders_id VARCHAR(50) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL UNIQUE,
    pharmacist_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescriptions_id),
    FOREIGN KEY (pharmacist_id) REFERENCES users(users_id)
);

-- Chi tiet Cap phat & Tru kho (Drug Dispense Details)
CREATE TABLE drug_dispense_details (
    drug_dispense_details_id VARCHAR(50) PRIMARY KEY,
    dispense_order_id VARCHAR(50) NOT NULL,
    prescription_detail_id VARCHAR(50) NOT NULL,
    inventory_id VARCHAR(50) NOT NULL,
    dispensed_quantity INT NOT NULL,
    FOREIGN KEY (dispense_order_id) REFERENCES drug_dispense_orders(drug_dispense_orders_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_detail_id) REFERENCES prescription_details(prescription_details_id),
    FOREIGN KEY (inventory_id) REFERENCES pharmacy_inventory(pharmacy_inventory_id)
);

-- *********************************************************************
-- MODULE 7: DICH VU Y TE & BAO HIEM (MEDICAL SERVICES & INSURANCE)
-- *********************************************************************

-- Nhom dich vu
CREATE TABLE service_categories (
    service_categories_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Danh muc Dich vu Chuan (Master Services)
CREATE TABLE services (
    services_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    service_group VARCHAR(50), -- KHAM, XN, CDHA, THUTHUAT
    service_type VARCHAR(50), -- CLINICAL, LABORATORY, RADIOLOGY, PROCEDURE
    insurance_code VARCHAR(100), -- Ma dich vu BHYT quoc gia
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Dich vu tai Co so (Facility Services) - Bang gia rieng moi co so
CREATE TABLE facility_services (
    facility_services_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    service_id VARCHAR(50) NOT NULL,
    department_id VARCHAR(50), -- Map DV vao chuyen khoa cu the
    base_price DECIMAL(12,2) NOT NULL, -- Gia dich vu (VND)
    insurance_price DECIMAL(12,2), -- Gia BHYT chi tra
    vip_price DECIMAL(12,2) DEFAULT 0, -- Gia VIP
    estimated_duration_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(services_id),
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE SET NULL,
    UNIQUE (facility_id, service_id)
);

-- Lien ket Chuyen khoa - Dich vu
CREATE TABLE specialty_services (
    specialty_id VARCHAR(50) NOT NULL,
    service_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (specialty_id, service_id),
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(services_id) ON DELETE CASCADE
);

-- Lien ket Bac si - Dich vu co so
CREATE TABLE doctor_services (
    doctor_id VARCHAR(50) NOT NULL,
    facility_service_id VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    assigned_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (doctor_id, facility_service_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(users_id) ON DELETE SET NULL
);

-- Nha cung cap Bao hiem
CREATE TABLE insurance_providers (
    insurance_providers_id VARCHAR(50) PRIMARY KEY,
    provider_code VARCHAR(50) UNIQUE NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    insurance_type VARCHAR(50) NOT NULL, -- STATE, PRIVATE
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    address TEXT,
    support_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pham vi bao hiem (Insurance Coverages)
CREATE TABLE insurance_coverages (
    insurance_coverages_id VARCHAR(50) PRIMARY KEY,
    coverage_name VARCHAR(255) NOT NULL,
    provider_id VARCHAR(50) NOT NULL,
    coverage_percent DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES insurance_providers(insurance_providers_id) ON DELETE CASCADE
);

-- Khuyen mai (Promotions)
CREATE TABLE promotions (
    promotions_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- PERCENTAGE, FIXED_AMOUNT
    discount_value DECIMAL(12,2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- *********************************************************************
-- MODULE 8: THANH TOAN & THU NGAN (BILLING & CASHIER)
-- *********************************************************************

-- Hoa don tong (Invoices)
CREATE TABLE invoices (
    invoices_id VARCHAR(50) PRIMARY KEY,
    invoice_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    insurance_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, CANCELLED
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE SET NULL
);

-- Chi tiet Hoa don (Invoice Details)
CREATE TABLE invoice_details (
    invoice_details_id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- CONSULTATION, LAB_ORDER, DRUG
    reference_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id) ON DELETE CASCADE
);

-- Giao dich Thanh toan (Payment Transactions)
CREATE TABLE payment_transactions (
    payment_transactions_id VARCHAR(50) PRIMARY KEY,
    transaction_code VARCHAR(100) UNIQUE NOT NULL,
    invoice_id VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(50) DEFAULT 'PAYMENT', -- PAYMENT, REFUND
    payment_method VARCHAR(50) NOT NULL, -- CASH, CREDIT_CARD, VNPAY, MOMO
    amount DECIMAL(12,2) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    gateway_response JSON,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, REFUNDED
    cashier_id VARCHAR(50),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id),
    FOREIGN KEY (cashier_id) REFERENCES users(users_id)
);

-- Ca lam viec Thu ngan (Cashier Shifts)
CREATE TABLE cashier_shifts (
    cashier_shifts_id VARCHAR(50) PRIMARY KEY,
    cashier_id VARCHAR(50) NOT NULL,
    shift_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shift_end TIMESTAMP,
    opening_balance DECIMAL(12,2) NOT NULL,
    system_calculated_balance DECIMAL(12,2) DEFAULT 0,
    actual_closing_balance DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, CLOSED, DISCREPANCY
    notes TEXT,
    FOREIGN KEY (cashier_id) REFERENCES users(users_id)
);

-- *********************************************************************
-- MODULE 9: HO SO SUC KHOE DIEN TU (EHR - Electronic Health Records)
-- *********************************************************************

-- Dong thoi gian suc khoe (Health Timeline Events)
CREATE TABLE health_timeline_events (
    health_timeline_events_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- ENCOUNTER, LAB_RESULT, PRESCRIPTION, VACCINATION
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    reference_id VARCHAR(50), -- ID tro ve bang goc
    reference_table VARCHAR(50), -- Ten bang goc (encounters, prescriptions)
    source_system VARCHAR(100) DEFAULT 'INTERNAL_HIS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timeline_patient_date ON health_timeline_events(patient_id, event_date DESC);

-- Chi so suc khoe lien tuc (Health Metrics)
CREATE TABLE patient_health_metrics (
    patient_health_metrics_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    metric_code VARCHAR(50) NOT NULL, -- BLOOD_PRESSURE, BLOOD_SUGAR, HEART_RATE
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSON NOT NULL,
    unit VARCHAR(20) NOT NULL, -- mmHg, mg/dL, bpm, kg
    measured_at TIMESTAMP NOT NULL,
    source_type VARCHAR(50) DEFAULT 'SELF_REPORTED', -- SELF_REPORTED, CLINIC, DEVICE
    device_info VARCHAR(255)
);

-- Dong bo du lieu ben ngoai (External Health Records)
CREATE TABLE external_health_records (
    external_health_records_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    integration_protocol VARCHAR(50), -- REST_API, HL7_FHIR, SOAP
    data_type VARCHAR(50), -- VACCINE_CERT, LAB_HISTORY
    raw_payload JSONB NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quyen truy cap & Chia se ho so (EHR Access Control)
CREATE TABLE ehr_access_grants (
    ehr_access_grants_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    granted_to_user_id VARCHAR(50) NOT NULL,
    access_level VARCHAR(50) DEFAULT 'READ_ONLY', -- READ_ONLY, FULL_ACCESS
    allowed_modules JSON, -- ["LAB_RESULTS", "PRESCRIPTIONS"]
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP, -- NULL = vinh vien
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, REVOKED
    granted_by VARCHAR(50),
    FOREIGN KEY (granted_to_user_id) REFERENCES users(users_id) ON DELETE CASCADE
);

-- *********************************************************************
-- MODULE 10: TU VAN & KHAM TU XA (TELEMEDICINE)
-- *********************************************************************

-- Phong kham truc tuyen (Virtual Consultation Room)
CREATE TABLE tele_consultations (
    tele_consultations_id VARCHAR(50) PRIMARY KEY,
    encounter_id VARCHAR(50) NOT NULL UNIQUE,
    platform VARCHAR(50) DEFAULT 'AGORA', -- ZOOM, AGORA, STRINGEE
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    host_url TEXT,
    join_url TEXT NOT NULL,
    recording_url TEXT,
    recording_duration INT, -- Thoi luong (giay)
    call_status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, ONGOING, COMPLETED, MISSED
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounters_id) ON DELETE CASCADE
);

-- Tin nhan truc tuyen (Tele Messages / Chat)
CREATE TABLE tele_messages (
    tele_messages_id VARCHAR(50) PRIMARY KEY,
    tele_consultation_id VARCHAR(50) NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    sender_type VARCHAR(50), -- DOCTOR, PATIENT, SYSTEM
    message_type VARCHAR(50) DEFAULT 'TEXT', -- TEXT, IMAGE, FILE_PDF
    content TEXT,
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(users_id) ON DELETE CASCADE
);

CREATE INDEX idx_tele_messages_time ON tele_messages(tele_consultation_id, sent_at ASC);

-- Danh gia chat luong dich vu (Tele Feedbacks)
CREATE TABLE tele_feedbacks (
    tele_feedbacks_id VARCHAR(50) PRIMARY KEY,
    tele_consultation_id VARCHAR(50) NOT NULL UNIQUE,
    patient_id VARCHAR(50) NOT NULL,
    doctor_rating INT CHECK (doctor_rating >= 1 AND doctor_rating <= 5),
    doctor_feedback TEXT,
    tech_rating INT CHECK (tech_rating >= 1 AND tech_rating <= 5),
    tech_feedback TEXT,
    tech_issues_tags JSON, -- ["AUDIO_ISSUE", "DISCONNECTED"]
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tele_consultation_id) REFERENCES tele_consultations(tele_consultations_id) ON DELETE CASCADE
);

-- *********************************************************************
-- MODULE 11: TRANG THIET BI & GIUONG BENH (EQUIPMENT & BED MANAGEMENT)
-- *********************************************************************

-- Trang thiet bi y te (Medical Equipments)
CREATE TABLE medical_equipments (
    equipment_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    manufacturing_date DATE,
    purchase_date DATE,
    warranty_expiration DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, BROKEN, RETIRED
    current_room_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    FOREIGN KEY (current_room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE SET NULL
);

-- Nhat ky bao tri (Equipment Maintenance Logs)
CREATE TABLE equipment_maintenance_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL, -- SCHEDULED, EMERGENCY, CALIBRATION
    description TEXT,
    performed_by VARCHAR(255),
    cost DECIMAL(15,2) DEFAULT 0.00,
    next_maintenance_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES medical_equipments(equipment_id) ON DELETE CASCADE
);

-- Giuong benh (Beds)
CREATE TABLE beds (
    bed_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    department_id VARCHAR(50),
    room_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- STANDARD, ICU, EMERGENCY
    status VARCHAR(20) NOT NULL DEFAULT 'EMPTY', -- EMPTY, OCCUPIED, CLEANING, BROKEN
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE SET NULL
);


--Khoá khung giờ không khả dụng (Locked Slots)
-- Bảng cho phép khoá slot theo ngày cụ thể (không phải disable vĩnh viễn)
CREATE TABLE locked_slots (
    locked_slot_id VARCHAR(50) PRIMARY KEY,
    slot_id VARCHAR(50) NOT NULL,
    locked_date DATE NOT NULL,
    lock_reason TEXT,
    locked_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (slot_id) REFERENCES appointment_slots(slot_id) ON DELETE CASCADE,
    FOREIGN KEY (locked_by) REFERENCES users(users_id) ON DELETE SET NULL,
    UNIQUE(slot_id, locked_date)
);


-- =====================================================================
-- Phân biệt ca khám theo dịch vụ (Shift-Service Mapping)
-- Bảng liên kết N-N giữa shifts và facility_services
-- =====================================================================

CREATE TABLE shift_services (
    shift_service_id VARCHAR(50) PRIMARY KEY,
    shift_id VARCHAR(50) NOT NULL,
    facility_service_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE,
    UNIQUE(shift_id, facility_service_id)
);


-- =====================================================================
-- – Doctor Absence (Vắng đột xuất bác sĩ)
-- Bảng lưu trữ lịch vắng đột xuất của bác sĩ=

CREATE TABLE doctor_absences (
    absence_id VARCHAR(50) PRIMARY KEY,
    doctor_id VARCHAR(50) NOT NULL,
    absence_date DATE NOT NULL,
    shift_id VARCHAR(50),                    
    absence_type VARCHAR(50) NOT NULL,       
    reason TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctors_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id) ON DELETE SET NULL
);


-- =====================================================================
-- Room-Service Mapping (Phân loại phòng theo dịch vụ)

CREATE TABLE room_services (
    room_id VARCHAR(50) NOT NULL,
    facility_service_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, facility_service_id),
    FOREIGN KEY (room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_service_id) REFERENCES facility_services(facility_services_id) ON DELETE CASCADE
);

-- =====================================================================
-- Room Maintenance Schedules (Khoá phòng bảo trì)

CREATE TABLE room_maintenance_schedules (
    maintenance_id VARCHAR(50) PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (room_id) REFERENCES medical_rooms(medical_rooms_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id) ON DELETE SET NULL,
    CHECK (end_date >= start_date)
);


-- 1. Thêm cột xác nhận vào bảng appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(50) NULL;

-- 2. Bảng tracking nhắc lịch
CREATE TABLE IF NOT EXISTS appointment_reminders (
    reminder_id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL,
    reminder_type VARCHAR(20) NOT NULL,     -- AUTO | MANUAL
    channel VARCHAR(20) NOT NULL,           -- INAPP | EMAIL | PUSH
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_by VARCHAR(50) NULL,               -- NULL nếu AUTO (cron job)
    trigger_source VARCHAR(50) NOT NULL,    -- CRON_JOB | STAFF_MANUAL
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointments_id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by) REFERENCES users(users_id) ON DELETE SET NULL
);



-- 1. Bảng mới: appointment_change_logs — lưu lịch sử dời/hủy
CREATE TABLE IF NOT EXISTS appointment_change_logs (
    id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL REFERENCES appointments(appointments_id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL, -- RESCHEDULE / CANCEL
    old_date DATE,
    old_slot_id VARCHAR(50),
    new_date DATE,
    new_slot_id VARCHAR(50),
    reason TEXT,
    changed_by VARCHAR(50),
    policy_checked BOOLEAN DEFAULT FALSE,
    policy_result VARCHAR(30), -- ALLOWED / LATE_CANCEL / BLOCKED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_change_logs_appointment ON appointment_change_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_type ON appointment_change_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_change_logs_created ON appointment_change_logs(created_at DESC);

-- 2. ALTER bảng appointments — thêm cột tracking dời/hủy
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_count INT DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_rescheduled_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50);


-- 1. ALTER bảng appointments — thêm cột priority
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL';

-- 2. Bảng mới: appointment_coordination_logs
CREATE TABLE IF NOT EXISTS appointment_coordination_logs (
    id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL REFERENCES appointments(appointments_id) ON DELETE CASCADE,
    action_type VARCHAR(30) NOT NULL, -- REASSIGN_DOCTOR / SET_PRIORITY / AUTO_ASSIGN
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    performed_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- TOM TAT CAC BANG BI CHONG CHEO (OVERLAP SUMMARY)
-- =====================================================================
-- 
-- 1. clinic_rooms vs medical_rooms
--    - clinic_rooms: Don gian, khong co branch/department. Dang duoc encounters, doctor_schedules tham chieu.
--    - medical_rooms: Day du hon, co branch_id, department_id, deleted_at.
--    => KHUYEN NGHI: Migrate FK sang medical_rooms, loai bo clinic_rooms.
--
-- 2. doctor_schedules vs staff_schedules
--    - doctor_schedules: Chi cho bac si, dung clinic_rooms, shift_type la TEXT (khong FK).
--    - staff_schedules: Tong quat, dung medical_rooms, co shift_id FK den shifts.
--    => KHUYEN NGHI: Dung staff_schedules cho tat ca. Loc bac si qua role/join doctors.
--
-- 3. schedule_slots vs appointment_slots
--    - schedule_slots: Gan voi doctor_schedules (cu), co max_patients/booked_patients.
--    - appointment_slots: Gan voi shifts (moi), don gian hon.
--    => KHUYEN NGHI: Dung appointment_slots. Logic max/booked nen xu ly o tang Service.
--
-- =====================================================================
