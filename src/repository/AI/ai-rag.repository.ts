import { PoolClient } from 'pg';
import { pool as db } from '../../config/postgresdb';
import { AiDocument, AiDocumentChunk, RAGSearchResult } from '../../models/AI/ai-rag.model';
import { AI_RAG_DOCUMENT_STATUS, AI_RAG_DOCUMENT_CATEGORIES } from '../../constants/ai-rag.constant';

export class AiRagRepository {
    /**
     * Tạo bản ghi Document mới trong DB khi Admin upload file PDF
     */
    static async createDocument(document: Partial<AiDocument>): Promise<AiDocument> {
        const query = `
            INSERT INTO ai_documents (
                document_id, file_name, file_type, uploaded_by, 
                file_size_bytes, status, document_category
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            document.document_id,
            document.file_name,
            document.file_type || 'PDF',
            document.uploaded_by || null,
            document.file_size_bytes,
            document.status || AI_RAG_DOCUMENT_STATUS.PROCESSING,
            document.document_category || AI_RAG_DOCUMENT_CATEGORIES.GENERAL
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Cập nhật trạng thái và tổng số chunk của file sau khi xử lý xong
     */
    static async updateDocumentStatus(
        documentId: string,
        status: string,
        totalChunks: number = 0,
        errorMessage: string | null = null
    ): Promise<void> {
        const query = `
            UPDATE ai_documents 
            SET status = $1, total_chunks = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
            WHERE document_id = $4;
        `;
        await db.query(query, [status, totalChunks, errorMessage, documentId]);
    }

    /**
     * Lưu hàng loạt các đoạn văn (chunks) và vector tương ứng vào DB.
     * Dùng bulk INSERT 1 câu query thay vì N queries riêng lẻ để tối ưu hiệu suất.
     */
    static async insertChunks(chunks: AiDocumentChunk[]): Promise<void> {
        if (!chunks || chunks.length === 0) return;

        const client: PoolClient = await db.connect();
        try {
            await client.query('BEGIN');

            // Build bulk INSERT: 1 câu query cho toàn bộ chunks (giảm N round trips → 1)
            const FIELDS_PER_ROW = 6;
            const placeholders = chunks
                .map((_, i) =>
                    `($${i * FIELDS_PER_ROW + 1}, $${i * FIELDS_PER_ROW + 2}, $${i * FIELDS_PER_ROW + 3}, $${i * FIELDS_PER_ROW + 4}, $${i * FIELDS_PER_ROW + 5}, $${i * FIELDS_PER_ROW + 6})`
                )
                .join(', ');

            const values = chunks.flatMap(chunk => [
                chunk.chunk_id,
                chunk.document_id,
                chunk.chunk_index,
                chunk.content,
                chunk.embedding,
                JSON.stringify(chunk.metadata || {}),
            ]);

            const bulkQuery = `
                INSERT INTO ai_document_chunks (
                    chunk_id, document_id, chunk_index, content, embedding, metadata
                ) VALUES ${placeholders}
            `;

            await client.query(bulkQuery, values);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tìm kiếm Hybrid: kết hợp vector similarity (cosine) + keyword matching (tsvector).
     */
    static async hybridSearch(
        queryEmbedding: string,
        queryText: string,
        limit: number = 5,
        vectorWeight: number = 0.7,
        keywordWeight: number = 0.3,
        categories?: string[]
    ): Promise<RAGSearchResult[]> {
        let query: string;
        let values: any[];

        if (categories && categories.length > 0) {
            query = `
                SELECT 
                    c.content,
                    c.document_id,
                    c.metadata,
                    d.file_name,
                    (1 - (c.embedding <=> $1)) AS vector_score,
                    ts_rank(c.tsv, plainto_tsquery('simple', $3)) AS keyword_score,
                    (1 - (c.embedding <=> $1)) * $4 + ts_rank(c.tsv, plainto_tsquery('simple', $3)) * $5 AS hybrid_score
                FROM ai_document_chunks c
                JOIN ai_documents d ON c.document_id = d.document_id
                WHERE d.status = 'COMPLETED'
                  AND d.document_category = ANY($6)
                ORDER BY hybrid_score DESC
                LIMIT $2;
            `;
            values = [queryEmbedding, limit, queryText, vectorWeight, keywordWeight, categories];
        } else {
            query = `
                SELECT 
                    c.content,
                    c.document_id,
                    c.metadata,
                    d.file_name,
                    (1 - (c.embedding <=> $1)) AS vector_score,
                    ts_rank(c.tsv, plainto_tsquery('simple', $3)) AS keyword_score,
                    (1 - (c.embedding <=> $1)) * $4 + ts_rank(c.tsv, plainto_tsquery('simple', $3)) * $5 AS hybrid_score
                FROM ai_document_chunks c
                JOIN ai_documents d ON c.document_id = d.document_id
                WHERE d.status = 'COMPLETED'
                ORDER BY hybrid_score DESC
                LIMIT $2;
            `;
            values = [queryEmbedding, limit, queryText, vectorWeight, keywordWeight];
        }

        const result = await db.query(query, values);

        return result.rows.map((row: any) => ({
            content: row.content,
            document_id: row.document_id,
            file_name: row.file_name,
            metadata: row.metadata || {},
            similarity: parseFloat(row.vector_score),
            hybrid_score: parseFloat(row.hybrid_score),
            keyword_score: parseFloat(row.keyword_score),
        }));
    }

    /**
     * Xóa Document và toàn bộ chunks liên quan (nhờ ON DELETE CASCADE)
     */
    static async deleteDocument(documentId: string): Promise<boolean> {
        const query = 'DELETE FROM ai_documents WHERE document_id = $1 RETURNING document_id;';
        const result = await db.query(query, [documentId]);
        return result.rowCount !== null && result.rowCount > 0;
    }

    /**
     * Lấy danh sách tài liệu phục vụ Admin bảng điều khiển
     */
    static async getAllDocuments(): Promise<AiDocument[]> {
        const query = 'SELECT * FROM ai_documents ORDER BY created_at DESC;';
        const result = await db.query(query);
        return result.rows;
    }
}
