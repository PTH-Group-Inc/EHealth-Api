-- Migration: Thêm metadata JSONB cho document chunks
-- Lưu trữ page, section heading, source_type cho mỗi chunk
-- Chunks cũ sẽ có metadata = '{}' (backward compatible)

ALTER TABLE ai_document_chunks 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN ai_document_chunks.metadata IS 
    'Metadata chunk: {"page_start": 3, "page_end": 3, "section": "Bảng giá dịch vụ", "source_type": "PRICING"}';
