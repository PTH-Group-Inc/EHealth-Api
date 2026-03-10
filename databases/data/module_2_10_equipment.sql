-- Script for Module 2.10: Medical Equipment Management (Quản lý Trang thiết bị Y tế)
-- N-tier Architecture | PostgreSQL | E-Health System

-- ==============================================================================
-- 1. MEDICAL EQUIPMENTS TABLE
-- Mục đích: Lưu trữ toàn bộ thông tin cơ sở của các trang thiết bị y tế.
-- Liên kết: Facility (facility_id) → Branch (branch_id) → Room (current_room_id)
--   Thiết bị thuộc về 1 cơ sở, nằm tại 1 chi nhánh, có thể đang đặt ở 1 phòng.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.medical_equipments (
    equipment_id VARCHAR(50) PRIMARY KEY, -- Format: EQ_xxxxxxx
    facility_id VARCHAR(50) NOT NULL REFERENCES public.facilities(facilities_id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES public.branches(branches_id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- Mã quản lý tài sản, ví dụ: SA-4D-01 (unique per branch usually, but globally unique here for simplicity)
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    manufacturing_date DATE,
    purchase_date DATE,
    warranty_expiration DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, BROKEN, INACTIVE
    current_room_id VARCHAR(50) REFERENCES public.medical_rooms(medical_rooms_id) ON DELETE SET NULL, -- Phòng hiện tại. Null = đang để trong kho
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    CONSTRAINT uq_equipment_code UNIQUE (code),
    CONSTRAINT chk_equipment_status CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'BROKEN', 'INACTIVE'))
);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_equipments_facility ON public.medical_equipments(facility_id);
CREATE INDEX IF NOT EXISTS idx_equipments_branch ON public.medical_equipments(branch_id);
CREATE INDEX IF NOT EXISTS idx_equipments_room ON public.medical_equipments(current_room_id);
CREATE INDEX IF NOT EXISTS idx_equipments_status ON public.medical_equipments(status);

-- ==============================================================================
-- 2. EQUIPMENT MAINTENANCE LOGS TABLE
-- Mục đích: Lưu trữ lịch sử bảo trì, kiểm định định kỳ hoặc sửa chữa đột xuất.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.equipment_maintenance_logs (
    log_id VARCHAR(50) PRIMARY KEY, -- Format: EML_xxxxxxx
    equipment_id VARCHAR(50) NOT NULL REFERENCES public.medical_equipments(equipment_id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL, -- ROUTINE (Bảo trì định kỳ), REPAIR (Sửa chữa), INSPECTION (Kiểm định)
    description TEXT,
    performed_by VARCHAR(255), -- Người hoặc đơn vị thực hiện
    cost DECIMAL(15,2) DEFAULT 0.00,
    next_maintenance_date DATE, -- Ngày bảo trì/kiểm định tiếp theo dự kiến
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_maintenance_type CHECK (maintenance_type IN ('ROUTINE', 'REPAIR', 'INSPECTION'))
);

-- Index for history
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equip ON public.equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON public.equipment_maintenance_logs(maintenance_date);

-- ==============================================================================
-- 3. API PERMISSIONS - Đăng ký API Endpoints vào api_permissions
-- ==============================================================================

-- Equipment CRUD (2.10)
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
('API_EQ_LIST',          'EQUIPMENT', 'GET',    '/api/equipments',                       'Lấy danh sách thiết bị y tế'),
('API_EQ_DETAIL',        'EQUIPMENT', 'GET',    '/api/equipments/:id',                   'Xem chi tiết thiết bị'),
('API_EQ_CREATE',        'EQUIPMENT', 'POST',   '/api/equipments',                       'Tạo mới thiết bị y tế'),
('API_EQ_UPDATE',        'EQUIPMENT', 'PUT',    '/api/equipments/:id',                   'Cập nhật thông tin thiết bị'),
('API_EQ_STATUS',        'EQUIPMENT', 'PUT',    '/api/equipments/:id/status',             'Cập nhật trạng thái thiết bị'),
('API_EQ_ASSIGN_ROOM',   'EQUIPMENT', 'PUT',    '/api/equipments/:id/assign-room',        'Gán thiết bị vào phòng / thu hồi'),
('API_EQ_DELETE',        'EQUIPMENT', 'DELETE', '/api/equipments/:id',                   'Xóa thiết bị y tế'),
('API_EQ_MAINT_LIST',    'EQUIPMENT', 'GET',    '/api/equipments/:id/maintenance',        'Xem lịch sử bảo trì thiết bị'),
('API_EQ_MAINT_CREATE',  'EQUIPMENT', 'POST',   '/api/equipments/:id/maintenance',        'Tạo bản ghi bảo trì mới'),
('API_EQ_MAINT_UPDATE',  'EQUIPMENT', 'PUT',    '/api/equipments/maintenance/:logId',     'Cập nhật bản ghi bảo trì'),
('API_EQ_MAINT_DELETE',  'EQUIPMENT', 'DELETE', '/api/equipments/maintenance/:logId',     'Xóa bản ghi bảo trì')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 4. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN & STAFF: full quyền trên tất cả endpoints thiết bị
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('ADMIN', 'STAFF')
  AND a.api_id IN (
    'API_EQ_LIST', 'API_EQ_DETAIL', 'API_EQ_CREATE', 'API_EQ_UPDATE',
    'API_EQ_STATUS', 'API_EQ_ASSIGN_ROOM', 'API_EQ_DELETE',
    'API_EQ_MAINT_LIST', 'API_EQ_MAINT_CREATE', 'API_EQ_MAINT_UPDATE', 'API_EQ_MAINT_DELETE'
  )
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: chỉ xem danh sách, chi tiết, lịch sử bảo trì
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN (
    'API_EQ_LIST', 'API_EQ_DETAIL', 'API_EQ_MAINT_LIST'
  )
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. JWT PERMISSIONS - Đăng ký quyền cho middleware authorizePermissions
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_EQ_VIEW',   'EQUIPMENT_VIEW',   'EQUIPMENT', 'Xem danh sách và chi tiết thiết bị y tế'),
    ('PERM_EQ_CREATE', 'EQUIPMENT_CREATE', 'EQUIPMENT', 'Thêm mới thiết bị y tế'),
    ('PERM_EQ_UPDATE', 'EQUIPMENT_UPDATE', 'EQUIPMENT', 'Cập nhật, gán phòng, đổi trạng thái và tạo bảo trì cho thiết bị'),
    ('PERM_EQ_DELETE', 'EQUIPMENT_DELETE', 'EQUIPMENT', 'Xóa thiết bị và xóa bản ghi bảo trì')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 6. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_UPDATE', 'EQUIPMENT_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: toàn quyền quản lý (trừ xóa)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_UPDATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('EQUIPMENT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('EQUIPMENT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

