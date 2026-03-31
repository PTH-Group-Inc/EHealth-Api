-- ==============================================================================
-- MIGRATION: Chuyển avatar_url từ TEXT → JSONB để hỗ trợ nhiều ảnh đại diện
-- Mục đích: Cho phép user lưu tối đa 5 ảnh avatar, mỗi ảnh lưu url + public_id + uploaded_at
-- ==============================================================================

-- Bước 1: Chuyển đổi dữ liệu cũ sang format JSONB mới
ALTER TABLE user_profiles 
ALTER COLUMN avatar_url TYPE JSONB 
USING CASE 
    WHEN avatar_url IS NOT NULL AND avatar_url != '' 
    THEN jsonb_build_array(jsonb_build_object(
        'url', avatar_url, 
        'public_id', '', 
        'uploaded_at', TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ))
    ELSE '[]'::jsonb 
END;

-- Bước 2: Set default cho các record mới
ALTER TABLE user_profiles ALTER COLUMN avatar_url SET DEFAULT '[]'::jsonb;

-- Bước 3: Update các row NULL thành mảng rỗng
UPDATE user_profiles SET avatar_url = '[]'::jsonb WHERE avatar_url IS NULL;
