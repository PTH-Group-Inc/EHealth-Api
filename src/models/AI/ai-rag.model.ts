import { AI_RAG_DOCUMENT_STATUS } from '../../constants/ai-rag.constant';

/**
 * Model ánh xạ bảng `ai_documents`
 * Lưu trữ thông tin metadata của file được upload
 */
export interface AiDocument {
    document_id: string;
    file_name: string;
    file_type: string;
    uploaded_by: string | null;
    file_size_bytes: number;
    total_chunks: number;
    status: typeof AI_RAG_DOCUMENT_STATUS[keyof typeof AI_RAG_DOCUMENT_STATUS];
    document_category: string;
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
}

/**
 * Metadata bổ sung cho từng chunk — giúp AI hiểu nguồn gốc nội dung.
 * Lưu trong cột `metadata JSONB` của `ai_document_chunks`.
 */
export interface ChunkMetadata {
    /** Trang bắt đầu của chunk trong PDF (1-indexed) */
    page_start?: number;
    /** Trang kết thúc của chunk (nếu chunk span nhiều trang) */
    page_end?: number;
    /** Section heading được detect tự động (vd: "Bảng giá dịch vụ") */
    section?: string;
    /** Phân loại nguồn tham chiếu từ document_category */
    source_type?: string;
}

/**
 * Model ánh xạ bảng `ai_document_chunks`
 * Lưu các đoạn cắt nhỏ và vector embedding
 */
export interface AiDocumentChunk {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    embedding?: string;
    /** Metadata bổ sung: page, section, source_type */
    metadata?: ChunkMetadata;
    created_at: Date;
}

/**
 * Cấu trúc Payload trả về sau khi tìm kiếm Hybrid Search.
 */
export interface RAGSearchResult {
    content: string;
    document_id: string;
    file_name: string;
    /** Điểm vector cosine similarity (0.0 – 1.0) — backward compatible */
    similarity: number;
    /** Điểm kết hợp vector + keyword (dùng để ranking và filter) */
    hybrid_score: number;
    /** Điểm keyword match riêng (ts_rank, 0.0+) */
    keyword_score: number;
    /** Metadata chunk — page, section, source_type (có thể rỗng cho chunks cũ) */
    metadata?: ChunkMetadata;
}
