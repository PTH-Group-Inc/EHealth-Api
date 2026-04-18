-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: AI KNOWLEDGE BASE (RAG - Retrieval-Augmented Generation)
-- ══════════════════════════════════════════════════════════════════════════════
-- YÊU CẦU: Database phải cài extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Bảng lưu trữ thông tin file/tài liệu gốc
CREATE TABLE IF NOT EXISTS ai_documents (
    document_id VARCHAR(50) PRIMARY KEY, -- Khóa chính tự sinh (e.g. DOC_1234)
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'PDF',
    uploaded_by VARCHAR(50) REFERENCES users(users_id) ON DELETE SET NULL, -- Admin nào up
    file_size_bytes BIGINT,
    total_chunks INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PROCESSING', -- PROCESSING, COMPLETED, FAILED
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng lưu trữ mãnh cắt văn bản (Chunks) và Vector
-- Bảng này sẽ rất lớn, mỗi tài liệu 5 trang PDF có thể sinh ra ~20 chunks
CREATE TABLE IF NOT EXISTS ai_document_chunks (
    chunk_id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES ai_documents(document_id) ON DELETE CASCADE,
    chunk_index INT NOT NULL, -- Thứ tự chunk trong file
    content TEXT NOT NULL,    -- Đoạn văn bản đã cắt
    embedding vector(768),    -- Vector 768 chiều (Dành cho text-embedding-004 của Google)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tạo Index cho thuật toán tìm kiếm Vector hiệu suất cao (HNSW Index)
-- Dùng khoảng cách Cosine Distance (vector_cosine_ops)
CREATE INDEX IF NOT EXISTS ai_doc_chunks_embedding_idx 
ON ai_document_chunks USING hnsw (embedding vector_cosine_ops);

-- Cập nhật updated_at tự động (nếu hệ thống đã định nghĩa hàm update_timestamp)
-- DO $$ 
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_timestamp') THEN
--         CREATE TRIGGER trigger_update_ai_documents
--         BEFORE UPDATE ON ai_documents
--         FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
--     END IF;
-- END $$;
