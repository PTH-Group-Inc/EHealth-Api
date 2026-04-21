import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import { AiDocument, AiDocumentChunk, RagSearchResult } from '../../models/AI Health/ai-health-chat.model';

function genDocId(): string {
    return `DOC_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
}

function genChunkId(): string {
    return `CHK_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
}

export class AiRagRepository {

    static async createDocument(params: {
        file_name: string;
        file_type?: string;
        uploaded_by?: string;
        file_size_bytes?: number;
        document_category?: string;
    }): Promise<AiDocument> {
        const docId = genDocId();
        const r = await pool.query<AiDocument>(
            `INSERT INTO ai_documents (document_id, file_name, file_type, uploaded_by, file_size_bytes, document_category)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                docId,
                params.file_name,
                params.file_type ?? 'PDF',
                params.uploaded_by ?? null,
                params.file_size_bytes ?? null,
                params.document_category ?? 'GENERAL',
            ]
        );
        return r.rows[0];
    }

    static async updateDocumentStatus(
        docId: string,
        status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
        totalChunks?: number,
        errorMessage?: string
    ): Promise<void> {
        await pool.query(
            `UPDATE ai_documents
             SET status = $1, total_chunks = COALESCE($2, total_chunks), error_message = $3, updated_at = NOW()
             WHERE document_id = $4`,
            [status, totalChunks ?? null, errorMessage ?? null, docId]
        );
    }

    static async getDocuments(category?: string): Promise<AiDocument[]> {
        const filter = category ? `WHERE document_category = $1 AND status != 'FAILED'` : `WHERE status != 'FAILED'`;
        const params = category ? [category] : [];
        const r = await pool.query<AiDocument>(
            `SELECT * FROM ai_documents ${filter} ORDER BY created_at DESC`,
            params
        );
        return r.rows;
    }

    static async getDocumentById(docId: string): Promise<AiDocument | null> {
        const r = await pool.query<AiDocument>(
            `SELECT * FROM ai_documents WHERE document_id = $1`,
            [docId]
        );
        return r.rows[0] ?? null;
    }

    static async deleteDocument(docId: string): Promise<void> {
        await pool.query(`DELETE FROM ai_documents WHERE document_id = $1`, [docId]);
    }

    static async insertChunkBatch(chunks: Array<{
        document_id: string;
        chunk_index: number;
        content: string;
        embedding: number[];
        metadata?: Record<string, unknown>;
    }>): Promise<void> {
        if (chunks.length === 0) return;

        const values: unknown[] = [];
        const placeholders: string[] = [];
        let idx = 1;

        for (const chunk of chunks) {
            const embStr = `[${chunk.embedding.join(',')}]`;
            placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}::vector, $${idx++})`);
            values.push(
                genChunkId(),
                chunk.document_id,
                chunk.chunk_index,
                chunk.content,
                embStr,
                JSON.stringify(chunk.metadata ?? {})
            );
        }

        await pool.query(
            `INSERT INTO ai_document_chunks (chunk_id, document_id, chunk_index, content, embedding, metadata)
             VALUES ${placeholders.join(', ')}`,
            values
        );
    }

    static async vectorSearch(
        embedding: number[],
        topK = 5,
        minSimilarity = 0.72
    ): Promise<RagSearchResult[]> {
        const embStr = `[${embedding.join(',')}]`;
        const r = await pool.query(
            `SELECT
                c.chunk_id, c.document_id, c.content, c.metadata,
                d.file_name AS document_name,
                1 - (c.embedding <=> $1::vector) AS similarity
             FROM ai_document_chunks c
             JOIN ai_documents d ON d.document_id = c.document_id
             WHERE d.status = 'COMPLETED'
               AND 1 - (c.embedding <=> $1::vector) >= $2
             ORDER BY c.embedding <=> $1::vector
             LIMIT $3`,
            [embStr, minSimilarity, topK]
        );
        return r.rows;
    }
}
