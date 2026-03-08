-- ==============================================================================
-- 1.7 MIGRATION: THÊM MODULE THÔNG BÁO HỆ THỐNG (NOTIFICATION CORE)
-- ==============================================================================

-- 1. Bảng notification_categories: Quản lý loại/nhóm thông báo
CREATE TABLE notification_categories (
    notification_categories_id VARCHAR(50) PRIMARY KEY, -- VD: NCAT_SYSTEM, NCAT_APPOINTMENT
    code VARCHAR(100) UNIQUE NOT NULL,                  -- Mã loại (SYSTEM, APPOINTMENT, PROMOTION...)
    name VARCHAR(255) NOT NULL,                         -- Tên loại (Thông báo hệ thống, Lịch hẹn...)
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notification_categories_code ON notification_categories(code);

-- 2. Bảng notification_templates: Quản lý mẫu nội dung đa kênh
CREATE TABLE notification_templates (
    notification_templates_id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL REFERENCES notification_categories(notification_categories_id),
    code VARCHAR(100) UNIQUE NOT NULL,                  -- Mã mẫu (VD: APPOINTMENT_REMINDER, WELCOME_USER)
    name VARCHAR(255) NOT NULL,                         -- Tên mẫu dễ nhớ
    
    title_template VARCHAR(255) NOT NULL,               -- Tiêu đề mẫu (Có thể chứa biến {{var}})
    body_inapp TEXT NOT NULL,                           -- Nội dung dành cho màn hình In-app 
    body_email TEXT,                                    -- Nội dung HTML dành cho Email
    body_push TEXT,                                     -- Nội dung tĩnh/ngắn dành cho Push Mobile
    
    is_system BOOLEAN DEFAULT FALSE,                    -- True nếu là template core không cho phép xóa
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notification_templates_code ON notification_templates(code);
CREATE INDEX idx_notification_templates_category ON notification_templates(category_id);

-- 3. Bảng notification_role_configs: Trận ma trận Cấu hình Kênh nhận thông báo theo Vai trò
-- (Quyết định xem 1 Role có được nhận 1 loại Category qua kênh In-app, Email hay Push không)
CREATE TABLE notification_role_configs (
    notification_role_configs_id VARCHAR(50) PRIMARY KEY,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(roles_id),
    category_id VARCHAR(50) NOT NULL REFERENCES notification_categories(notification_categories_id),
    
    allow_inapp BOOLEAN DEFAULT TRUE,
    allow_email BOOLEAN DEFAULT FALSE,
    allow_push BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, category_id)
);

CREATE INDEX idx_notif_role_configs_role ON notification_role_configs(role_id);
CREATE INDEX idx_notif_role_configs_category ON notification_role_configs(category_id);

-- 4. Bảng user_notifications: Box tin nhắn In-app của người dùng
CREATE TABLE user_notifications (
    user_notifications_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(users_id),
    template_id VARCHAR(50) REFERENCES notification_templates(notification_templates_id),
    
    title VARCHAR(255) NOT NULL,                        -- Tiêu đề đã được parse data
    content TEXT NOT NULL,                              -- Nội dung In-App đã được parse data
    data_payload JSONB,                                 -- Lưu trữ biến meta (VD: id lịch hẹn, id dịch vụ) để click redirect
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(user_id, is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
