-- =========================================================================
-- MODULE 2.11: QUẢN LÝ GIƯỜNG BỆNH (BED MANAGEMENT)
-- =========================================================================

-- 1. TẠO BẢNG BEDS
CREATE TABLE IF NOT EXISTS public.beds (
    bed_id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES public.facilities(facilities_id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES public.branches(branches_id) ON DELETE CASCADE,
    department_id VARCHAR(50) REFERENCES public.departments(departments_id) ON DELETE SET NULL,
    room_id VARCHAR(50) REFERENCES public.medical_rooms(medical_rooms_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(20) NOT NULL DEFAULT 'EMPTY',
    description TEXT,

    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT unique_bed_code_per_branch UNIQUE (branch_id, code),
    CONSTRAINT chk_bed_type CHECK (type IN ('STANDARD', 'EMERGENCY', 'ICU')),
    CONSTRAINT chk_bed_status CHECK (status IN ('EMPTY', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'))
);

-- ==============================================================================
-- 2. API PERMISSIONS - Đăng ký API Endpoints vào api_permissions
-- ==============================================================================

INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_BED_LIST',        'BED', 'GET',    '/api/beds',                'Lấy danh sách giường bệnh'),
('API_BED_DETAIL',      'BED', 'GET',    '/api/beds/:id',            'Xem chi tiết giường bệnh'),
('API_BED_CREATE',      'BED', 'POST',   '/api/beds',                'Tạo mới giường bệnh'),
('API_BED_UPDATE',      'BED', 'PUT',    '/api/beds/:id',            'Cập nhật thông tin giường'),
('API_BED_ASSIGN',      'BED', 'PUT',    '/api/beds/:id/assign',     'Gán giường vào phòng/khoa'),
('API_BED_STATUS',      'BED', 'PUT',    '/api/beds/:id/status',     'Cập nhật trạng thái giường'),
('API_BED_DELETE',      'BED', 'DELETE', '/api/beds/:id',            'Xóa giường bệnh')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 3. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN & STAFF: toàn quyền trên tất cả endpoints giường bệnh
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_BED_LIST', 'API_BED_DETAIL', 'API_BED_CREATE', 'API_BED_UPDATE',
    'API_BED_ASSIGN', 'API_BED_STATUS', 'API_BED_DELETE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR: xem danh sách + chi tiết (cần biết giường nào trống để chỉ định bệnh nhân)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'DOCTOR'
  AND a.api_id IN ('API_BED_LIST', 'API_BED_DETAIL')
ON CONFLICT DO NOTHING;

-- NURSE: xem + đổi trạng thái giường (tiếp nhận, dọn dẹp)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'NURSE'
  AND a.api_id IN ('API_BED_LIST', 'API_BED_DETAIL', 'API_BED_STATUS')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 4. JWT PERMISSIONS - Đăng ký quyền cho middleware authorizePermissions
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_BED_VIEW',   'BED_VIEW',   'BED', 'Xem danh sách và chi tiết giường bệnh'),
    ('PERM_BED_CREATE', 'BED_CREATE', 'BED', 'Thêm mới giường bệnh'),
    ('PERM_BED_UPDATE', 'BED_UPDATE', 'BED', 'Cập nhật thông tin, gán phòng/khoa, đổi trạng thái giường'),
    ('PERM_BED_DELETE', 'BED_DELETE', 'BED', 'Xóa giường bệnh')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 5. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('BED_VIEW', 'BED_CREATE', 'BED_UPDATE', 'BED_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: toàn quyền quản lý (trừ xóa)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('BED_VIEW', 'BED_CREATE', 'BED_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('BED_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: xem + cập nhật trạng thái
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('BED_VIEW', 'BED_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;
