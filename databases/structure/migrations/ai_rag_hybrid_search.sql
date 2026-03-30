-- =====================================================================
-- Migration: Hybrid Search — thêm Full-Text Search cho ai_document_chunks
-- Kết hợp vector cosine similarity + keyword matching (tsvector/GIN)
-- để tăng độ chính xác tìm kiếm RAG.
--
-- Cột tsv dùng GENERATED ALWAYS → PostgreSQL tự tính cho cả rows cũ + mới
-- Config 'simple' tokenize theo khoảng trắng — phù hợp cho tiếng Việt
-- (PostgreSQL không có built-in Vietnamese dictionary).
-- =====================================================================

-- 1. Thêm cột tsvector tự sinh từ content
ALTER TABLE ai_document_chunks 
    ADD COLUMN IF NOT EXISTS tsv tsvector 
    GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

-- 2. Tạo GIN Index cho Full-Text Search hiệu suất cao
CREATE INDEX IF NOT EXISTS idx_ai_chunks_fts 
    ON ai_document_chunks USING gin(tsv);
