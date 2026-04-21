import pdfParse from 'pdf-parse';
import { AiRagRepository } from '../../repository/AI Health/ai-rag.repository';
import { AIEmbeddingService } from './ai-embedding.service';
import { AiDocument, RagSearchResult } from '../../models/AI Health/ai-health-chat.model';
import { RAG_CONFIG } from '../../constants/AI Health/ai-health-chat.constant';
import logger from '../../config/logger.config';

export class AiRagService {

    static async uploadAndProcess(params: {
        file_name: string;
        file_buffer: Buffer;
        file_size_bytes: number;
        uploaded_by?: string;
        document_category?: string;
    }): Promise<AiDocument> {
        const doc = await AiRagRepository.createDocument({
            file_name: params.file_name,
            file_type: 'PDF',
            uploaded_by: params.uploaded_by,
            file_size_bytes: params.file_size_bytes,
            document_category: params.document_category ?? 'GENERAL',
        });

        // Process async
        AiRagService.processDocument(doc.document_id, params.file_buffer, params.file_name).catch(err => {
            logger.error(`[RAG] Failed to process document ${doc.document_id}:`, err.message);
            AiRagRepository.updateDocumentStatus(doc.document_id, 'FAILED', undefined, err.message);
        });

        return doc;
    }

    private static async processDocument(docId: string, buffer: Buffer, fileName: string): Promise<void> {
        try {
            // Parse PDF
            const parsed = await pdfParse(buffer);
            const text = parsed.text;

            if (!text || text.trim().length === 0) {
                throw new Error('PDF không có nội dung văn bản.');
            }

            // Chunk text
            const chunks = AiRagService.chunkText(text, RAG_CONFIG.CHUNK_SIZE_CHARS, RAG_CONFIG.CHUNK_OVERLAP_CHARS);
            logger.info(`[RAG] ${fileName}: ${chunks.length} chunks extracted`);

            // Embed chunks in batches
            const embeddings = await AIEmbeddingService.embedBatch(chunks);

            // Save to DB
            const chunkData = chunks.map((content, idx) => ({
                document_id: docId,
                chunk_index: idx,
                content,
                embedding: embeddings[idx],
                metadata: { source_type: 'PDF', page_start: null, page_end: null } as Record<string, unknown>,
            }));

            await AiRagRepository.insertChunkBatch(chunkData);
            await AiRagRepository.updateDocumentStatus(docId, 'COMPLETED', chunks.length);
            logger.info(`[RAG] Document ${docId} processed successfully.`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(msg);
        }
    }

    static async search(query: string, topK = RAG_CONFIG.TOP_K): Promise<RagSearchResult[]> {
        const embedding = await AIEmbeddingService.embed(query);
        return AiRagRepository.vectorSearch(embedding, topK);
    }

    static buildRagContext(results: RagSearchResult[]): string {
        if (results.length === 0) return '';
        const items = results.map((r, i) => `[${i + 1}] ${r.content} (nguồn: ${r.document_name})`).join('\n\n');
        return `[NGỮ CẢNH TÀI LIỆU Y TẾ]\n${items}\n[KẾT THÚC NGỮ CẢNH]`;
    }

    static async listDocuments(category?: string): Promise<AiDocument[]> {
        return AiRagRepository.getDocuments(category);
    }

    static async getDocument(docId: string): Promise<AiDocument | null> {
        return AiRagRepository.getDocumentById(docId);
    }

    static async deleteDocument(docId: string): Promise<void> {
        await AiRagRepository.deleteDocument(docId);
    }

    // ── Chunking ──────────────────────────────────────────────────────

    private static chunkText(text: string, chunkSize: number, overlap: number): string[] {
        const chunks: string[] = [];
        const step = chunkSize - overlap;

        // Clean up whitespace
        const cleaned = text.replace(/\s+/g, ' ').trim();

        for (let i = 0; i < cleaned.length; i += step) {
            const chunk = cleaned.slice(i, i + chunkSize).trim();
            if (chunk.length > 50) {
                chunks.push(chunk);
            }
            if (i + chunkSize >= cleaned.length) break;
        }

        return chunks;
    }
}

