-- =============================================
-- Module 2.8.2: Thiết lập ngày nghỉ cố định (Closed Days)
-- Mục đích: Khai báo các ngày nghỉ hoặc buổi nghỉ cố định trong tuần.
-- Ví dụ: Nghỉ Chủ Nhật (cả ngày), Nghỉ Chiều Thứ 7 (từ 12:00 đến 23:59)
-- =============================================

-- 1. Tạo bảng facility_closed_days
CREATE TABLE facility_closed_days (
    closed_day_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(facilities_id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0 (Chủ nhật) -> 6 (Thứ 7)
    title VARCHAR(150) NOT NULL, -- Ví dụ: "Chủ nhật", "Chiều thứ 7"
    start_time TIME NOT NULL, -- Ví dụ: 00:00:00 (cả ngày) hoặc 12:00:00 (buổi chiều)
    end_time TIME NOT NULL,   -- Ví dụ: 23:59:59 (cả ngày) hoặc 23:59:59 (buổi chiều)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Không cho phép chồng chéo thời gian nghỉ trong cùng 1 ngày của 1 cơ sở
CREATE UNIQUE INDEX idx_closed_days_facility_day 
ON facility_closed_days (facility_id, day_of_week, start_time, end_time) 
WHERE deleted_at IS NULL;

-- 2. Insert Core Permissions (Bảng permissions)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_CD_VW_' || substr(md5(random()::text), 1, 8), 'CLOSED_DAY_VIEW', 'Xem ngày nghỉ cố định', 'FACILITY_CLOSED_DAYS'),
('PERM_CD_CR_' || substr(md5(random()::text), 1, 8), 'CLOSED_DAY_CREATE', 'Tạo ngày nghỉ cố định', 'FACILITY_CLOSED_DAYS'),
('PERM_CD_DEL_' || substr(md5(random()::text), 1, 8), 'CLOSED_DAY_DELETE', 'Xóa ngày nghỉ cố định', 'FACILITY_CLOSED_DAYS')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions cho Admin (Full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'FACILITY_CLOSED_DAYS'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Core Permissions cho nhân viên y tế (View only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND p.code IN ('CLOSED_DAY_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_CD_VIEW_ALL', 'GET', '/api/closed-days', 'Lấy danh sách ngày nghỉ cố định', 'FACILITY_CLOSED_DAYS'),
('API_CD_CREATE', 'POST', '/api/closed-days', 'Tạo cấu hình ngày nghỉ cố định', 'FACILITY_CLOSED_DAYS'),
('API_CD_DELETE', 'DELETE', '/api/closed-days/:id', 'Xóa cấu hình ngày nghỉ cố định', 'FACILITY_CLOSED_DAYS')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions cho Admin (Full quyền)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND a.module = 'FACILITY_CLOSED_DAYS'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map API Permissions cho nhân viên y tế (View only)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND a.api_id IN ('API_CD_VIEW_ALL')
ON CONFLICT (role_id, api_id) DO NOTHING;
