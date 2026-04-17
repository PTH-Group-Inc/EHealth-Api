-- ==============================================================================
-- MIGRATION: Them avatar_url JSONB cho patients de luu anh ho so rieng tung patient
-- Muc dich: Dong bo wire shape voi core profile va luu metadata Cloudinary
-- ==============================================================================

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS avatar_url JSONB DEFAULT '[]'::jsonb;

UPDATE patients
SET avatar_url = '[]'::jsonb
WHERE avatar_url IS NULL;
