-- ============================================================
-- Migration: Đổi vector dimension từ 768 (Gemini) sang 1536 (OpenAI)
-- Lý do: Chuyển từ gemini-embedding-002 sang text-embedding-3-small
-- Thực hiện: Chạy script này TRƯỚC KHI re-upload tài liệu
-- ============================================================

-- Bước 1: Xóa toàn bộ dữ liệu embedding cũ (768d → không tương thích 1536d)
TRUNCATE TABLE "public"."ai_document_chunks";

-- Đặt lại trạng thái tất cả documents về FAILED để re-upload
UPDATE "public"."ai_documents"
SET status = 'FAILED', chunk_count = 0, error_message = 'Re-embedding required: model changed to text-embedding-3-small (1536d)'
WHERE status = 'COMPLETED';

-- Bước 2: Đổi kiểu cột embedding từ vector(768) sang vector(1536)
ALTER TABLE "public"."ai_document_chunks"
    ALTER COLUMN embedding TYPE vector(1536)
    USING embedding::text::vector(1536);

-- Bước 3: Tái tạo index cosine similarity (hiệu năng tìm kiếm)
-- Xóa index cũ nếu tồn tại
DROP INDEX IF EXISTS "public"."idx_ai_doc_chunks_embedding";

-- Tạo index mới cho 1536 dimension
CREATE INDEX idx_ai_doc_chunks_embedding
    ON "public"."ai_document_chunks"
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================================
-- Sau khi chạy migration này:
-- 1. Đảm bảo OPENAI_API_KEY được thêm vào .env
-- 2. Re-upload lại tất cả tài liệu PDF qua Admin API
-- ============================================================
