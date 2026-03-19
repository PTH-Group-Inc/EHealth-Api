-- *********************************************************************
-- MODULE 9.9: QUẢN LÝ PHÂN QUYỀN THU NGÂN
-- (Cashier Authorization Management)
-- *********************************************************************

-- =====================================================================
-- 1. cashier_profiles — Hồ sơ thu ngân
-- =====================================================================
CREATE TABLE IF NOT EXISTS cashier_profiles (
    cashier_profile_id     VARCHAR(50) PRIMARY KEY,
    user_id                VARCHAR(50) NOT NULL UNIQUE,       -- 1 user = 1 profile
    employee_code          VARCHAR(50),                       -- Mã NV thu ngân
    branch_id              VARCHAR(50),
    facility_id            VARCHAR(50),
    -- Quyền thao tác
    can_collect_payment    BOOLEAN DEFAULT TRUE,
    can_process_refund     BOOLEAN DEFAULT FALSE,
    can_void_transaction   BOOLEAN DEFAULT FALSE,
    can_open_shift         BOOLEAN DEFAULT TRUE,
    can_close_shift        BOOLEAN DEFAULT TRUE,
    -- Trạng thái
    is_active              BOOLEAN DEFAULT TRUE,
    supervisor_id          VARCHAR(50),                       -- Quản lý trực tiếp
    notes                  TEXT,
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(users_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branches_id) ON DELETE SET NULL,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_id) REFERENCES users(users_id),
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

CREATE INDEX IF NOT EXISTS idx_cashier_prof_user ON cashier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cashier_prof_branch ON cashier_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_cashier_prof_facility ON cashier_profiles(facility_id);
CREATE INDEX IF NOT EXISTS idx_cashier_prof_active ON cashier_profiles(is_active) WHERE is_active = TRUE;

-- =====================================================================
-- 2. cashier_operation_limits — Giới hạn thao tác
-- =====================================================================
CREATE TABLE IF NOT EXISTS cashier_operation_limits (
    limit_id               VARCHAR(50) PRIMARY KEY,
    cashier_profile_id     VARCHAR(50) NOT NULL UNIQUE,
    -- Giới hạn mỗi giao dịch
    max_single_payment     DECIMAL(15,2),                     -- Max VND 1 GD thu
    max_single_refund      DECIMAL(15,2),                     -- Max VND 1 GD hoàn
    max_single_void        DECIMAL(15,2),                     -- Max VND 1 GD VOID
    -- Giới hạn mỗi ca
    max_shift_total        DECIMAL(15,2),                     -- Tổng thu trong 1 ca
    max_shift_refund_total DECIMAL(15,2),                     -- Tổng hoàn trong ca
    max_shift_void_count   INT,                               -- Số VOID trong ca
    -- Giới hạn mỗi ngày
    max_daily_total        DECIMAL(15,2),
    max_daily_refund_total DECIMAL(15,2),
    max_daily_void_count   INT,
    -- Phê duyệt
    require_approval_above DECIMAL(15,2),                     -- GD > X VND cần supervisor
    created_by             VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_profile_id) REFERENCES cashier_profiles(cashier_profile_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(users_id)
);

-- =====================================================================
-- 3. cashier_activity_logs — Nhật ký hoạt động
-- =====================================================================
CREATE TABLE IF NOT EXISTS cashier_activity_logs (
    log_id                 VARCHAR(50) PRIMARY KEY,
    cashier_profile_id     VARCHAR(50),
    user_id                VARCHAR(50) NOT NULL,
    shift_id               VARCHAR(50),
    action_type            VARCHAR(30) NOT NULL,               -- SHIFT_OPEN, SHIFT_CLOSE, SHIFT_LOCK, SHIFT_UNLOCK,
                                                               -- PAYMENT, VOID, REFUND, LIMIT_EXCEEDED,
                                                               -- FORCE_CLOSE, HANDOVER, PROFILE_UPDATE
    action_detail          JSONB,                              -- {transaction_id, amount, reason, ...}
    ip_address             VARCHAR(45),
    user_agent             TEXT,
    facility_id            VARCHAR(50),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_profile_id) REFERENCES cashier_profiles(cashier_profile_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(users_id),
    FOREIGN KEY (shift_id) REFERENCES cashier_shifts(cashier_shifts_id) ON DELETE SET NULL,
    FOREIGN KEY (facility_id) REFERENCES facilities(facilities_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cashier_log_profile ON cashier_activity_logs(cashier_profile_id);
CREATE INDEX IF NOT EXISTS idx_cashier_log_user ON cashier_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cashier_log_shift ON cashier_activity_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_cashier_log_action ON cashier_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_cashier_log_created ON cashier_activity_logs(created_at DESC);

-- =====================================================================
-- 4. ALTER cashier_shifts — Mở rộng lock/handover
-- =====================================================================
ALTER TABLE cashier_shifts
    ADD COLUMN IF NOT EXISTS locked_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS lock_reason   TEXT,
    ADD COLUMN IF NOT EXISTS force_closed  BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS handover_to   VARCHAR(50);

DO $$ BEGIN
    ALTER TABLE cashier_shifts
        ADD CONSTRAINT fk_cashier_shifts_locked_by FOREIGN KEY (locked_by) REFERENCES users(users_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE cashier_shifts
        ADD CONSTRAINT fk_cashier_shifts_handover_to FOREIGN KEY (handover_to) REFERENCES users(users_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- *********************************************************************
-- JWT PERMISSIONS
-- *********************************************************************
INSERT INTO permissions (permissions_id, code, module, description) VALUES
('PERM_CASHIER_AUTH_VIEW',      'CASHIER_AUTH_VIEW',      'BILLING', 'Xem hồ sơ thu ngân, giới hạn, nhật ký'),
('PERM_CASHIER_AUTH_MANAGE',    'CASHIER_AUTH_MANAGE',    'BILLING', 'Quản lý hồ sơ thu ngân, phân quyền, giới hạn'),
('PERM_CASHIER_SHIFT_CONTROL',  'CASHIER_SHIFT_CONTROL',  'BILLING', 'Khóa/mở khóa/force-close/bàn giao ca'),
('PERM_CASHIER_LOG_VIEW',       'CASHIER_LOG_VIEW',       'BILLING', 'Xem nhật ký hoạt động thu ngân'),
('PERM_CASHIER_DASHBOARD',      'CASHIER_DASHBOARD',      'BILLING', 'Xem dashboard phân quyền thu ngân')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'CASHIER_AUTH_VIEW','CASHIER_AUTH_MANAGE','CASHIER_SHIFT_CONTROL',
    'CASHIER_LOG_VIEW','CASHIER_DASHBOARD'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.roles_id, p.permissions_id FROM roles r, permissions p
WHERE r.code = 'STAFF' AND p.code IN (
    'CASHIER_AUTH_VIEW','CASHIER_LOG_VIEW'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- *********************************************************************
-- API PERMISSIONS
-- *********************************************************************
INSERT INTO api_permissions (api_id, module, method, endpoint, description) VALUES
-- Nhóm 1: Hồ sơ thu ngân
('API_CASH_PROF_CREATE',      'BILLING', 'POST',   '/api/billing/cashier-auth/profiles',                   'Gán user làm thu ngân'),
('API_CASH_PROF_LIST',        'BILLING', 'GET',    '/api/billing/cashier-auth/profiles',                   'Danh sách thu ngân'),
('API_CASH_PROF_DETAIL',      'BILLING', 'GET',    '/api/billing/cashier-auth/profiles/:id',               'Chi tiết hồ sơ thu ngân'),
('API_CASH_PROF_UPDATE',      'BILLING', 'PUT',    '/api/billing/cashier-auth/profiles/:id',               'Cập nhật hồ sơ thu ngân'),
('API_CASH_PROF_DELETE',      'BILLING', 'DELETE', '/api/billing/cashier-auth/profiles/:id',               'Vô hiệu hóa thu ngân'),
('API_CASH_PROF_BY_USER',     'BILLING', 'GET',    '/api/billing/cashier-auth/profiles/by-user/:userId',   'Tìm profile theo userId'),
-- Nhóm 2: Giới hạn
('API_CASH_LIMIT_CREATE',     'BILLING', 'POST',   '/api/billing/cashier-auth/limits',                     'Đặt giới hạn thao tác'),
('API_CASH_LIMIT_GET',        'BILLING', 'GET',    '/api/billing/cashier-auth/limits/:profileId',          'Xem giới hạn'),
('API_CASH_LIMIT_UPDATE',     'BILLING', 'PUT',    '/api/billing/cashier-auth/limits/:profileId',          'Cập nhật giới hạn'),
('API_CASH_LIMIT_CHECK',      'BILLING', 'POST',   '/api/billing/cashier-auth/limits/check',               'Kiểm tra giới hạn trước GD'),
-- Nhóm 3: Khóa ca
('API_CASH_SHIFT_LOCK',       'BILLING', 'PATCH',  '/api/billing/cashier-auth/shifts/:shiftId/lock',       'Khóa ca thu ngân'),
('API_CASH_SHIFT_UNLOCK',     'BILLING', 'PATCH',  '/api/billing/cashier-auth/shifts/:shiftId/unlock',     'Mở khóa ca'),
('API_CASH_SHIFT_FORCE',      'BILLING', 'PATCH',  '/api/billing/cashier-auth/shifts/:shiftId/force-close','Force close ca'),
('API_CASH_SHIFT_HANDOVER',   'BILLING', 'PATCH',  '/api/billing/cashier-auth/shifts/:shiftId/handover',   'Bàn giao ca'),
-- Nhóm 4: Nhật ký
('API_CASH_LOG_LIST',         'BILLING', 'GET',    '/api/billing/cashier-auth/activity-logs',              'Nhật ký hoạt động'),
('API_CASH_LOG_BY_PROF',      'BILLING', 'GET',    '/api/billing/cashier-auth/activity-logs/:profileId',   'Nhật ký 1 thu ngân'),
('API_CASH_LOG_BY_SHIFT',     'BILLING', 'GET',    '/api/billing/cashier-auth/activity-logs/shift/:shiftId','Nhật ký 1 ca'),
-- Nhóm 5: Dashboard
('API_CASH_DASHBOARD',        'BILLING', 'GET',    '/api/billing/cashier-auth/dashboard',                  'Dashboard thu ngân'),
('API_CASH_STATS',            'BILLING', 'GET',    '/api/billing/cashier-auth/stats/:profileId',           'Thống kê cá nhân'),
('API_CASH_SHIFTS_ACTIVE',    'BILLING', 'GET',    '/api/billing/cashier-auth/shifts/active',              'Ca đang mở')
ON CONFLICT (method, endpoint) DO NOTHING;

-- ROLE → API
INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'ADMIN' AND a.api_id IN (
    'API_CASH_PROF_CREATE','API_CASH_PROF_LIST','API_CASH_PROF_DETAIL','API_CASH_PROF_UPDATE',
    'API_CASH_PROF_DELETE','API_CASH_PROF_BY_USER',
    'API_CASH_LIMIT_CREATE','API_CASH_LIMIT_GET','API_CASH_LIMIT_UPDATE','API_CASH_LIMIT_CHECK',
    'API_CASH_SHIFT_LOCK','API_CASH_SHIFT_UNLOCK','API_CASH_SHIFT_FORCE','API_CASH_SHIFT_HANDOVER',
    'API_CASH_LOG_LIST','API_CASH_LOG_BY_PROF','API_CASH_LOG_BY_SHIFT',
    'API_CASH_DASHBOARD','API_CASH_STATS','API_CASH_SHIFTS_ACTIVE'
) ON CONFLICT DO NOTHING;

INSERT INTO role_api_permissions (role_id, api_id)
SELECT r.roles_id, a.api_id FROM roles r, api_permissions a
WHERE r.code = 'STAFF' AND a.api_id IN (
    'API_CASH_PROF_LIST','API_CASH_PROF_DETAIL','API_CASH_PROF_BY_USER',
    'API_CASH_LIMIT_GET','API_CASH_LIMIT_CHECK',
    'API_CASH_LOG_BY_PROF','API_CASH_LOG_BY_SHIFT',
    'API_CASH_STATS','API_CASH_SHIFTS_ACTIVE'
) ON CONFLICT DO NOTHING;
