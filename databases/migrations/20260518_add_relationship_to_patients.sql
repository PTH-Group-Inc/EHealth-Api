-- Migration: Thêm cột `relationship` + `is_default` vào bảng `patients`.
-- Ngày: 2026-05-18
-- Task: BACKEND_TASKS.md #12
--
-- Lý do: FE cho user chọn relationship (SELF/SPOUSE/CHILD/PARENT/SIBLING/OTHER) khi book hộ
-- người thân, nhưng BE trước đây không lưu → FE phải fallback localStorage và sẽ mất khi clear cache.
-- Migration này persist relationship + cờ is_default cho hồ sơ mặc định (1 default / account).
--
-- Idempotent: chạy nhiều lần không lỗi (dùng IF NOT EXISTS / DO $$ guard).
--
-- Lưu ý đặt tên bảng: dự án dùng bảng `patients` (không phải `patient_profiles` như draft task ban đầu).
-- Migration tương đương cũng có ở `databases/structure/migrations/add_patient_profile_relationship.sql`.

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

-- 5. Backfill: set is_default=TRUE cho hồ sơ đầu tiên của mỗi account (nếu chưa có default nào)
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY created_at ASC) AS rn
    FROM patients
    WHERE account_id IS NOT NULL AND deleted_at IS NULL
)
UPDATE patients p
SET is_default = TRUE
FROM ranked r
WHERE p.id = r.id
  AND r.rn = 1
  AND NOT EXISTS (
        SELECT 1 FROM patients p2
        WHERE p2.account_id = p.account_id
          AND p2.is_default = TRUE
          AND p2.deleted_at IS NULL
    );

-- 6. Comment
COMMENT ON COLUMN patients.relationship IS 'Quan hệ giữa hồ sơ với chủ tài khoản: SELF/PARENT/CHILD/SPOUSE/SIBLING/OTHER';
COMMENT ON COLUMN patients.is_default IS 'Hồ sơ mặc định khi đặt lịch (1 default per account)';
