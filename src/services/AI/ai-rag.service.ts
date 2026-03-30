import { randomUUID } from 'crypto';
// pdf-parse v1.1.1 là CJS thuần, require() trả về hàm trực tiếp
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }> = require('pdf-parse');

import { getOpenAIClient } from '../../config/openai';
import { AiRagRepository } from '../../repository/AI/ai-rag.repository';
import { AiDocument, AiDocumentChunk, RAGSearchResult, ChunkMetadata } from '../../models/AI/ai-rag.model';
import {
    AI_RAG_CONFIG,
    AI_RAG_ERRORS,
    AI_RAG_SUCCESS,
    AI_RAG_DOCUMENT_STATUS,
    AI_RAG_DOCUMENT_CATEGORIES,
    AI_RAG_SECTION_DETECTION,
    AI_RAG_THRESHOLD_CONFIG,
} from '../../constants/ai-rag.constant';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

/** Cấu trúc nội bộ: chunk text kèm metadata trước khi embedding */
interface ChunkWithMetadata {
    content: string;
    metadata: ChunkMetadata;
}

export class AiRagService {

    /**
     * Hàm chính: Xử lý file PDF upload
     */
    static async processDocumentFile(
        fileBuffer: Buffer,
        fileName: string,
        uploadedBy: string | null,
        category: string = AI_RAG_DOCUMENT_CATEGORIES.GENERAL
    ): Promise<AiDocument> {
        const utf8FileName = Buffer.from(fileName, 'latin1').toString('utf8');
        const docId = `DOC_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const document = await AiRagRepository.createDocument({
            document_id: docId,
            file_name: utf8FileName,
            file_type: 'PDF',
            uploaded_by: uploadedBy,
            file_size_bytes: fileBuffer.length,
            status: AI_RAG_DOCUMENT_STATUS.PROCESSING,
            document_category: category,
        });

        this.runIngestionPipeline(fileBuffer, docId, category).catch((error) => {
            console.error(`[RAG Ingestion Failed] Document ${docId}:`, error);
        });

        return document;
    }

    /**
     * Pipeline ngầm — tách trang, chunk kèm metadata, embedding, lưu DB.
     */
    private static async runIngestionPipeline(
        fileBuffer: Buffer,
        documentId: string,
        category: string
    ) {
        try {
            const pages = await this.extractPagesFromPdf(fileBuffer);

            const chunksWithMeta = this.chunkTextWithMetadata(
                pages,
                AI_RAG_CONFIG.CHUNK_SIZE,
                category
            );

            if (chunksWithMeta.length === 0) {
                throw new Error(AI_RAG_ERRORS.EMPTY_FILE);
            }

            const chunksWithEmbeddings = await this.embedChunksWithMetadata(chunksWithMeta, documentId);

            await AiRagRepository.insertChunks(chunksWithEmbeddings);

            await AiRagRepository.updateDocumentStatus(
                documentId,
                AI_RAG_DOCUMENT_STATUS.COMPLETED,
                chunksWithMeta.length
            );

        } catch (error: any) {
            await AiRagRepository.updateDocumentStatus(
                documentId,
                AI_RAG_DOCUMENT_STATUS.FAILED,
                0,
                error?.message || AI_RAG_ERRORS.EMBEDDING_FAILED
            );
        }
    }

    /**
     * Đọc buffer PDF thành mảng text theo trang.
     * pdf-parse dùng ký tự \f (form feed) để phân tách trang.
     * Fallback: nếu không có \f → coi toàn bộ là 1 trang.
     */
    private static async extractPagesFromPdf(buffer: Buffer): Promise<string[]> {
        try {
            const data = await pdfParse(buffer);
            const fullText = data.text || '';

            if (!fullText.trim()) {
                throw new Error(AI_RAG_ERRORS.EMPTY_FILE);
            }

            // Split theo \f (form feed) — pdf-parse dùng ký tự này phân trang
            const rawPages = fullText.split('\f');
            const pages = rawPages
                .map(p => p.replace(/\n\s*\n/g, '\n').trim())
                .filter(p => p.length > 0);

            // Fallback: nếu split chỉ ra 1 page → gán toàn bộ là page 1
            if (pages.length === 0) {
                const cleaned = fullText.replace(/\n\s*\n/g, '\n').trim();
                return cleaned ? [cleaned] : [];
            }

            return pages;
        } catch (error: any) {
            console.error('[RAG] Lỗi khi đọc file PDF:', error?.message || error);
            throw new Error(error?.message || AI_RAG_ERRORS.INVALID_FILE_TYPE);
        }
    }

    /**
     * Chunk text theo trang kèm metadata (page, section heading).
     * Giữ page boundary khi có thể — chunk không span quá 2 trang.
     */
    private static chunkTextWithMetadata(
        pages: string[],
        chunkSize: number,
        documentCategory: string
    ): ChunkWithMetadata[] {
        const results: ChunkWithMetadata[] = [];
        let currentSection: string | null = null;

        for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            const pageText = pages[pageIdx];
            const pageNumber = pageIdx + 1; // 1-indexed

            // Detect section heading từ đầu trang
            const detectedSection = this.detectSectionHeading(pageText);
            if (detectedSection) {
                currentSection = detectedSection;
            }

            // Semantic chunking trong trang
            const pageChunks = this.semanticChunkPage(pageText, chunkSize);

            for (const chunkContent of pageChunks) {
                // Detect section heading trong chunk (có thể khác heading đầu trang)
                const chunkSection = this.detectSectionHeading(chunkContent);
                if (chunkSection) {
                    currentSection = chunkSection;
                }

                results.push({
                    content: chunkContent,
                    metadata: {
                        page_start: pageNumber,
                        page_end: pageNumber,
                        section: currentSection || undefined,
                        source_type: documentCategory,
                    },
                });
            }
        }

        return results;
    }

    /**
     * Semantic chunking — ưu tiên cắt tại paragraph boundary.
     * Gộp paragraphs cho đến khi vượt maxSize → tách chunk.
     * Fallback sang sentence boundary nếu 1 paragraph đơn quá dài.
     */
    private static semanticChunkPage(text: string, maxSize: number): string[] {
        const cleanText = text.trim();
        if (!cleanText) return [];

        // Split theo paragraph (dòng trống hoặc xuống dòng)
        const paragraphs = cleanText.split(/\n\s*\n|\n/);
        const chunks: string[] = [];
        let current = '';

        for (const para of paragraphs) {
            const trimmedPara = para.trim();
            if (!trimmedPara) continue;

            // Nếu 1 paragraph đơn đã quá dài → split theo câu
            if (trimmedPara.length > maxSize) {
                if (current.trim()) {
                    chunks.push(current.trim());
                    current = '';
                }
                chunks.push(...this.splitBySentence(trimmedPara, maxSize));
                continue;
            }

            const separator = current ? '\n\n' : '';
            if ((current + separator + trimmedPara).length > maxSize && current) {
                chunks.push(current.trim());
                current = trimmedPara;
            } else {
                current = current + separator + trimmedPara;
            }
        }

        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }

    /**
     * Fallback: split text theo sentence boundary khi paragraph quá dài.
     * Regex tách theo dấu câu tiếng Việt (. ? !) kèm space/newline.
     */
    private static splitBySentence(text: string, maxSize: number): string[] {
        const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
        const chunks: string[] = [];
        let current = '';

        for (const sentence of sentences) {
            if ((current + sentence).length > maxSize && current) {
                chunks.push(current.trim());
                current = sentence;
            } else {
                current += sentence;
            }
        }

        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }

    /**
     * Phát hiện section heading bằng heuristic.
     * Dòng đầu tiên ngắn (≤80 chars) + viết hoa hoặc đánh số → heading.
     */
    private static detectSectionHeading(text: string): string | null {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length === 0) return null;

        const firstLine = lines[0].trim();

        // Bỏ qua dòng quá dài — không phải heading
        if (firstLine.length > AI_RAG_SECTION_DETECTION.MAX_HEADING_LENGTH) return null;
        // Bỏ qua dòng quá ngắn — thường là artifact
        if (firstLine.length < 3) return null;

        // Check: dòng đánh số (1., I., Chương...)
        if (AI_RAG_SECTION_DETECTION.NUMBERED_HEADING_PATTERN.test(firstLine)) {
            return firstLine;
        }

        // Check: dòng viết hoa toàn bộ (bỏ qua số, dấu)
        const lettersOnly = firstLine.replace(/[^a-zA-ZÀ-ỹ]/g, '');
        if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
            return firstLine;
        }

        return null;
    }

    /**
     * Gọi OpenAI Embeddings API theo Batch — kèm metadata cho mỗi chunk.
     */
    private static async embedChunksWithMetadata(
        chunksWithMeta: ChunkWithMetadata[],
        documentId: string
    ): Promise<AiDocumentChunk[]> {
        const BATCH_SIZE = AI_RAG_CONFIG.EMBEDDING_BATCH_SIZE;
        const MAX_RETRIES = AI_RAG_CONFIG.EMBEDDING_MAX_RETRIES;
        const client = getOpenAIClient();
        const results: AiDocumentChunk[] = [];
        const totalBatches = Math.ceil(chunksWithMeta.length / BATCH_SIZE);

        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
            const start = batchIdx * BATCH_SIZE;
            const batchItems = chunksWithMeta.slice(start, start + BATCH_SIZE);
            const batchTexts = batchItems.map(item => item.content);

            console.log(`🧠 [RAG ${documentId}] Embedding batch ${batchIdx + 1}/${totalBatches} (chunks ${start}-${start + batchTexts.length - 1})...`);

            let attempt = 0;
            let batchEmbeddings: number[][] = [];

            while (attempt < MAX_RETRIES) {
                try {

                    const response = await client.embeddings.create({
                        model: AI_RAG_CONFIG.EMBEDDING_MODEL,
                        input: batchTexts,
                        dimensions: AI_RAG_CONFIG.EMBEDDING_OUTPUT_DIMENSIONS,
                    });

                    batchEmbeddings = response.data
                        .sort((a, b) => a.index - b.index)
                        .map(item => item.embedding);

                    break;

                } catch (error: any) {

                    const isRateLimit = error?.status === 429 || error?.code === 'rate_limit_exceeded';
                    if (isRateLimit) {
                        attempt++;
                        const retryAfterMs = this.parseOpenAIRetryDelay(error);
                        if (attempt >= MAX_RETRIES) {
                            console.error(`❌ [RAG ${documentId}] Hết ${MAX_RETRIES} lần retry, bỏ qua.`);
                            throw error;
                        }
                        console.warn(`⚠️  [RAG ${documentId}] 429 Rate Limit. Retry sau ${retryAfterMs / 1000}s (lần ${attempt}/${MAX_RETRIES})...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfterMs));
                    } else {
                        throw error;
                    }
                }
            }

            batchItems.forEach((item, relIdx) => {
                const globalIdx = start + relIdx;
                const vectorString = '[' + batchEmbeddings[relIdx].join(',') + ']';
                results.push({
                    chunk_id: `CHK_${documentId}_${globalIdx}`,
                    document_id: documentId,
                    chunk_index: globalIdx,
                    content: item.content,
                    embedding: vectorString,
                    metadata: item.metadata,
                    created_at: new Date()
                });
            });

            if (batchIdx < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return results;
    }

    /**
     * Phân tích retryDelay từ error 429 của OpenAI.
     */
    private static parseOpenAIRetryDelay(error: any): number {
        try {

            const retryAfterStr = error?.headers?.['retry-after'];
            if (retryAfterStr) {
                const seconds = parseFloat(retryAfterStr);
                if (!isNaN(seconds)) return seconds * 1000;
            }

            const match = error?.message?.match(/retry after (\d+(?:\.\d+)?)\s*s/i);
            if (match) return parseFloat(match[1]) * 1000;
        } catch { }
        return 10000;
    }

    /**
     * Tìm kiếm ngữ cảnh Hybrid: Vector similarity + Keyword matching.
     * Gửi cả embedding vector lẫn query text gốc cho Hybrid Search.
     * Áp dụng Dynamic Threshold để tự điều chỉnh ngưỡng theo chất lượng kết quả.
     */
    static async retrieveContext(queryText: string, categories?: string[]): Promise<string> {
        try {
            const client = getOpenAIClient();

            const response = await client.embeddings.create({
                model: AI_RAG_CONFIG.EMBEDDING_MODEL,
                input: queryText,
                dimensions: AI_RAG_CONFIG.EMBEDDING_OUTPUT_DIMENSIONS,
            });

            const queryVectorStr = '[' + response.data[0].embedding.join(',') + ']';

            // Hybrid Search: kết hợp vector + keyword matching
            const topResults = await AiRagRepository.hybridSearch(
                queryVectorStr,
                queryText,
                AI_RAG_CONFIG.TOP_K_RESULTS,
                AI_RAG_CONFIG.HYBRID_VECTOR_WEIGHT,
                AI_RAG_CONFIG.HYBRID_KEYWORD_WEIGHT,
                categories
            );

            // Dynamic Threshold: tự hạ ngưỡng nếu ít kết quả chất lượng cao
            const validResults = this.applyDynamicThreshold(topResults);

            if (validResults.length === 0) {
                return '';
            }

            const contextText = validResults
                .map((r, i) => this.formatRagContextEntry(r, i + 1))
                .join('\n\n');

            return contextText;
        } catch (error) {
            console.error('Lỗi khi Retrieve Context:', error);
            return '';
        }
    }

    /**
     * Dynamic Threshold: hạ ngưỡng tự động khi không đủ kết quả chất lượng cao.
     */
    private static applyDynamicThreshold(results: RAGSearchResult[]): RAGSearchResult[] {
        const { DEFAULT_THRESHOLD, FALLBACK_THRESHOLD, MIN_RESULTS_BEFORE_FALLBACK }
            = AI_RAG_THRESHOLD_CONFIG;

        // Bước 1: Áp dụng ngưỡng strict
        let validResults = results.filter(r => r.hybrid_score > DEFAULT_THRESHOLD);

        // Bước 2: Nếu quá ít kết quả → hạ ngưỡng fallback
        if (validResults.length < MIN_RESULTS_BEFORE_FALLBACK) {
            validResults = results.filter(r => r.hybrid_score > FALLBACK_THRESHOLD);
        }

        return validResults;
    }

    /**
     * Format 1 kết quả RAG kèm metadata cho prompt.
     * Chunks cũ (metadata rỗng) fallback về format cũ "Trích từ file X.pdf".
     */
    private static formatRagContextEntry(result: RAGSearchResult, index: number): string {
        const meta = result.metadata;
        const hasMetadata = meta && (meta.section || meta.page_start);

        if (!hasMetadata) {
            // Backward compatible: chunks cũ không có metadata
            return `--- TÀI LIỆU [${index}]: (Trích từ file ${result.file_name})\n${result.content}`;
        }

        // Build location string từ metadata
        const parts: string[] = [];
        if (meta!.section) {
            parts.push(meta!.section);
        }
        if (meta!.page_start) {
            const pageStr = meta!.page_end && meta!.page_end !== meta!.page_start
                ? `Trang ${meta!.page_start}-${meta!.page_end}`
                : `Trang ${meta!.page_start}`;
            parts.push(pageStr);
        }

        const location = parts.length > 0 ? `${parts.join(' - ')} ` : '';
        return `--- TÀI LIỆU [${index}]: ${location}(file: ${result.file_name})\n${result.content}`;
    }


    static async getAllDocuments() {
        return await AiRagRepository.getAllDocuments();
    }

    static async deleteDocument(documentId: string) {
        const success = await AiRagRepository.deleteDocument(documentId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', AI_RAG_ERRORS.DOCUMENT_NOT_FOUND);
        }
        return AI_RAG_SUCCESS.DOCUMENT_DELETED;
    }
}
