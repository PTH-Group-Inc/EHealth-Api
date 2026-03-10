-- databases/structure/migrations/mod_shift_swaps.sql

-- 1. Tạo bảng shift_swaps
CREATE TABLE IF NOT EXISTS shift_swaps (
    swap_id VARCHAR(50) PRIMARY KEY,
    requester_schedule_id VARCHAR(50) NOT NULL REFERENCES staff_schedules(staff_schedules_id) ON DELETE CASCADE,
    target_schedule_id VARCHAR(50) NOT NULL REFERENCES staff_schedules(staff_schedules_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',   -- PENDING | APPROVED | REJECTED
    approver_id VARCHAR(50) REFERENCES users(users_id) ON DELETE SET NULL,
    approver_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    -- Ràng buộc: không tự đổi ca với chính mình
    CONSTRAINT chk_swap_different_schedules CHECK (requester_schedule_id <> target_schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_shift_swaps_status ON shift_swaps(status);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_requester ON shift_swaps(requester_schedule_id);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_target ON shift_swaps(target_schedule_id);

-- 2. Insert Core Permissions (Bảng permissions)
INSERT INTO permissions (permissions_id, code, description, module) VALUES
('PERM_SWAP_VW_' || substr(md5(random()::text), 1, 8), 'SWAP_VIEW', 'Xem danh sách yêu cầu đổi ca', 'SHIFT_SWAP'),
('PERM_SWAP_CR_' || substr(md5(random()::text), 1, 8), 'SWAP_CREATE', 'Tạo yêu cầu đổi ca', 'SHIFT_SWAP'),
('PERM_SWAP_APR_' || substr(md5(random()::text), 1, 8), 'SWAP_APPROVE', 'Duyệt hoặc từ chối yêu cầu đổi ca', 'SHIFT_SWAP')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Core Permissions cho Admin (Full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND p.module = 'SHIFT_SWAP'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map Core Permissions cho nhân viên y tế (View, Create - KHÔNG có Approve)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND p.code IN ('SWAP_VIEW', 'SWAP_CREATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert API Permissions
INSERT INTO api_permissions (api_id, method, endpoint, description, module) VALUES
('API_SWAP_VIEW_ALL', 'GET', '/api/shift-swaps', 'Lấy danh sách yêu cầu đổi ca', 'SHIFT_SWAP'),
('API_SWAP_VIEW_DETAIL', 'GET', '/api/shift-swaps/:id', 'Xem chi tiết yêu cầu đổi ca', 'SHIFT_SWAP'),
('API_SWAP_CREATE', 'POST', '/api/shift-swaps', 'Tạo yêu cầu đổi ca mới', 'SHIFT_SWAP'),
('API_SWAP_APPROVE', 'PATCH', '/api/shift-swaps/:id/approve', 'Duyệt yêu cầu đổi ca', 'SHIFT_SWAP'),
('API_SWAP_REJECT', 'PATCH', '/api/shift-swaps/:id/reject', 'Từ chối yêu cầu đổi ca', 'SHIFT_SWAP')
ON CONFLICT (method, endpoint) DO NOTHING;

-- 5. Map API Permissions cho Admin
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
AND a.module = 'SHIFT_SWAP'
ON CONFLICT (role_id, api_id) DO NOTHING;

-- Map API Permissions cho nhân viên y tế (View, Create)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r
CROSS JOIN api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'CASHIER')
AND a.api_id IN ('API_SWAP_VIEW_ALL', 'API_SWAP_VIEW_DETAIL', 'API_SWAP_CREATE')
ON CONFLICT (role_id, api_id) DO NOTHING;
