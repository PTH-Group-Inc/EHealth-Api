-- Migration: Thêm cột logo_url cho branches, departments, specialties
-- Mục đích: Hỗ trợ hiển thị hình ảnh trên Mobile App

ALTER TABLE branches ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE specialties ADD COLUMN IF NOT EXISTS logo_url TEXT;
