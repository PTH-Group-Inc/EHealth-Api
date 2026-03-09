-- =============================================
-- Module 2.8.3: Thiết lập ngày lễ (Holidays)
-- Mục đích: Quản lý ngày lễ (theo ngày cụ thể, KHÔNG theo tuần)
-- Logic: Ngày lễ OVERRIDE giờ hoạt động thường. Có thể đóng cửa hoặc mở giờ đặc biệt.
-- =============================================

-- 1. Tạo bảng facility_holidays
CREATE TABLE facility_holidays (
    holiday_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,                    -- Ngày lễ cụ thể (vd: 2026-01-01)
    title VARCHAR(255) NOT NULL,                   -- Tên ngày lễ (vd: Tết Nguyên Đán)
    is_closed BOOLEAN DEFAULT TRUE,                -- true = đóng cửa, false = mở giờ đặc biệt
    special_open_time TIME NULL,                   -- Giờ mở cửa đặc biệt (chỉ khi is_closed = false)
    special_close_time TIME NULL,                  -- Giờ đóng cửa đặc biệt (chỉ khi is_closed = false)
    description TEXT NULL,                         -- Ghi chú thêm
    is_recurring BOOLEAN DEFAULT FALSE,            -- true = lặp lại hàng năm (vd: Quốc khánh 2/9)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Mỗi cơ sở chỉ có 1 cấu hình cho 1 ngày lễ cụ thể
CREATE UNIQUE INDEX idx_holiday_facility_date
ON facility_holidays (facility_id, holiday_date)
WHERE deleted_at IS NULL;

-- Index tìm kiếm nhanh theo khoảng ngày
CREATE INDEX idx_holiday_date ON facility_holidays (holiday_date);

-- 2. Insert Core Permissions (Bảng permissions)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_HOL_VW_' || substr(md5(random()::text), 1, 8), 'HOLIDAY_VIEW', 'Xem danh sách ngày lễ', 'FACILITY_HOLIDAYS'),
('PERM_HOL_CR_' || substr(md5(random()::text), 1, 8), 'HOLIDAY_CREATE', 'Tạo ngày lễ', 'FACILITY_HOLIDAYS'),
('PERM_HOL_UP_' || substr(md5(random()::text), 1, 8), 'HOLIDAY_UPDATE', 'Cập nhật ngày lễ', 'FACILITY_HOLIDAYS'),
('PERM_HOL_DEL_' || substr(md5(random()::text), 1, 8), 'HOLIDAY_DELETE', 'Xóa ngày lễ', 'FACILITY_HOLIDAYS')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions cho Admin (Full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'FACILITY_HOLIDAYS'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map cho nhân viên y tế (View only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND p.code IN ('HOLIDAY_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_HOL_VIEW_ALL', 'GET', '/api/holidays', 'Lấy danh sách ngày lễ', 'FACILITY_HOLIDAYS'),
('API_HOL_VIEW_DETAIL', 'GET', '/api/holidays/:id', 'Xem chi tiết ngày lễ', 'FACILITY_HOLIDAYS'),
('API_HOL_CREATE', 'POST', '/api/holidays', 'Tạo ngày lễ', 'FACILITY_HOLIDAYS'),
('API_HOL_UPDATE', 'PUT', '/api/holidays/:id', 'Cập nhật ngày lễ', 'FACILITY_HOLIDAYS'),
('API_HOL_DELETE', 'DELETE', '/api/holidays/:id', 'Xóa ngày lễ', 'FACILITY_HOLIDAYS')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions cho Admin (Full quyền)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND a.module = 'FACILITY_HOLIDAYS'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map cho nhân viên y tế (View only)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND a.api_id IN ('API_HOL_VIEW_ALL', 'API_HOL_VIEW_DETAIL')
ON CONFLICT (role_id, api_id) DO NOTHING;
