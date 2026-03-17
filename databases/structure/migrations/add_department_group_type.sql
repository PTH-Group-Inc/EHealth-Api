-- =====================================================================
-- MIGRATION: Thêm cột group_type vào bảng departments
-- Phân loại Khoa theo Khối: Lâm sàng (CLINICAL) / Cận lâm sàng (PARACLINICAL)
-- =====================================================================

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS group_type VARCHAR(20) DEFAULT 'CLINICAL';

COMMENT ON COLUMN departments.group_type IS 'Phân loại Khối: CLINICAL (Lâm sàng) hoặc PARACLINICAL (Cận lâm sàng)';

-- Cập nhật Khối Cận lâm sàng cho các Khoa hiện có (nếu đã có dữ liệu)
UPDATE departments SET group_type = 'PARACLINICAL'
WHERE code IN ('KHOA-XN', 'KHOA-CDHA', 'KHOA-DUOC');
