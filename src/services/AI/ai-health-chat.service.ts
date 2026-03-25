import { randomUUID } from 'crypto';
import { getGeminiModel, getGeminiModelByName } from '../../config/gemini';
import { AiHealthChatRepository } from '../../repository/AI/ai-health-chat.repository';
import {
    AiChatSession,
    AiChatResponse,
    AiChatSessionDetail,
    AiAnalysisData,
    SpecialtyForPrompt,
} from '../../models/AI/ai-health-chat.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    AI_CHAT_SESSION_STATUS,
    AI_CHAT_ROLE,
    AI_CHAT_LIMITS,
    AI_CHAT_ERRORS,
    AI_GEMINI_CONFIG,
    AI_CORE_PROMPT,
    AI_DISEASE_KNOWLEDGE_BASE,
} from '../../constants/ai-health-chat.constant';
import { Response } from 'express';

/**
 * Service xử lý nghiệp vụ AI Tư Vấn Sức Khỏe Ban Đầu.
 *
 * Luồng nghiệp vụ:
 * 1. BN bắt đầu phiên → tạo session, build system prompt kèm danh sách chuyên khoa từ DB
 * 2. Gửi tin nhắn đầu tiên tới Gemini → AI hỏi thêm chi tiết triệu chứng
 * 3. BN trả lời → gửi toàn bộ history cho Gemini (multi-turn)
 * 4. Khi AI đủ thông tin → trả JSON có suggested_specialty + priority
 * 5. Service parse kết quả → map specialty_code sang specialty_id từ DB → lưu session
 *
 * Liên kết module:
 * - Module 2 (Facility): bảng specialties → lấy danh sách chuyên khoa
 * - Module 3 (Patient): bảng patients → optional link BN
 * - Module 3 (Appointment): bảng appointments → link nếu BN đặt lịch từ gợi ý
 */
export class AiHealthChatService {

    /** Sinh session_id dạng AIC_YYMM_xxxxxxxx */
    private static generateSessionId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        return `AIC_${yy}${mm}_${randomUUID().substring(0, 8)}`;
    }

    /** Sinh session_code dạng AIC-YYYYMMDD-XXXX */
    private static generateSessionCode(): string {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = randomUUID().substring(0, 4).toUpperCase();
        return `AIC-${yyyy}${mm}${dd}-${rand}`;
    }

    /** Sinh message_id */
    private static generateMessageId(): string {
        return `MSG_${randomUUID().substring(0, 12)}`;
    }

    /**
     * Build system prompt động theo giai đoạn hội thoại.
     * - Lượt 1 (Discovery): Chỉ gửi AI_CORE_PROMPT → tiết kiệm ~400 tokens.
     * - Lượt 2+ (Assessment): Bơm thêm AI_DISEASE_KNOWLEDGE_BASE để AI tra cứu bệnh phổ thông.
     */
    private static buildSystemPrompt(specialties: SpecialtyForPrompt[], turnCount: number = 1): string {
        const specialtiesList = specialties
            .map(s => `- Code: ${s.code} | Tên: ${s.name}${s.description ? ` | Mô tả: ${s.description}` : ''}`)
            .join('\n');

        let prompt = AI_CORE_PROMPT.replace('{specialties_list}', specialtiesList);

        // Assessment Phase: bơm knowledge base từ lượt 2 trở đi
        if (turnCount >= 2) {
            prompt += '\n\n' + AI_DISEASE_KNOWLEDGE_BASE;
        }

        return prompt;
    }

    /**
     * Parse JSON response từ Gemini.
     * Gemini trả plain text, cần extract JSON từ nó.
     * Xử lý cả trường hợp Gemini wrap trong code block ```json ... ```
     */
    private static parseGeminiResponse(raw: string): { reply: string; analysis: AiAnalysisData } {
        let cleaned = raw.trim();

        // Xử lý trường hợp Gemini wrap trong code block
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
            const parsed = JSON.parse(cleaned);

            return {
                reply: parsed.reply || '',
                analysis: {
                    is_complete: parsed.analysis?.is_complete ?? false,
                    suggested_specialty_code: parsed.analysis?.suggested_specialty_code ?? null,
                    suggested_specialty_name: parsed.analysis?.suggested_specialty_name ?? null,
                    priority: parsed.analysis?.priority ?? null,
                    symptoms_collected: parsed.analysis?.symptoms_collected ?? [],
                    should_suggest_booking: parsed.analysis?.should_suggest_booking ?? false,
                    reasoning: parsed._thought ?? null,
                    severity: parsed.analysis?.severity ?? null,
                    can_self_treat: parsed.analysis?.can_self_treat ?? false,
                    preliminary_assessment: parsed.analysis?.preliminary_assessment ?? null,
                    recommended_actions: parsed.analysis?.recommended_actions ?? [],
                    red_flags_detected: parsed.analysis?.red_flags_detected ?? [],
                    needs_doctor: parsed.analysis?.needs_doctor ?? false,
                },
            };
        } catch {
            // JSON bị lỗi (có thể truncated) → cố gắng trích xuất reply bằng regex
            const replyMatch = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
            const extractedReply = replyMatch
                ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                : raw.replace(/\{[\s\S]*$/s, '').trim() || raw;

            // Cố gắng trích xuất các field analysis từ JSON bị cắt
            const severityMatch = raw.match(/"severity"\s*:\s*"(MILD|MODERATE|SEVERE)"/i);
            const assessmentMatch = raw.match(/"preliminary_assessment"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
            const isCompleteMatch = raw.match(/"is_complete"\s*:\s*(true|false)/i);
            const priorityMatch = raw.match(/"priority"\s*:\s*"(NORMAL|SOON|URGENT)"/i);
            const needsDoctorMatch = raw.match(/"needs_doctor"\s*:\s*(true|false)/i);
            const canSelfTreatMatch = raw.match(/"can_self_treat"\s*:\s*(true|false)/i);
            const specialtyCodeMatch = raw.match(/"suggested_specialty_code"\s*:\s*"([^"]+)"/i);
            const specialtyNameMatch = raw.match(/"suggested_specialty_name"\s*:\s*"((?:[^"\\]|\\.)*)"/s);

            return {
                reply: extractedReply,
                analysis: {
                    is_complete: isCompleteMatch ? isCompleteMatch[1] === 'true' : false,
                    suggested_specialty_code: specialtyCodeMatch?.[1] ?? null,
                    suggested_specialty_name: specialtyNameMatch
                        ? specialtyNameMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                        : null,
                    priority: priorityMatch?.[1] ?? null,
                    symptoms_collected: [],
                    should_suggest_booking: false,
                    reasoning: null,
                    severity: severityMatch?.[1] ?? null,
                    can_self_treat: canSelfTreatMatch ? canSelfTreatMatch[1] === 'true' : false,
                    preliminary_assessment: assessmentMatch
                        ? assessmentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                        : null,
                    recommended_actions: [],
                    red_flags_detected: [],
                    needs_doctor: needsDoctorMatch ? needsDoctorMatch[1] === 'true' : false,
                },
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  1. START SESSION — Bắt đầu phiên tư vấn
    // ═══════════════════════════════════════════════════════════════

    /**
     * Bắt đầu phiên tư vấn AI mới.
     *
     * Nghiệp vụ:
     * - Kiểm tra giới hạn phiên ACTIVE (tránh spam)
     * - Tạo session mới
     * - Lấy danh sách chuyên khoa từ DB → build system prompt
     * - Gửi tin nhắn đầu tiên tới Gemini
     * - Lưu user message + AI response vào DB
     * - Nếu AI trả kết quả complete ngay → cập nhật session
     */
    static async startSession(
        userId: string | null,
        message: string,
        patientId?: string
    ): Promise<AiChatResponse> {
        // Validate input
        if (!message || message.trim().length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
        }
        if (message.length > AI_CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MESSAGE_TOO_LONG', AI_CHAT_ERRORS.MESSAGE_TOO_LONG);
        }

        // Kiểm tra giới hạn phiên ACTIVE (bỏ qua cho guest)
        if (userId) {
            const activeCount = await AiHealthChatRepository.countActiveSessionsByUser(userId);
            if (activeCount >= AI_CHAT_LIMITS.MAX_ACTIVE_SESSIONS_PER_USER) {
                throw new AppError(HTTP_STATUS.TOO_MANY_REQUESTS, 'MAX_ACTIVE_SESSIONS', AI_CHAT_ERRORS.MAX_ACTIVE_SESSIONS);
            }
        }

        // Tạo session mới
        const session = await AiHealthChatRepository.createSession({
            session_id: AiHealthChatService.generateSessionId(),
            session_code: AiHealthChatService.generateSessionCode(),
            patient_id: patientId || null,
            user_id: userId,
            status: AI_CHAT_SESSION_STATUS.ACTIVE,
            message_count: 0,
        });

        // Lấy chuyên khoa từ DB để build system prompt
        const specialties = await AiHealthChatRepository.getActiveSpecialties();
        const systemPrompt = AiHealthChatService.buildSystemPrompt(specialties);

        // Gọi Gemini API 
        const startTime = Date.now();
        let geminiResponseText = '';
        let tokensUsed = 0;
        let modelUsed: string = AI_GEMINI_CONFIG.MODEL_NAME;

        const fallbackModels = AI_GEMINI_CONFIG.FALLBACK_MODELS;
        let lastError: any = null;

        for (const currentModel of fallbackModels) {
            try {
                const model = getGeminiModelByName(currentModel);
                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        { role: 'model', parts: [{ text: 'Tôi đã hiểu. Tôi sẵn sàng tiếp nhận triệu chứng từ bệnh nhân và trả lời theo đúng format JSON đã quy định.' }] },
                    ],
                });
                const result = await chat.sendMessage(message);
                geminiResponseText = result.response.text();
                tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;
                modelUsed = currentModel;
                lastError = null;
                break;
            } catch (error: any) {
                lastError = error;
                const isRetryable = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('503') || error.message?.includes('500') || error.message?.includes('Service Unavailable') || error.message?.includes('overloaded');
                if (isRetryable && currentModel !== fallbackModels[fallbackModels.length - 1]) {
                    continue;
                }
                console.error('[AiHealthChatService.startSession] Gemini API Error:', error.message);
                throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'GEMINI_API_ERROR', AI_CHAT_ERRORS.GEMINI_API_ERROR);
            }
        }

        if (lastError) {
            throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'GEMINI_API_ERROR', 'Tất cả model AI đều hết quota. Vui lòng thử lại sau.');
        }

        const responseTime = Date.now() - startTime;

        // Parse response
        const { reply, analysis } = AiHealthChatService.parseGeminiResponse(geminiResponseText);

        // Lưu user message
        await AiHealthChatRepository.addMessage({
            message_id: AiHealthChatService.generateMessageId(),
            session_id: session.session_id,
            role: AI_CHAT_ROLE.USER,
            content: message.trim(),
        });

        // Lưu AI response
        await AiHealthChatRepository.addMessage({
            message_id: AiHealthChatService.generateMessageId(),
            session_id: session.session_id,
            role: AI_CHAT_ROLE.ASSISTANT,
            content: reply,
            model_used: modelUsed,
            tokens_used: tokensUsed,
            response_time_ms: responseTime,
            analysis_data: analysis,
        });

        // Cập nhật session: message_count + kết quả nếu complete
        const sessionUpdates: Partial<AiChatSession> = {
            message_count: 2,
        };

        if (analysis.is_complete && analysis.suggested_specialty_code) {
            await AiHealthChatService.applyAnalysisToSession(sessionUpdates, analysis);
        }

        const updatedSession = await AiHealthChatRepository.updateSession(
            session.session_id,
            sessionUpdates
        );

        return {
            session: updatedSession || session,
            ai_reply: reply,
            analysis,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    //  2. SEND MESSAGE — Gửi tin nhắn tiếp theo (JSON response)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Gửi tin nhắn tiếp theo trong phiên (multi-turn conversation).
     *
     * Nghiệp vụ:
     * - Validate session: phải ACTIVE, chưa hết tin nhắn
     * - Load toàn bộ conversation history
     * - Gửi cho Gemini kèm history (multi-turn)
     * - Parse kết quả → nếu AI đã đủ info → map specialty → cập nhật session
     */
    static async sendMessage(
        sessionId: string,
        userId: string | null,
        message: string
    ): Promise<AiChatResponse> {
        // Validate input
        if (!message || message.trim().length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
        }
        if (message.length > AI_CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MESSAGE_TOO_LONG', AI_CHAT_ERRORS.MESSAGE_TOO_LONG);
        }

        // Load session
        const session = await AiHealthChatService.validateSession(sessionId, userId);

        // Kiểm tra giới hạn tin nhắn
        if (session.message_count >= AI_CHAT_LIMITS.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MAX_MESSAGES_REACHED', AI_CHAT_ERRORS.MAX_MESSAGES_REACHED);
        }

        // Load conversation history
        const messages = await AiHealthChatRepository.getMessagesBySession(sessionId);

        // Build Gemini chat history
        const specialties = await AiHealthChatRepository.getActiveSpecialties();
        // Đếm số lượt USER đã chat → xác định giai đoạn (Discovery vs Assessment)
        const userTurnCount = messages.filter(m => m.role === AI_CHAT_ROLE.USER).length + 1;
        const systemPrompt = AiHealthChatService.buildSystemPrompt(specialties, userTurnCount);

        const geminiHistory = [
            { role: 'user' as const, parts: [{ text: systemPrompt }] },
            { role: 'model' as const, parts: [{ text: 'Tôi đã hiểu. Tôi sẵn sàng tiếp nhận triệu chứng từ bệnh nhân và trả lời theo đúng format JSON đã quy định.' }] },
        ];

        // Thêm lịch sử chat
        for (const msg of messages) {
            geminiHistory.push({
                role: msg.role === AI_CHAT_ROLE.USER ? 'user' as const : 'model' as const,
                parts: [{ text: msg.content }],
            });
        }

        // Gọi Gemini API — với cơ chế fallback
        const startTime = Date.now();
        let geminiResponseText = '';
        let tokensUsed = 0;
        let modelUsed: string = AI_GEMINI_CONFIG.MODEL_NAME;

        const fallbackModels = AI_GEMINI_CONFIG.FALLBACK_MODELS;
        let lastError: any = null;

        for (const currentModel of fallbackModels) {
            try {
                const model = getGeminiModelByName(currentModel);
                const chat = model.startChat({ history: geminiHistory });
                const result = await chat.sendMessage(message.trim());
                geminiResponseText = result.response.text();
                tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;
                modelUsed = currentModel;
                lastError = null;
                break;
            } catch (error: any) {
                lastError = error;
                const isRetryable = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('503') || error.message?.includes('500') || error.message?.includes('Service Unavailable') || error.message?.includes('overloaded');
                if (isRetryable && currentModel !== fallbackModels[fallbackModels.length - 1]) {
                    continue;
                }
                console.error('[AiHealthChatService.sendMessage] Gemini API Error:', error.message);
                throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'GEMINI_API_ERROR', AI_CHAT_ERRORS.GEMINI_API_ERROR);
            }
        }

        if (lastError) {
            throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'GEMINI_API_ERROR', 'Tất cả model AI đều hết quota. Vui lòng thử lại sau.');
        }

        const responseTime = Date.now() - startTime;

        // Parse response
        const { reply, analysis } = AiHealthChatService.parseGeminiResponse(geminiResponseText);

        // Lưu user message
        await AiHealthChatRepository.addMessage({
            message_id: AiHealthChatService.generateMessageId(),
            session_id: sessionId,
            role: AI_CHAT_ROLE.USER,
            content: message.trim(),
        });

        // Lưu AI response
        await AiHealthChatRepository.addMessage({
            message_id: AiHealthChatService.generateMessageId(),
            session_id: sessionId,
            role: AI_CHAT_ROLE.ASSISTANT,
            content: reply,
            model_used: modelUsed,
            tokens_used: tokensUsed,
            response_time_ms: responseTime,
            analysis_data: analysis,
        });

        // Cập nhật session
        const sessionUpdates: Partial<AiChatSession> = {
            message_count: session.message_count + 2,
        };

        if (analysis.is_complete && analysis.suggested_specialty_code) {
            await AiHealthChatService.applyAnalysisToSession(sessionUpdates, analysis);
        }

        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

        return {
            session: updatedSession || session,
            ai_reply: reply,
            analysis,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    //  3. SEND MESSAGE STREAM — SSE Streaming response
    // ═══════════════════════════════════════════════════════════════

    /**
     * Gửi tin nhắn và nhận phản hồi dạng streaming (SSE).
     * Frontend nhận từng chunk text real-time giống ChatGPT.
     *
     * Sử dụng Server-Sent Events (SSE) — không cần WebSocket.
     * Events:
     *   - data: {"type":"chunk","content":"..."} → từng phần text
     *   - data: {"type":"analysis","data":{...}} → kết quả phân tích cuối
     *   - data: {"type":"done","session":{...}} → kết thúc stream
     *   - data: {"type":"error","message":"..."} → lỗi
     */
    static async sendMessageStream(
        sessionId: string,
        userId: string | null,
        message: string,
        res: Response
    ): Promise<void> {
        // Validate
        if (!message || message.trim().length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
        }
        if (message.length > AI_CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MESSAGE_TOO_LONG', AI_CHAT_ERRORS.MESSAGE_TOO_LONG);
        }

        const session = await AiHealthChatService.validateSession(sessionId, userId);

        if (session.message_count >= AI_CHAT_LIMITS.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MAX_MESSAGES_REACHED', AI_CHAT_ERRORS.MAX_MESSAGES_REACHED);
        }

        // Lưu user message trước
        await AiHealthChatRepository.addMessage({
            message_id: AiHealthChatService.generateMessageId(),
            session_id: sessionId,
            role: AI_CHAT_ROLE.USER,
            content: message.trim(),
        });

        // Load history
        const messages = await AiHealthChatRepository.getMessagesBySession(sessionId);
        const specialties = await AiHealthChatRepository.getActiveSpecialties();
        // Đếm số lượt USER đã chat (bao gồm tin vừa lưu) → xác định giai đoạn
        const userTurnCount = messages.filter(m => m.role === AI_CHAT_ROLE.USER).length;
        const systemPrompt = AiHealthChatService.buildSystemPrompt(specialties, userTurnCount);

        const geminiHistory = [
            { role: 'user' as const, parts: [{ text: systemPrompt }] },
            { role: 'model' as const, parts: [{ text: 'Tôi đã hiểu. Tôi sẵn sàng tiếp nhận triệu chứng từ bệnh nhân và trả lời theo đúng format JSON đã quy định.' }] },
        ];

        for (const msg of messages) {
            if (msg.role === AI_CHAT_ROLE.USER || msg.role === AI_CHAT_ROLE.ASSISTANT) {
                geminiHistory.push({
                    role: msg.role === AI_CHAT_ROLE.USER ? 'user' as const : 'model' as const,
                    parts: [{ text: msg.content }],
                });
            }
        }

        // Setup SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        const startTime = Date.now();
        let fullResponse = '';
        let tokensUsed = 0;
        let modelUsed: string = AI_GEMINI_CONFIG.MODEL_NAME;

        const fallbackModels = AI_GEMINI_CONFIG.FALLBACK_MODELS;
        let lastError: any = null;

        for (const currentModel of fallbackModels) {
            try {
                const model = getGeminiModelByName(currentModel);
                const chat = model.startChat({ history: geminiHistory });
                const streamResult = await chat.sendMessageStream(message.trim());

                for await (const chunk of streamResult.stream) {
                    const chunkText = chunk.text();
                    if (chunkText) {
                        fullResponse += chunkText;
                        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
                    }
                }

                const finalResponse = await streamResult.response;
                tokensUsed = finalResponse.usageMetadata?.totalTokenCount ?? 0;
                modelUsed = currentModel;
                lastError = null;
                break;
            } catch (error: any) {
                lastError = error;
                const isRetryable = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('503') || error.message?.includes('500') || error.message?.includes('Service Unavailable') || error.message?.includes('overloaded');
                if (isRetryable && currentModel !== fallbackModels[fallbackModels.length - 1]) {
                    fullResponse = '';
                    continue;
                }
                console.error('[AiHealthChatService.sendMessageStream] Gemini API Error:', error.message);
                res.write(`data: ${JSON.stringify({ type: 'error', message: AI_CHAT_ERRORS.GEMINI_API_ERROR })}\n\n`);
                res.end();
                return;
            }
        }

        if (lastError) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Tất cả model AI đều hết quota.' })}\n\n`);
            res.end();
            return;
        }

        const responseTime = Date.now() - startTime;

        // Parse full response
        const { reply, analysis } = AiHealthChatService.parseGeminiResponse(fullResponse);

        // Lưu AI response vào DB
        await AiHealthChatRepository.addMessage({
            message_id: AiHealthChatService.generateMessageId(),
            session_id: sessionId,
            role: AI_CHAT_ROLE.ASSISTANT,
            content: reply,
            model_used: modelUsed,
            tokens_used: tokensUsed,
            response_time_ms: responseTime,
            analysis_data: analysis,
        });

        // Cập nhật session
        const sessionUpdates: Partial<AiChatSession> = {
            message_count: session.message_count + 2,
        };

        if (analysis.is_complete && analysis.suggested_specialty_code) {
            await AiHealthChatService.applyAnalysisToSession(sessionUpdates, analysis);
        }

        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

        // Gửi reply sạch (không chứa JSON) để client thay thế nội dung đã stream
        res.write(`data: ${JSON.stringify({ type: 'replace', content: reply })}\n\n`);
        // Gửi analysis data + session cuối stream
        res.write(`data: ${JSON.stringify({ type: 'analysis', data: analysis })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done', session: updatedSession })}\n\n`);
        res.end();
    }

    // ═══════════════════════════════════════════════════════════════
    //  4. COMPLETE SESSION — Kết thúc phiên
    // ═══════════════════════════════════════════════════════════════

    /**
     * Kết thúc phiên tư vấn AI.
     * Đánh dấu COMPLETED, lưu thời điểm hoàn tất.
     */
    static async completeSession(sessionId: string, userId: string | null): Promise<AiChatSession> {
        const session = await AiHealthChatService.validateSession(sessionId, userId);

        const updated = await AiHealthChatRepository.updateSession(sessionId, {
            status: AI_CHAT_SESSION_STATUS.COMPLETED,
            completed_at: new Date(),
        });

        if (!updated) {
            throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Không thể cập nhật phiên.');
        }

        return updated;
    }

    // ═══════════════════════════════════════════════════════════════
    //  5. GET SESSION HISTORY — Lịch sử chat 1 phiên
    // ═══════════════════════════════════════════════════════════════

    /**
     * Lấy thông tin phiên kèm toàn bộ tin nhắn.
     * Dùng để hiển thị lại lịch sử chat cho BN.
     */
    static async getSessionHistory(sessionId: string, userId: string | null): Promise<AiChatSessionDetail> {
        const session = await AiHealthChatRepository.getSessionById(sessionId);
        if (!session) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }

        // Kiểm tra quyền: chỉ user tạo phiên mới được xem (bỏ qua cho guest)
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED', AI_CHAT_ERRORS.UNAUTHORIZED);
        }

        const messages = await AiHealthChatRepository.getMessagesBySession(sessionId);

        return { session, messages };
    }

    // ═══════════════════════════════════════════════════════════════
    //  6. GET USER SESSIONS — Danh sách phiên của user
    // ═══════════════════════════════════════════════════════════════

    /**
     * Lấy danh sách phiên tư vấn AI của user (phân trang).
     * Hỗ trợ lọc theo status (ACTIVE, COMPLETED, EXPIRED).
     */
    static async getUserSessions(
        userId: string | null,
        page: number = 1,
        limit: number = 10,
        status?: string
    ): Promise<{ data: AiChatSession[]; total: number; page: number; limit: number }> {
        const validPage = page > 0 ? page : 1;
        const validLimit = limit > 0 && limit <= 50 ? limit : 10;

        // Guest không có danh sách phiên
        if (!userId) {
            return { data: [], total: 0, page: validPage, limit: validLimit };
        }

        const [data, total] = await AiHealthChatRepository.getSessionsByUser(
            userId,
            validPage,
            validLimit,
            status
        );

        return { data, total, page: validPage, limit: validLimit };
    }

    // ═══════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Validate phiên: kiểm tra tồn tại, quyền truy cập, và trạng thái.
     */
    private static async validateSession(sessionId: string, userId: string | null): Promise<AiChatSession> {
        const session = await AiHealthChatRepository.getSessionById(sessionId);
        if (!session) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }
        // Bỏ qua kiểm tra quyền cho guest (userId = null)
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED', AI_CHAT_ERRORS.UNAUTHORIZED);
        }
        if (session.status === AI_CHAT_SESSION_STATUS.COMPLETED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SESSION_COMPLETED', AI_CHAT_ERRORS.SESSION_ALREADY_COMPLETED);
        }
        if (session.status === AI_CHAT_SESSION_STATUS.EXPIRED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SESSION_EXPIRED', AI_CHAT_ERRORS.SESSION_EXPIRED);
        }
        return session;
    }

    /**
     * Khi AI phân tích xong (is_complete = true), map specialty_code
     * từ Gemini response sang specialty_id thật trong DB.
     * Cập nhật session với kết quả gợi ý.
     */
    private static async applyAnalysisToSession(
        updates: Partial<AiChatSession>,
        analysis: AiAnalysisData
    ): Promise<void> {
        if (analysis.suggested_specialty_code) {
            const specialty = await AiHealthChatRepository.findSpecialtyByCode(
                analysis.suggested_specialty_code
            );
            if (specialty) {
                updates.suggested_specialty_id = specialty.specialties_id;
                updates.suggested_specialty_name = specialty.name;
            } else {
                // Nếu AI gợi ý code không tồn tại trong DB → vẫn lưu tên
                updates.suggested_specialty_name = analysis.suggested_specialty_name;
            }
        }

        updates.suggested_priority = analysis.priority;

        if (analysis.symptoms_collected.length > 0) {
            updates.symptoms_summary = analysis.symptoms_collected.join(', ');
        }

        if (analysis.reasoning) {
            updates.ai_conclusion = analysis.reasoning;
        }
    }
}
