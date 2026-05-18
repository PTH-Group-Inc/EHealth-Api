-- Migration: Thêm cột `relationship` + `is_default` vào bảng `patients`.
-- Ngày: 2026-05-18
-- Task: BACKEND_TASKS.md #12
--
-- Lý do: FE cho user chọn relationship (SELF/SPOUSE/CHILD/PARENT/SIBLING/OTHER) khi book hộ
-- người thân, nhưng BE trước đây không lưu → FE phải fallback localStorage và sẽ mất khi clear cache.
-- Migration này persist relationship + cờ is_default cho hồ sơ mặc định (1 default / account).
--
-- Safety guarantees:
-- 1) Idempotent: chạy nhiều lần không lỗi (IF NOT EXISTS + DO $$ guard cho mọi mutation).
-- 2) Table-existence check: nếu `patients` chưa tồn tại → migration bỏ qua silently + RAISE NOTICE.
--    Tránh fail toàn bộ script khi chạy trên DB mới chưa init structure.
-- 3) Constraint chỉ tạo nếu chưa có (DO $$ check pg_constraint).
-- 4) Index dùng IF NOT EXISTS.
-- 5) Backfill chỉ update row chưa có default trong account (NOT EXISTS guard).
--
-- Lưu ý đặt tên bảng: dự án dùng bảng `patients` (không phải `patient_profiles` như draft task ban đầu).

DO $$
BEGIN
    -- Bỏ qua nếu bảng patients chưa tồn tại (DB mới chưa init)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'patients'
    ) THEN
        RAISE NOTICE '[skip] Bảng `patients` chưa tồn tại — chạy CREATE TABLE từ structure scripts trước.';
        RETURN;
    END IF;

    RAISE NOTICE '[apply] Migration relationship + is_default cho `patients`';

    -- 1. Thêm column relationship
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS relationship VARCHAR(20) DEFAULT 'SELF';

    -- 2. Thêm column is_default
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

    -- 3. Constraint relationship enum
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_relationship_check') THEN
        ALTER TABLE patients
            ADD CONSTRAINT patients_relationship_check
            CHECK (relationship IN ('SELF', 'PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'OTHER'));
        RAISE NOTICE '[apply] Added constraint patients_relationship_check';
    END IF;
END $$;

-- 4. Index để query nhanh theo account_id + is_default
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'patients'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_patients_account_default
            ON patients (account_id, is_default)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

-- 5. Backfill: set is_default=TRUE cho hồ sơ đầu tiên của mỗi account
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'patients'
    ) THEN
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
        RAISE NOTICE '[apply] Backfill is_default hoàn tất';
    END IF;
END $$;

-- 6. Comments
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'relationship'
    ) THEN
        COMMENT ON COLUMN patients.relationship IS 'Quan hệ giữa hồ sơ với chủ tài khoản: SELF/PARENT/CHILD/SPOUSE/SIBLING/OTHER';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'is_default'
    ) THEN
        COMMENT ON COLUMN patients.is_default IS 'Hồ sơ mặc định khi đặt lịch (1 default per account)';
    END IF;
END $$;
