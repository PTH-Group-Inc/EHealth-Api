ALTER TABLE appointment_change_logs
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS approved_by_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

UPDATE appointment_change_logs
SET approval_status = CASE
    WHEN approval_status IS NULL AND change_type = 'CANCEL' THEN 'APPROVED'
    WHEN approval_status IS NULL THEN 'APPROVED'
    ELSE approval_status
END,
    approved_by_type = CASE
        WHEN approved_by_type IS NULL THEN 'USER'
        ELSE approved_by_type
    END,
    approved_at = COALESCE(approved_at, created_at)
WHERE approval_status IS NULL
   OR approved_by_type IS NULL
   OR approved_at IS NULL;
