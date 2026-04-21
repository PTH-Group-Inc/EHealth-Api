import OpenAI from 'openai';
import { RAG_CONFIG } from '../../constants/AI Health/ai-health-chat.constant';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIEmbeddingService {

    static async embed(text: string): Promise<number[]> {
        const response = await openai.embeddings.create({
            model: RAG_CONFIG.EMBEDDING_MODEL,
            input: text.trim(),
        });
        return response.data[0].embedding;
    }

    static async embedBatch(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];
        const batchSize = RAG_CONFIG.BATCH_SIZE;

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize).map(t => t.trim());
            const response = await openai.embeddings.create({
                model: RAG_CONFIG.EMBEDDING_MODEL,
                input: batch,
            });
            results.push(...response.data.map(d => d.embedding));
        }

        return results;
    }
}
