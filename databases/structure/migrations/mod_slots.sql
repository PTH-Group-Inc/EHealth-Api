-- =========================================================================
-- MODULE 2.6.2: QUẢN LÝ SLOT KHÁM BỆNH (APPOINTMENT SLOTS)
-- =========================================================================

-- 1. Tạo Bảng Quản lý Slot Khám Bệnh (`appointment_slots`)
CREATE TABLE appointment_slots (
    slot_id VARCHAR(50) PRIMARY KEY,
    shift_id VARCHAR(50) NOT NULL, -- Khóa ngoại trỏ tới ca làm việc
    start_time TIME NOT NULL,      -- Giờ bắt đầu slot (VD: 08:00:00)
    end_time TIME NOT NULL,        -- Giờ kết thúc slot (VD: 08:15:00)
    is_active BOOLEAN DEFAULT TRUE,-- Trạng thái hoạt động
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_slots_shift FOREIGN KEY (shift_id) REFERENCES shifts(shifts_id) ON DELETE CASCADE
);

-- 2. Thêm Index cho bảng appointment_slots
CREATE INDEX idx_appointment_slots_shift ON appointment_slots(shift_id);
CREATE INDEX idx_appointment_slots_times ON appointment_slots(start_time, end_time);

-- 3. Bổ sung API Permissions vào Hệ thống Phân Quyền
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_SLOT_CREATE', 'POST', '/api/slots', 'Tạo slot khám bệnh', 'SHIFT_MANAGEMENT'),
('API_SLOT_VIEW_ALL', 'GET', '/api/slots', 'Lấy danh sách slot khám', 'SHIFT_MANAGEMENT'),
('API_SLOT_VIEW_DETAIL', 'GET', '/api/slots/:id', 'Lấy chi tiết slot khám', 'SHIFT_MANAGEMENT'),
('API_SLOT_UPDATE', 'PUT', '/api/slots/:id', 'Cập nhật slot khám', 'SHIFT_MANAGEMENT'),
('API_SLOT_DELETE', 'DELETE', '/api/slots/:id', 'Xóa slot khám', 'SHIFT_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 4. Bổ sung CORE Permissions (Giao diện / Logic) cho Hệ thống Phân Quyền
INSERT INTO permissions (code, name, description, module) VALUES
('SLOT_VIEW', 'Xem danh sách Slot khám', 'Cho phép xem và tra cứu danh sách slot phân bổ', 'SHIFT_MANAGEMENT'),
('SLOT_CREATE', 'Tạo Slot khám bệnh', 'Cho phép tạo slot khám thủ công hoặc tự động', 'SHIFT_MANAGEMENT'),
('SLOT_UPDATE', 'Cập nhật Slot khám', 'Cho phép đổi thông tin slot (giờ, ca)', 'SHIFT_MANAGEMENT'),
('SLOT_DELETE', 'Xóa Slot khám', 'Cho phép vô hiệu hóa slot khám khỏi ca', 'SHIFT_MANAGEMENT')
ON CONFLICT (code) DO NOTHING;

-- Map các API Permissions này với quyền MANAGER, ADMIN, SUPER_ADMIN
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND a.module = 'SHIFT_MANAGEMENT'
AND a.api_id LIKE 'API_SLOT_%'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map các CORE Permissions này với quyền MANAGER, ADMIN, SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') 
AND p.module = 'SHIFT_MANAGEMENT'
AND p.code LIKE 'SLOT_%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Quyền xem (View) cho các Role y tế cơ cấu (API)
INSERT INTO role_api_permissions (role_id, api_id) 
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER') 
AND a.api_id IN ('API_SLOT_VIEW_ALL', 'API_SLOT_VIEW_DETAIL')
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map Quyền xem (View) cho các Role y tế cơ cấu (CORE)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER') 
AND p.code = 'SLOT_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;
