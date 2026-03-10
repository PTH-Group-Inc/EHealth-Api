-- Script for Module 2.12: Booking/Operation Configurations (Cấu hình Quy tắc đặt khám)
-- N-tier Architecture | PostgreSQL | E-Health System
-- Cơ chế: Branch-level Override + Global Fallback (system_settings)

-- ==============================================================================
-- 1. BOOKING CONFIGURATIONS TABLE
-- Mục đích: Lưu cấu hình quy tắc đặt khám RIÊNG cho từng Chi nhánh.
--   Nếu một field là NULL → Service sẽ fallback về giá trị Global (system_settings).
-- Liên kết: Facility (facility_id) → Branch (branch_id) — UNIQUE per branch.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.booking_configurations (
    config_id VARCHAR(50) PRIMARY KEY,                                                    -- Format: BKCFG_xxxxxxxx
    facility_id VARCHAR(50) NOT NULL REFERENCES public.facilities(facilities_id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES public.branches(branches_id) ON DELETE CASCADE,

    -- Số bệnh nhân tối đa có thể đặt vào 1 slot khám (NULL = dùng Global)
    max_patients_per_slot INT,

    -- Thời gian đệm (phút) giữa các slot khám (VD: 5 phút để bác sĩ nghỉ tay)
    buffer_duration INT,

    -- Cho phép đặt lịch tối đa bao nhiêu ngày trong tương lai (VD: 30 ngày)
    advance_booking_days INT,

    -- Bệnh nhân phải đặt lịch trước ít nhất bao nhiêu giờ (VD: 2 giờ)
    minimum_booking_hours INT,

    -- Cho phép hủy/đổi lịch trước bao nhiêu giờ trước giờ khám (VD: 12 giờ)
    cancellation_allowed_hours INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Mỗi chi nhánh chỉ có 1 bản ghi cấu hình
    CONSTRAINT uq_booking_config_branch UNIQUE (branch_id),

    -- Validation constraints
    CONSTRAINT chk_max_patients CHECK (max_patients_per_slot IS NULL OR (max_patients_per_slot >= 1 AND max_patients_per_slot <= 50)),
    CONSTRAINT chk_buffer_duration CHECK (buffer_duration IS NULL OR (buffer_duration >= 0 AND buffer_duration <= 60)),
    CONSTRAINT chk_advance_days CHECK (advance_booking_days IS NULL OR (advance_booking_days >= 1 AND advance_booking_days <= 365)),
    CONSTRAINT chk_min_booking_hours CHECK (minimum_booking_hours IS NULL OR (minimum_booking_hours >= 0 AND minimum_booking_hours <= 72)),
    CONSTRAINT chk_cancel_hours CHECK (cancellation_allowed_hours IS NULL OR (cancellation_allowed_hours >= 0 AND cancellation_allowed_hours <= 168))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_config_facility ON public.booking_configurations(facility_id);
CREATE INDEX IF NOT EXISTS idx_booking_config_branch ON public.booking_configurations(branch_id);

-- ==============================================================================
-- 2. API PERMISSIONS — Đăng ký endpoint vào bảng api_permissions
-- ==============================================================================

INSERT INTO api_permissions (api_id, method, endpoint, description, module, status)
VALUES
    ('API_BKCFG_VIEW',       'GET',  '/api/booking-configs/branch/:branchId',      'Xem cấu hình đặt khám (Resolved) của chi nhánh',  'BOOKING_CONFIG', 'ACTIVE'),
    ('API_BKCFG_VIEW_RAW',   'GET',  '/api/booking-configs/branch/:branchId/raw',  'Xem cấu hình thô (Raw) của chi nhánh',             'BOOKING_CONFIG', 'ACTIVE'),
    ('API_BKCFG_UPSERT',     'PUT',  '/api/booking-configs/branch/:branchId',      'Cập nhật cấu hình đặt khám cho chi nhánh',         'BOOKING_CONFIG', 'ACTIVE')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ==============================================================================
-- 3. ROLE → API PERMISSIONS (role_api_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền xem + sửa
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'ADMIN'
  AND a.api_id IN ('API_BKCFG_VIEW', 'API_BKCFG_VIEW_RAW', 'API_BKCFG_UPSERT')
ON CONFLICT DO NOTHING;

-- STAFF: xem + sửa
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code = 'STAFF'
  AND a.api_id IN ('API_BKCFG_VIEW', 'API_BKCFG_VIEW_RAW', 'API_BKCFG_UPSERT')
ON CONFLICT DO NOTHING;

-- DOCTOR & NURSE: chỉ xem (resolved)
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id
FROM roles r, api_permissions a
WHERE r.code IN ('DOCTOR', 'NURSE')
  AND a.api_id IN ('API_BKCFG_VIEW')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 4. JWT PERMISSIONS — Đăng ký quyền cho middleware authorizePermissions
-- ==============================================================================

INSERT INTO permissions (permissions_id, code, module, description)
VALUES
    ('PERM_BKCFG_VIEW', 'BOOKING_CONFIG_VIEW', 'BOOKING_CONFIG', 'Xem cấu hình quy tắc đặt khám của chi nhánh'),
    ('PERM_BKCFG_EDIT', 'BOOKING_CONFIG_EDIT', 'BOOKING_CONFIG', 'Chỉnh sửa cấu hình quy tắc đặt khám của chi nhánh')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 5. ROLE → JWT PERMISSIONS (role_permissions)
-- ==============================================================================

-- ADMIN: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('BOOKING_CONFIG_VIEW', 'BOOKING_CONFIG_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'STAFF'
  AND p.code IN ('BOOKING_CONFIG_VIEW', 'BOOKING_CONFIG_EDIT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.code IN ('BOOKING_CONFIG_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: chỉ xem
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id
FROM roles r, permissions p
WHERE r.code = 'NURSE'
  AND p.code IN ('BOOKING_CONFIG_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;
