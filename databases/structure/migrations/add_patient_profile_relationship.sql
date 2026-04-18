-- ============================================
-- Migration: Multi-Patient Profiles
-- Mô tả: Cho phép 1 account quản lý nhiều patient profiles (cho gia đình)
--
-- Thêm 2 cột vào bảng `patients`:
--   - relationship: quan hệ với chủ tài khoản (SELF/PARENT/CHILD/SPOUSE/SIBLING/OTHER)
--   - is_default: hồ sơ mặc định khi đặt lịch (chỉ 1 hồ sơ default per account)
--
-- Idempotent: chạy nhiều lần không lỗi (dùng IF NOT EXISTS)
-- ============================================

-- 1. Thêm column relationship
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS relationship VARCHAR(20) DEFAULT 'SELF';

-- 2. Thêm column is_default
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 3. Constraint: relationship phải nằm trong danh sách hợp lệ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patients_relationship_check'
    ) THEN
        ALTER TABLE patients
            ADD CONSTRAINT patients_relationship_check
            CHECK (relationship IN ('SELF', 'PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'OTHER'));
    END IF;
END $$;

-- 4. Index để query nhanh theo account_id + is_default
CREATE INDEX IF NOT EXISTS idx_patients_account_default
    ON patients (account_id, is_default)
    WHERE deleted_at IS NULL;

-- 5. Backfill: set is_default=TRUE cho hồ sơ đầu tiên của mỗi account
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY created_at ASC) AS rn
    FROM patients
    WHERE account_id IS NOT NULL AND deleted_at IS NULL
)
UPDATE patients p
SET is_default = TRUE
FROM ranked r
WHERE p.id = r.id AND r.rn = 1;

-- 6. Comment
COMMENT ON COLUMN patients.relationship IS 'Quan hệ với chủ tài khoản: SELF/PARENT/CHILD/SPOUSE/SIBLING/OTHER';
COMMENT ON COLUMN patients.is_default IS 'Hồ sơ mặc định khi đặt lịch (1 default per account)';
