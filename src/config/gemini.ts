import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_GEMINI_CONFIG, AI_CHAT_ERRORS } from '../constants/ai-health-chat.constant';

/**
 * Khởi tạo client Google Gemini AI.
 */
export const getGeminiClient = (): GoogleGenerativeAI => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(AI_CHAT_ERRORS.MISSING_API_KEY);
    }
    return new GoogleGenerativeAI(apiKey);
};

/**
 * Lấy Gemini generative model đã cấu hình sẵn.
 */
export const getGeminiModel = () => {
    const client = getGeminiClient();
    return client.getGenerativeModel({
        model: AI_GEMINI_CONFIG.MODEL_NAME,
        generationConfig: {
            maxOutputTokens: AI_GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            temperature: AI_GEMINI_CONFIG.TEMPERATURE,
            topP: AI_GEMINI_CONFIG.TOP_P,
            topK: AI_GEMINI_CONFIG.TOP_K,
        },
    });
};

/**
 * Lấy Gemini model theo tên — dùng cho cơ chế fallback khi model chính hết quota.
 */
export const getGeminiModelByName = (modelName: string) => {
    const client = getGeminiClient();
    return client.getGenerativeModel({
        model: modelName,
        generationConfig: {
            maxOutputTokens: AI_GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            temperature: AI_GEMINI_CONFIG.TEMPERATURE,
            topP: AI_GEMINI_CONFIG.TOP_P,
            topK: AI_GEMINI_CONFIG.TOP_K,
        },
    });
};

/**
 * JSON Schema cho Gemini Structured Output.
 * Đảm bảo AI luôn trả về JSON hợp lệ chứa text_reply + analysis.
 */
const GEMINI_RESPONSE_SCHEMA = {
    type: 'object' as const,
    properties: {
        text_reply: {
            type: 'string' as const,
            description: 'Phần text phản hồi thân thiện cho bệnh nhân đọc',
        },
        analysis: {
            type: 'object' as const,
            description: 'Metadata phân tích triệu chứng',
            properties: {
                is_complete: { type: 'boolean' as const },
                suggested_specialty_code: { type: 'string' as const, nullable: true },
                suggested_specialty_name: { type: 'string' as const, nullable: true },
                priority: { type: 'string' as const, nullable: true },
                symptoms_collected: { type: 'array' as const, items: { type: 'string' as const } },
                should_suggest_booking: { type: 'boolean' as const },
                reasoning: { type: 'string' as const, nullable: true },
                severity: { type: 'string' as const, nullable: true },
                can_self_treat: { type: 'boolean' as const },
                preliminary_assessment: { type: 'string' as const, nullable: true },
                recommended_actions: { type: 'array' as const, items: { type: 'string' as const } },
                red_flags_detected: { type: 'array' as const, items: { type: 'string' as const } },
                needs_doctor: { type: 'boolean' as const },
                predicted_next_action: { type: 'string' as const, nullable: true },
                suggested_follow_up_questions: { type: 'array' as const, items: { type: 'string' as const } },
                confidence_score: { type: 'number' as const, nullable: true },
            },
            required: ['is_complete', 'symptoms_collected', 'needs_doctor', 'reasoning'],
        },
    },
    required: ['text_reply', 'analysis'],
};

/**
 * Lấy Gemini model có Structured JSON Output — đảm bảo response luôn là JSON hợp lệ.
 * Dùng responseMimeType + responseSchema thay cho regex parsing.
 */
export const getGeminiModelWithSchema = (modelName?: string) => {
    const client = getGeminiClient();
    return client.getGenerativeModel({
        model: modelName || AI_GEMINI_CONFIG.MODEL_NAME,
        generationConfig: {
            maxOutputTokens: AI_GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            temperature: AI_GEMINI_CONFIG.TEMPERATURE,
            topP: AI_GEMINI_CONFIG.TOP_P,
            topK: AI_GEMINI_CONFIG.TOP_K,
            responseMimeType: 'application/json',
            responseSchema: GEMINI_RESPONSE_SCHEMA,
        } as any,
    });
};
