-- databases/structure/migrations/mod_leaves.sql

-- 1. Tạo bảng leave_requests
CREATE TABLE IF NOT EXISTS leave_requests (
    leave_requests_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',   -- PENDING | APPROVED | REJECTED
    approver_id VARCHAR(50) REFERENCES users(users_id) ON DELETE SET NULL,
    approver_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Index tìm kiếm nhanh theo nhân viên và trạng thái
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- 2. Insert Core Permissions (Bảng permissions)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_LEAVE_VW_' || substr(md5(random()::text), 1, 8), 'LEAVE_VIEW', 'Xem danh sách đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('PERM_LEAVE_CR_' || substr(md5(random()::text), 1, 8), 'LEAVE_CREATE', 'Tạo đơn xin nghỉ phép', 'LEAVE_MANAGEMENT'),
('PERM_LEAVE_UP_' || substr(md5(random()::text), 1, 8), 'LEAVE_UPDATE', 'Chỉnh sửa đơn nghỉ phép (khi PENDING)', 'LEAVE_MANAGEMENT'),
('PERM_LEAVE_DEL_' || substr(md5(random()::text), 1, 8), 'LEAVE_DELETE', 'Hủy/rút đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('PERM_LEAVE_APR_' || substr(md5(random()::text), 1, 8), 'LEAVE_APPROVE', 'Duyệt hoặc từ chối đơn nghỉ phép', 'LEAVE_MANAGEMENT')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions cho Admin (Full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'LEAVE_MANAGEMENT'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Core Permissions cho nhân viên y tế (View, Create, Update, Delete - KHÔNG có Approve)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND p.code IN ('LEAVE_VIEW', 'LEAVE_CREATE', 'LEAVE_UPDATE', 'LEAVE_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_LEAVE_VIEW_ALL', 'GET', '/api/leaves', 'Lấy danh sách đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('API_LEAVE_VIEW_DETAIL', 'GET', '/api/leaves/:id', 'Xem chi tiết đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('API_LEAVE_CREATE', 'POST', '/api/leaves', 'Tạo đơn xin nghỉ phép mới', 'LEAVE_MANAGEMENT'),
('API_LEAVE_UPDATE', 'PUT', '/api/leaves/:id', 'Chỉnh sửa đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('API_LEAVE_DELETE', 'DELETE', '/api/leaves/:id', 'Hủy/rút đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('API_LEAVE_APPROVE', 'PATCH', '/api/leaves/:id/approve', 'Duyệt đơn nghỉ phép', 'LEAVE_MANAGEMENT'),
('API_LEAVE_REJECT', 'PATCH', '/api/leaves/:id/reject', 'Từ chối đơn nghỉ phép', 'LEAVE_MANAGEMENT')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions cho Admin
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND a.module = 'LEAVE_MANAGEMENT'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map API Permissions cho nhân viên y tế (View, Create, Update, Delete)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND a.api_id IN ('API_LEAVE_VIEW_ALL', 'API_LEAVE_VIEW_DETAIL', 'API_LEAVE_CREATE', 'API_LEAVE_UPDATE', 'API_LEAVE_DELETE')
ON CONFLICT (role_id, api_id) DO NOTHING;
