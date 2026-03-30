import { randomUUID } from 'crypto';
import { Response } from 'express';
import { getGeminiModelWithSchema, getGeminiModelByName } from '../../config/gemini';
import { AiHealthChatRepository } from '../../repository/AI/ai-health-chat.repository';
import { AiRagService } from './ai-rag.service';
import {
    AiChatSession,
    AiChatMessage,
    AiAnalysisData,
    AiChatResponse,
    AiChatSessionDetail,
    SpecialtyForPrompt,
    ConversationState,
    GeminiStructuredResponse,
    AiTokenUsageDaily,
    AiTokenUsageSummary,
} from '../../models/AI/ai-health-chat.model';
import {
    AI_GEMINI_CONFIG,
    AI_CHAT_CONFIG,
    AI_CHAT_STATUS,
    AI_CHAT_ROLES,
    AI_CHAT_ERRORS,
    AI_CORE_PROMPT,
    AI_COMPACT_PROMPT,
    AI_DISEASE_KNOWLEDGE_BASE,
    AI_CONVERSATION_PHASES,
    AI_CONVERSATION_CONFIG,
    RED_FLAG_KEYWORDS,
    AI_CHAT_FEEDBACK_VALUES,
    AI_CHAT_FEEDBACK_CONFIG,
    AI_FEEDBACK_INSIGHT_CONFIG,
    AI_PHASE_RULES,
    AI_USER_QUOTA_CONFIG,
} from '../../constants/ai-health-chat.constant';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';


export class AiHealthChatService {

    /** In-memory cache cho feedback insights — tránh query DB mỗi lượt chat */
    private static feedbackInsightCache: { text: string; expiry: number } | null = null;

    /**
     * Lấy feedback insights đã cache (hoặc query mới nếu hết hạn).
     */
    private static async getFeedbackInsights(): Promise<string> {
        try {
            // Check cache
            if (this.feedbackInsightCache && Date.now() < this.feedbackInsightCache.expiry) {
                return this.feedbackInsightCache.text;
            }

            const { MAX_RECENT_FEEDBACKS, LOOKBACK_DAYS, MAX_GOOD_MESSAGE_SAMPLES, GOOD_MESSAGE_TRUNCATE_LENGTH } = AI_FEEDBACK_INSIGHT_CONFIG;

            // Query GOOD notes, BAD notes, và GOOD message samples song song
            const [goodNotes, badNotes, goodSamples] = await Promise.all([
                AiHealthChatRepository.getRecentFeedbackNotes('GOOD', MAX_RECENT_FEEDBACKS, LOOKBACK_DAYS),
                AiHealthChatRepository.getRecentFeedbackNotes('BAD', MAX_RECENT_FEEDBACKS, LOOKBACK_DAYS),
                AiHealthChatRepository.getGoodRatedMessageSamples(MAX_GOOD_MESSAGE_SAMPLES, LOOKBACK_DAYS, GOOD_MESSAGE_TRUNCATE_LENGTH),
            ]);

            const sections: string[] = [];

            // Section GOOD — phong cách hiệu quả
            if (goodNotes.length > 0 || goodSamples.length > 0) {
                const goodParts: string[] = ['👍 PHONG CÁCH HIỆU QUẢ (user đánh giá tốt — HÃY DUY TRÌ):'];
                goodNotes.forEach((r: { feedback_note: string }) => goodParts.push(`- ${r.feedback_note}`));
                goodSamples.forEach((r: { content: string }) => goodParts.push(`- [Mẫu phản hồi tốt]: "${r.content}${r.content.length >= GOOD_MESSAGE_TRUNCATE_LENGTH ? '...' : ''}"`));
                sections.push(goodParts.join('\n'));
            }

            // Section BAD — cần tránh
            if (badNotes.length > 0) {
                const badParts: string[] = ['👎 CẦN TRÁNH (user đánh giá kém):'];
                badNotes.forEach((r: { feedback_note: string }) => badParts.push(`- ${r.feedback_note}`));
                sections.push(badParts.join('\n'));
            }

            const text = sections.length > 0
                ? `Dựa trên phản hồi gần đây từ người dùng:\n\n${sections.join('\n\n')}`
                : '';

            // Cache kết quả
            this.feedbackInsightCache = {
                text,
                expiry: Date.now() + AI_FEEDBACK_INSIGHT_CONFIG.CACHE_TTL_MS,
            };

            return text;
        } catch (error) {
            console.error('[AiHealthChatService] getFeedbackInsights error:', error);
            return '';
        }
    }

    /**
     * Tạo phiên tư vấn AI mới.
     */
    static async startSession(
        userId: string | null,
        message: string
    ): Promise<AiChatResponse> {
        this.validateMessage(message);

        // Kiểm tra giới hạn phiên ACTIVE đồng thời (chỉ áp dụng cho user đã đăng nhập)
        if (userId) {
            const activeCount = await AiHealthChatRepository.countActiveSessionsByUser(userId);
            if (activeCount >= AI_CHAT_CONFIG.MAX_ACTIVE_SESSIONS) {
                throw new AppError(HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_SESSIONS', AI_CHAT_ERRORS.MAX_SESSIONS_REACHED);
            }

            // Kiểm tra user quota (cross-session) — giới hạn tổng số tin nhắn trong window
            await this.checkUserQuota(userId);
        }

        // Tạo session mới với conversation_state mặc định
        const sessionId = `AIC_${this.shortId()}`;
        const sessionCode = this.generateSessionCode();

        const session = await AiHealthChatRepository.createSession({
            session_id: sessionId,
            session_code: sessionCode,
            user_id: userId,
            patient_id: null,
            status: AI_CHAT_STATUS.ACTIVE,
            message_count: 0,
        });

        // Lấy danh sách chuyên khoa + RAG context + feedback insights song song
        // Lượt đầu chưa có conversationState đầy đủ → không filter categories
        const [specialties, ragContext, feedbackInsights] = await Promise.all([
            AiHealthChatRepository.getActiveSpecialties(),
            this.safeRetrieveContext(message),
            this.getFeedbackInsights(),
        ]);

        // Build system prompt — lượt đầu gửi FULL prompt (Gemini cần nắm đầy đủ rules)
        const conversationState: ConversationState = session.conversation_state;
        const systemPrompt = this.buildSystemPrompt(specialties, ragContext, conversationState, feedbackInsights, true);

        // Gọi Gemini với Structured Output
        const startTime = Date.now();
        const aiRawResponse = await this.callGeminiWithFallback(systemPrompt, [], message);
        const responseTimeMs = Date.now() - startTime;

        const { textReply, analysisData: rawAnalysis, modelUsed, tokensUsed } = aiRawResponse;

        // Server-side enforcement
        const analysisData = rawAnalysis
            ? this.enforceAnalysisConsistency(rawAnalysis, conversationState, message)
            : this.getDefaultAnalysis();

        // Lưu 2 tin nhắn: USER + ASSISTANT
        const userMsgId = `MSG_${this.shortId()}`;
        const assistantMsgId = `MSG_${this.shortId()}`;

        await Promise.all([
            AiHealthChatRepository.addMessage({
                message_id: userMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.USER,
                content: message,
                tokens_used: 0,
                response_time_ms: 0,
            }),
            AiHealthChatRepository.addMessage({
                message_id: assistantMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.ASSISTANT,
                content: textReply,
                model_used: modelUsed,
                tokens_used: tokensUsed,
                response_time_ms: responseTimeMs,
                analysis_data: analysisData,
            }),
        ]);

        // State Machine: xác định phase + locking dựa trên AI analysis
        const updatedState = this.updateConversationState(conversationState, analysisData, message);

        // Server-side Symptom Tracking: merge triệu chứng
        this.mergeSymptomTracking(updatedState, analysisData);

        // Cập nhật session
        const sessionUpdates = await this.buildSessionUpdates(analysisData, 2, updatedState);
        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

        return {
            session: updatedSession || session,
            ai_reply: textReply,
            analysis: analysisData,
            assistant_message_id: assistantMsgId,
        };
    }

    /**
     * Gửi tin nhắn tiếp theo trong phiên (JSON response).
     */
    static async sendMessage(
        sessionId: string,
        userId: string | null,
        message: string
    ): Promise<AiChatResponse> {
        this.validateMessage(message);

        const session = await this.validateAndGetSession(sessionId, userId);

        // Kiểm tra giới hạn tin nhắn per session
        if (session.message_count >= AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MAX_MESSAGES', AI_CHAT_ERRORS.MAX_MESSAGES_REACHED);
        }

        // Kiểm tra user quota (cross-session)
        if (userId) {
            await this.checkUserQuota(userId);
        }

        const conversationState: ConversationState = session.conversation_state;
        const useSummary = session.message_count >= AI_CONVERSATION_CONFIG.SUMMARY_TRIGGER_MESSAGE_COUNT;

        // Load history + specialties + RAG context (filtered) + feedback insights song song
        const ragCategories = this.mapIntentToCategories(conversationState);
        const [existingMessages, specialties, ragContext, feedbackInsights] = await Promise.all([
            useSummary
                ? AiHealthChatRepository.getRecentMessages(sessionId, AI_CONVERSATION_CONFIG.RECENT_MESSAGES_TO_KEEP)
                : AiHealthChatRepository.getMessagesBySession(sessionId),
            AiHealthChatRepository.getActiveSpecialties(),
            this.safeRetrieveContext(
                this.buildEnrichedQuery(message, conversationState),
                ragCategories
            ),
            this.getFeedbackInsights(),
        ]);

        // Prompt tiered: lượt đầu (message_count <= 2) → full prompt, lượt sau → compact
        const isFirstTurn = session.message_count <= 2;
        const systemPrompt = this.buildSystemPrompt(specialties, ragContext, conversationState, feedbackInsights, isFirstTurn);

        // Convert history sang format Gemini
        const geminiHistory = this.convertHistoryToGemini(existingMessages);

        // Gọi Gemini
        const startTime = Date.now();
        const aiRawResponse = await this.callGeminiWithFallback(systemPrompt, geminiHistory, message);
        const responseTimeMs = Date.now() - startTime;

        const { textReply, analysisData: rawAnalysis, modelUsed, tokensUsed } = aiRawResponse;

        // Server-side enforcement
        const analysisData = rawAnalysis
            ? this.enforceAnalysisConsistency(rawAnalysis, conversationState, message)
            : this.getDefaultAnalysis();

        // Lưu 2 tin nhắn
        const userMsgId = `MSG_${this.shortId()}`;
        const assistantMsgId = `MSG_${this.shortId()}`;

        await Promise.all([
            AiHealthChatRepository.addMessage({
                message_id: userMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.USER,
                content: message,
                tokens_used: 0,
                response_time_ms: 0,
            }),
            AiHealthChatRepository.addMessage({
                message_id: assistantMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.ASSISTANT,
                content: textReply,
                model_used: modelUsed,
                tokens_used: tokensUsed,
                response_time_ms: responseTimeMs,
                analysis_data: analysisData,
            }),
        ]);

        // State Machine + Symptom Tracking
        const updatedState = this.updateConversationState(conversationState, analysisData, message);
        this.mergeSymptomTracking(updatedState, analysisData);

        // Rolling Memory: tạo summary nếu đã đủ tin nhắn
        const newMessageCount = session.message_count + 2;
        if (newMessageCount >= AI_CONVERSATION_CONFIG.SUMMARY_TRIGGER_MESSAGE_COUNT && !updatedState.conversation_summary) {
            updatedState.conversation_summary = this.buildConversationSummary(updatedState, analysisData);
        } else if (updatedState.conversation_summary) {
            // Cập nhật summary hiện có
            updatedState.conversation_summary = this.buildConversationSummary(updatedState, analysisData);
        }

        // Cập nhật session
        const sessionUpdates = await this.buildSessionUpdates(analysisData, newMessageCount, updatedState);

        // Map specialty_code → specialty_id
        if (analysisData?.suggested_specialty_code) {
            const specialty = await AiHealthChatRepository.findSpecialtyByCode(analysisData.suggested_specialty_code);
            if (specialty) {
                sessionUpdates.suggested_specialty_id = specialty.specialties_id;
                sessionUpdates.suggested_specialty_name = specialty.name;
            }
        }

        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

        return {
            session: updatedSession || session,
            ai_reply: textReply,
            analysis: analysisData,
            assistant_message_id: assistantMsgId,
        };
    }

    /**
     * Gửi tin nhắn với streaming response (SSE).
     * SSE Events: chunk → analysis → done | error.
     */
    static async sendMessageStream(
        sessionId: string,
        userId: string | null,
        message: string,
        res: Response
    ): Promise<void> {
        this.validateMessage(message);

        const session = await this.validateAndGetSession(sessionId, userId);

        if (session.message_count >= AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MAX_MESSAGES', AI_CHAT_ERRORS.MAX_MESSAGES_REACHED);
        }

        // Kiểm tra user quota (cross-session)
        if (userId) {
            await this.checkUserQuota(userId);
        }

        // Setup SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        try {
            const conversationState: ConversationState = session.conversation_state;
            const useSummary = session.message_count >= AI_CONVERSATION_CONFIG.SUMMARY_TRIGGER_MESSAGE_COUNT;

            const ragCategories = this.mapIntentToCategories(conversationState);
            
            // Tối ưu tốc độ phản hồi: Bỏ qua RAG cho những câu chào hỏi siêu ngắn
            const isSimpleGreeting = message.trim().length <= 15 && /^(hi|hello|chào|chao|alo|xin chào|hey)/i.test(message.trim());

            const [existingMessages, specialties, ragContext, feedbackInsights] = await Promise.all([
                useSummary
                    ? AiHealthChatRepository.getRecentMessages(sessionId, AI_CONVERSATION_CONFIG.RECENT_MESSAGES_TO_KEEP)
                    : AiHealthChatRepository.getMessagesBySession(sessionId),
                AiHealthChatRepository.getActiveSpecialties(),
                isSimpleGreeting
                    ? Promise.resolve('')
                    : this.safeRetrieveContext(
                        this.buildEnrichedQuery(message, conversationState),
                        ragCategories
                    ),
                this.getFeedbackInsights(),
            ]);

            const isFirstTurn = session.message_count <= 2;
            const systemPrompt = this.buildSystemPrompt(specialties, ragContext, conversationState, feedbackInsights, isFirstTurn);
            const geminiHistory = this.convertHistoryToGemini(existingMessages);

            const startTime = Date.now();

            // Gọi Gemini streaming
            const { stream, modelUsed } = await this.callGeminiStreamWithFallback(systemPrompt, geminiHistory, message);

            let fullText = '';
            let totalTokens = 0;
            let streamBlocked = false;
            let lastSentLength = 0;

            // Stream từng chunk text tới client
            for await (const chunk of stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    fullText += chunkText;
                    
                    // Cơ chế "Block Stream thông minh": Ẩn phần JSON khỏi Frontend khi SSE
                    if (!streamBlocked) {
                        const jsonIndex = fullText.indexOf('```json');
                        if (jsonIndex !== -1) {
                            streamBlocked = true;
                            // Gửi nốt đoạn text sạch còn dư lại trước khi block
                            const safeText = fullText.substring(0, jsonIndex);
                            const remainingUnsent = safeText.substring(lastSentLength);
                            if (remainingUnsent.length > 0) {
                                res.write(`data: ${JSON.stringify({ type: 'chunk', content: remainingUnsent })}\n\n`);
                            }
                        } else {
                            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
                            lastSentLength = fullText.length;
                        }
                    }
                }
                if (chunk.usageMetadata?.totalTokenCount) {
                    totalTokens = chunk.usageMetadata.totalTokenCount;
                }
            }

            const responseTimeMs = Date.now() - startTime;

            /**
             * Streaming dùng model thường (không JSON schema) → response là text + JSON block.
             * Parse bằng fallback parser (regex) để tách text sạch + analysis.
             */
            const { textReply: rawTextReply, analysisData: rawAnalysis } = this.fallbackParseResponse(fullText);

            // Server-side enforcement
            const analysisData = this.enforceAnalysisConsistency(rawAnalysis, conversationState, message);

            // Fix empty text: nếu AI trả JSON-only, tạo fallback text từ analysis
            const textReply = rawTextReply.trim()
                ? rawTextReply
                : this.generateFallbackText(analysisData);

            // Gửi event replace — client thay thế nội dung đã stream bằng text sạch (đã loại bỏ JSON block)
            if (textReply !== fullText) {
                res.write(`data: ${JSON.stringify({ type: 'replace', content: textReply })}\n\n`);
            }

            // Gửi event analysis
            res.write(`data: ${JSON.stringify({ type: 'analysis', data: analysisData })}\n\n`);

            // Lưu messages vào DB
            const userMsgId = `MSG_${this.shortId()}`;
            const assistantMsgId = `MSG_${this.shortId()}`;

            await Promise.all([
                AiHealthChatRepository.addMessage({
                    message_id: userMsgId,
                    session_id: sessionId,
                    role: AI_CHAT_ROLES.USER,
                    content: message,
                    tokens_used: 0,
                    response_time_ms: 0,
                }),
                AiHealthChatRepository.addMessage({
                    message_id: assistantMsgId,
                    session_id: sessionId,
                    role: AI_CHAT_ROLES.ASSISTANT,
                    content: textReply,
                    model_used: modelUsed,
                    tokens_used: totalTokens,
                    response_time_ms: responseTimeMs,
                    analysis_data: analysisData,
                }),
            ]);

            // State Machine + Symptom Tracking
            const updatedState = this.updateConversationState(conversationState, analysisData, message);
            this.mergeSymptomTracking(updatedState, analysisData);

            // Rolling Memory
            const newMessageCount = session.message_count + 2;
            if (newMessageCount >= AI_CONVERSATION_CONFIG.SUMMARY_TRIGGER_MESSAGE_COUNT) {
                updatedState.conversation_summary = this.buildConversationSummary(updatedState, analysisData);
            }

            // Cập nhật session
            const sessionUpdates = await this.buildSessionUpdates(analysisData, newMessageCount, updatedState);

            if (analysisData?.suggested_specialty_code) {
                const specialty = await AiHealthChatRepository.findSpecialtyByCode(analysisData.suggested_specialty_code);
                if (specialty) {
                    sessionUpdates.suggested_specialty_id = specialty.specialties_id;
                    sessionUpdates.suggested_specialty_name = specialty.name;
                }
            }

            const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

            // Gửi event done — kèm assistant_message_id để frontend dùng cho feedback
            res.write(`data: ${JSON.stringify({ type: 'done', session: updatedSession, assistant_message_id: assistantMsgId })}\n\n`);
            res.end();

        } catch (error: any) {
            const errorMessage = error instanceof AppError ? error.message : AI_CHAT_ERRORS.AI_SERVICE_ERROR;
            res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
            res.end();
        }
    }

    /**
     * Kết thúc phiên tư vấn — đánh dấu COMPLETED.
     */
    static async completeSession(
        sessionId: string,
        userId: string | null
    ): Promise<AiChatSession> {
        const session = await this.validateAndGetSession(sessionId, userId);

        if (session.status !== AI_CHAT_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SESSION_NOT_ACTIVE', AI_CHAT_ERRORS.SESSION_NOT_ACTIVE);
        }

        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, {
            status: AI_CHAT_STATUS.COMPLETED,
            completed_at: new Date(),
        });

        return updatedSession!;
    }

    /**
     * Lấy lịch sử chat của 1 phiên (session + messages).
     * Cho phép xem mọi status trừ DELETED (persistent chat).
     */
    static async getSessionHistory(
        sessionId: string,
        userId: string | null
    ): Promise<AiChatSessionDetail> {
        const session = await AiHealthChatRepository.getSessionById(sessionId);

        if (!session || session.status === AI_CHAT_STATUS.DELETED) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }

        // Kiểm tra quyền sở hữu
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED_SESSION', AI_CHAT_ERRORS.UNAUTHORIZED_SESSION);
        }

        const messages = await AiHealthChatRepository.getMessagesBySession(sessionId);
        return { session, messages };
    }

    /**
     * Danh sách phiên tư vấn AI của user (phân trang).
     */
    static async getUserSessions(
        userId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<{ sessions: AiChatSession[]; total: number }> {
        const [sessions, total] = await AiHealthChatRepository.getSessionsByUser(userId, page, limit, status);
        return { sessions, total };
    }

    //  FEEDBACK
    /**
     * Ghi nhận đánh giá chất lượng phản hồi AI từ user.
     * Validate: session ownership, message thuộc session, role ASSISTANT, chưa feedback.
     */
    static async submitFeedback(
        sessionId: string,
        userId: string | null,
        messageId: string,
        feedback: string,
        note: string | null
    ): Promise<AiChatMessage> {
        // 1. Validate session tồn tại và thuộc user
        const session = await AiHealthChatRepository.getSessionById(sessionId);
        if (!session) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED_SESSION', AI_CHAT_ERRORS.UNAUTHORIZED_SESSION);
        }

        // 2. Validate feedback value
        const validValues = Object.values(AI_CHAT_FEEDBACK_VALUES);
        if (!validValues.includes(feedback as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_FEEDBACK', AI_CHAT_ERRORS.INVALID_FEEDBACK);
        }

        // 3. Validate note length
        if (note && note.length > AI_CHAT_FEEDBACK_CONFIG.MAX_NOTE_LENGTH) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOTE_TOO_LONG', AI_CHAT_ERRORS.FEEDBACK_NOTE_TOO_LONG);
        }

        // 4. Validate message tồn tại và thuộc session
        const message = await AiHealthChatRepository.getMessageById(messageId);
        if (!message) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'MESSAGE_NOT_FOUND', AI_CHAT_ERRORS.MESSAGE_NOT_FOUND);
        }
        if (message.session_id !== sessionId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MESSAGE_NOT_FOUND', AI_CHAT_ERRORS.MESSAGE_NOT_FOUND);
        }

        // 5. Chỉ cho phép đánh giá tin nhắn ASSISTANT
        if (message.role !== AI_CHAT_ROLES.ASSISTANT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'FEEDBACK_ONLY_ASSISTANT', AI_CHAT_ERRORS.FEEDBACK_ONLY_ASSISTANT);
        }

        // 6. Không cho ghi đè feedback đã submit
        if (message.user_feedback) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'FEEDBACK_ALREADY_SUBMITTED', AI_CHAT_ERRORS.FEEDBACK_ALREADY_SUBMITTED);
        }

        // 7. Cập nhật feedback
        const updated = await AiHealthChatRepository.updateMessageFeedback(messageId, feedback, note || null);
        return updated!;
    }

    /**
     * Thống kê token usage + feedback theo khoảng ngày.
     */
    static async getTokenAnalytics(
        startDate: string,
        endDate: string
    ): Promise<{ daily: AiTokenUsageDaily[]; summary: AiTokenUsageSummary }> {
        const [daily, summary] = await Promise.all([
            AiHealthChatRepository.getTokenUsageDaily(startDate, endDate),
            AiHealthChatRepository.getTokenUsageSummary(startDate, endDate),
        ]);
        return { daily, summary };
    }

    /**
     * Soft delete phiên chat — chuyển status sang DELETED.
     */
    static async deleteSession(sessionId: string, userId: string | null): Promise<void> {
        const session = await AiHealthChatRepository.getSessionById(sessionId);
        if (!session) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }

        // Kiểm tra quyền sở hữu phiên
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED', AI_CHAT_ERRORS.UNAUTHORIZED_SESSION);
        }

        // Không cho xóa phiên đã xóa
        if (session.status === AI_CHAT_STATUS.DELETED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_DELETED', AI_CHAT_ERRORS.SESSION_ALREADY_DELETED);
        }

        await AiHealthChatRepository.updateSession(sessionId, {
            status: AI_CHAT_STATUS.DELETED,
        } as any);
    }

    //  VALIDATION
    /**
     * Validate tin nhắn đầu vào: không rỗng, không quá dài.
     */
    private static validateMessage(message: string): void {
        if (!message || !message.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
        }
        if (message.length > AI_CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MESSAGE_TOO_LONG', AI_CHAT_ERRORS.MESSAGE_TOO_LONG);
        }
    }

    /**
     * Validate phiên tồn tại, thuộc sở hữu user.
     * EXPIRED/COMPLETED → tự động reopen (chuyển lại ACTIVE) nếu còn slot.
     * DELETED → không cho mở lại.
     */
    private static async validateAndGetSession(
        sessionId: string,
        userId: string | null
    ): Promise<AiChatSession> {
        const session = await AiHealthChatRepository.getSessionById(sessionId);

        if (!session) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }

        // Kiểm tra quyền sở hữu (chỉ áp dụng nếu cả 2 đều có userId)
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED_SESSION', AI_CHAT_ERRORS.UNAUTHORIZED_SESSION);
        }

        // DELETED → không cho mở lại
        if (session.status === AI_CHAT_STATUS.DELETED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SESSION_DELETED', AI_CHAT_ERRORS.SESSION_DELETED_CANNOT_REOPEN);
        }

        // EXPIRED hoặc COMPLETED → tự động reopen (giống ChatGPT)
        if (session.status === AI_CHAT_STATUS.EXPIRED || session.status === AI_CHAT_STATUS.COMPLETED) {
            // Kiểm tra giới hạn 3 phiên ACTIVE trước khi reopen
            if (userId) {
                const activeCount = await AiHealthChatRepository.countActiveSessionsByUser(userId);
                if (activeCount >= AI_CHAT_CONFIG.MAX_ACTIVE_SESSIONS) {
                    throw new AppError(HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_SESSIONS', AI_CHAT_ERRORS.MAX_SESSIONS_REACHED);
                }
            }
            await AiHealthChatRepository.updateSession(sessionId, { status: AI_CHAT_STATUS.ACTIVE } as any);
            session.status = AI_CHAT_STATUS.ACTIVE;
            console.log(`♻️ [AI Chat] Session ${sessionId} reopened (was ${session.status}).`);
        }

        return session;
    }

    /**
     * Kiểm tra user quota cross-session.
     * Giới hạn tổng số tin nhắn USER được gửi trong khoảng thời gian window.
     * Nếu hết quota → ném lỗi kèm thông báo chờ.
     */
    private static async checkUserQuota(userId: string): Promise<void> {
        const messagesInWindow = await AiHealthChatRepository.countUserMessagesInWindow(
            userId,
            AI_USER_QUOTA_CONFIG.WINDOW_HOURS
        );

        if (messagesInWindow >= AI_USER_QUOTA_CONFIG.MAX_MESSAGES_PER_WINDOW) {
            throw new AppError(
                HTTP_STATUS.TOO_MANY_REQUESTS,
                'USER_QUOTA_EXHAUSTED',
                AI_CHAT_ERRORS.USER_QUOTA_EXHAUSTED
            );
        }
    }

    //  STATE MACHINE — Chống lạc đề
    /**
     * Cập nhật trạng thái hội thoại dựa trên AI analysis.
     * Xác định phase transition + topic locking.
     */
    private static updateConversationState(
        currentState: ConversationState,
        analysisData: AiAnalysisData | null,
        userMessage: string
    ): ConversationState {
        const state = { ...currentState };

        if (!analysisData) return state;

        // Phase transition logic
        state.phase = this.determinePhaseTransition(state, analysisData);

        // Topic locking: khóa chuyên khoa ngay khi AI phát hiện triệu chứng
        if (
            state.phase === AI_CONVERSATION_PHASES.DISCOVERY &&
            !state.locked_specialty_group &&
            analysisData.suggested_specialty_code
        ) {
            state.locked_specialty_group = analysisData.suggested_specialty_code;
            state.locked_specialty_name = analysisData.suggested_specialty_name || null;
        }

        // Đếm câu hỏi trong DISCOVERY
        if (state.phase === AI_CONVERSATION_PHASES.DISCOVERY) {
            state.questions_asked += 1;
        }

        // Đánh dấu discovery hoàn thành
        if (analysisData.is_complete) {
            state.discovery_complete = true;
        }

        // Persist severity/priority/needs_doctor high-water marks cho enforcement
        if (analysisData.severity) {
            state.last_severity = analysisData.severity;
        }
        if (analysisData.priority) {
            state.last_priority = analysisData.priority;
        }
        if (analysisData.needs_doctor) {
            state.last_needs_doctor = true;
        }

        // Persist symptom tracking cho mergeWithPreviousAnalysis
        if (analysisData.symptoms_collected?.length) {
            state.symptom_tracking = {
                collected: [...analysisData.symptoms_collected],
                excluded: state.symptom_tracking?.excluded || [],
            };
        }

        return state;
    }

    /**
     * Xác định phase transition dựa trên state hiện tại + AI analysis.
     *
     * GREETING → DISCOVERY: user mô tả triệu chứng (symptoms_collected > 0)
     * DISCOVERY → ASSESSMENT: đủ triệu chứng hoặc đủ câu hỏi
     * ASSESSMENT → RECOMMENDATION: AI đã is_complete + có specialty_code
     * RECOMMENDATION → FOLLOW_UP: user hỏi thêm sau kết luận
     */
    private static determinePhaseTransition(
        state: ConversationState,
        analysisData: AiAnalysisData
    ): string {
        const { phase } = state;
        const symptomsCount = analysisData.symptoms_collected?.length || 0;

        switch (phase) {
            case AI_CONVERSATION_PHASES.GREETING:
                // Chuyển sang DISCOVERY nếu user bắt đầu mô tả triệu chứng
                if (symptomsCount > 0) {
                    return AI_CONVERSATION_PHASES.DISCOVERY;
                }
                return phase;

            case AI_CONVERSATION_PHASES.DISCOVERY:
                // Chuyển sang ASSESSMENT nếu đủ triệu chứng hoặc đã hỏi đủ câu
                if (
                    symptomsCount >= AI_CONVERSATION_CONFIG.MIN_SYMPTOMS_FOR_ASSESSMENT ||
                    state.questions_asked >= AI_CONVERSATION_CONFIG.MAX_DISCOVERY_QUESTIONS ||
                    analysisData.is_complete
                ) {
                    return AI_CONVERSATION_PHASES.ASSESSMENT;
                }
                // Red flags → nhảy thẳng RECOMMENDATION
                if (analysisData.red_flags_detected && analysisData.red_flags_detected.length > 0) {
                    return AI_CONVERSATION_PHASES.RECOMMENDATION;
                }
                return phase;

            case AI_CONVERSATION_PHASES.ASSESSMENT:
                // Chuyển RECOMMENDATION khi AI hoàn thành
                if (analysisData.is_complete && analysisData.suggested_specialty_code) {
                    return AI_CONVERSATION_PHASES.RECOMMENDATION;
                }
                return phase;

            case AI_CONVERSATION_PHASES.RECOMMENDATION:
                // Nếu user tiếp tục hỏi → FOLLOW_UP
                return AI_CONVERSATION_PHASES.FOLLOW_UP;

            case AI_CONVERSATION_PHASES.FOLLOW_UP:
                return phase;

            default:
                return AI_CONVERSATION_PHASES.GREETING;
        }
    }

    //  SERVER-SIDE SYMPTOM TRACKING
    /**
     * Merge triệu chứng từ AI analysis vào server state.
     * Đảm bảo không mất triệu chứng đã thu thập dù AI quên.
     */
    private static mergeSymptomTracking(
        state: ConversationState,
        analysisData: AiAnalysisData | null
    ): void {
        if (!analysisData) return;

        const aiSymptoms = analysisData.symptoms_collected || [];

        // Phân loại triệu chứng thành collected và excluded
        for (const symptom of aiSymptoms) {
            const lowerSymptom = symptom.toLowerCase();
            const isExclusion = lowerSymptom.startsWith('không ') ||
                lowerSymptom.startsWith('chưa ') ||
                lowerSymptom.startsWith('hết ');

            if (isExclusion) {
                if (!state.symptoms_excluded.includes(symptom)) {
                    state.symptoms_excluded.push(symptom);
                }
            } else {
                if (!state.symptoms_collected.includes(symptom)) {
                    state.symptoms_collected.push(symptom);
                }
            }
        }
    }

    //  ROLLING MEMORY — Conversation Summary

    /**
     * Tạo tóm tắt hội thoại từ state hiện tại + AI analysis.
     * Dùng khi phiên dài (>6 tin) để thay thế gửi toàn bộ history.
     */
    private static buildConversationSummary(
        state: ConversationState,
        analysisData: AiAnalysisData | null
    ): string {
        const parts: string[] = [];

        if (state.locked_specialty_group) {
            parts.push(`- Vấn đề chính: nhóm chuyên khoa ${state.locked_specialty_group}`);
        }

        if (state.symptoms_collected.length > 0) {
            parts.push(`- Triệu chứng đã xác nhận: ${state.symptoms_collected.join(', ')}`);
        }

        if (state.symptoms_excluded.length > 0) {
            parts.push(`- Triệu chứng đã loại trừ: ${state.symptoms_excluded.join(', ')}`);
        }

        if (analysisData?.severity) {
            parts.push(`- Mức độ nghiêm trọng: ${analysisData.severity}`);
        }

        if (analysisData?.preliminary_assessment) {
            parts.push(`- Nhận định sơ bộ: ${analysisData.preliminary_assessment}`);
        }

        parts.push(`- Giai đoạn hiện tại: ${state.phase}`);
        parts.push(`- Số câu hỏi đã hỏi: ${state.questions_asked}`);

        return parts.join('\n');
    }

    //  PROMPT BUILDING

    /**
     * Build system prompt theo chiến lược Tiered Prompt.
     * - Lượt 1 (isFirstTurn=true): Full prompt + Disease KB — Gemini nắm đầy đủ instructions.
     * - Lượt 2+ (isFirstTurn=false): Compact prompt — chỉ state reminder + RAG + phase-specific rules.
     *   Gemini đã nhớ core prompt từ lượt 1 qua conversation history → giảm 30-50% tokens.
     */
    private static buildSystemPrompt(
        specialties: SpecialtyForPrompt[],
        ragContext: string,
        conversationState: ConversationState,
        feedbackInsights: string = '',
        isFirstTurn: boolean = true
    ): string {
        // Format danh sách chuyên khoa
        const specialtiesList = specialties.length > 0
            ? specialties.map(s => `- ${s.code}: ${s.name}${s.description ? ` (${s.description})` : ''}`).join('\n')
            : '- Chưa có dữ liệu chuyên khoa. Hãy gợi ý chung.';

        // Build conversation state block
        const stateBlock = this.buildStateBlock(conversationState);

        // Build conversation summary block
        const summaryBlock = conversationState.conversation_summary || 'Chưa có (phiên mới bắt đầu).';

        if (isFirstTurn) {
            // === FULL PROMPT — Lượt đầu tiên ===
            let prompt = AI_CORE_PROMPT
                .replace('{{SPECIALTIES_LIST}}', specialtiesList)
                .replace('{{RAG_CONTEXT}}', ragContext || 'Không có tài liệu tham khảo bổ sung.')
                .replace('{{CONVERSATION_STATE}}', stateBlock)
                .replace('{{CONVERSATION_SUMMARY}}', summaryBlock)
                .replace('{{FEEDBACK_INSIGHTS}}', feedbackInsights || 'Chưa có phản hồi cần lưu ý.');

            // Inject bảng kiến thức bệnh lý để mapping triệu chứng → chuyên khoa chính xác
            prompt += '\n\n' + AI_DISEASE_KNOWLEDGE_BASE;

            return prompt;
        }

        // === COMPACT PROMPT — Từ lượt 2 trở đi ===
        const phaseRules = this.getPhaseSpecificRules(conversationState.phase);

        const prompt = AI_COMPACT_PROMPT
            .replace('{{SPECIALTIES_LIST}}', specialtiesList)
            .replace('{{RAG_CONTEXT}}', ragContext || 'Không có tài liệu tham khảo bổ sung.')
            .replace('{{CONVERSATION_STATE}}', stateBlock)
            .replace('{{CONVERSATION_SUMMARY}}', summaryBlock)
            .replace('{{FEEDBACK_INSIGHTS}}', feedbackInsights || 'Chưa có phản hồi cần lưu ý.')
            .replace('{{PHASE_RULES}}', phaseRules);

        return prompt;
    }

    /**
     * Lấy rules cụ thể cho giai đoạn hiện tại — inject vào compact prompt.
     * Chỉ gửi rules của phase đang diễn ra, giảm token dư thừa.
     */
    private static getPhaseSpecificRules(phase: string): string {
        return AI_PHASE_RULES[phase] || AI_PHASE_RULES[AI_CONVERSATION_PHASES.DISCOVERY];
    }

    /**
     * Format conversation state thành text block inject vào prompt.
     */
    private static buildStateBlock(state: ConversationState): string {
        const lines: string[] = [
            `Giai đoạn: ${state.phase}`,
            `Chủ đề đã khóa: ${state.locked_specialty_group || 'Chưa khóa (đang chờ user mô tả triệu chứng)'}`,
        ];

        if (state.symptoms_collected.length > 0) {
            lines.push(`Triệu chứng đã thu thập: ${JSON.stringify(state.symptoms_collected)}`);
        }
        if (state.symptoms_excluded.length > 0) {
            lines.push(`Triệu chứng đã loại trừ: ${JSON.stringify(state.symptoms_excluded)}`);
        }

        lines.push(`Câu hỏi đã hỏi: ${state.questions_asked}/${AI_CONVERSATION_CONFIG.MAX_DISCOVERY_QUESTIONS}`);
        lines.push(`Discovery hoàn thành: ${state.discovery_complete ? 'Có' : 'Chưa'}`);

        return lines.join('\n');
    }

    /**
     * Enriched query cho RAG — kết hợp chủ đề + triệu chứng + câu hỏi hiện tại.
     */
    private static buildEnrichedQuery(message: string, state: ConversationState): string {
        if (state.locked_specialty_group && state.symptoms_collected.length > 0) {
            return `${state.locked_specialty_group}: ${state.symptoms_collected.join(', ')}. ${message}`;
        }
        return message;
    }

    //  GEMINI AI CALLS — Structured Output

    /**
     * Gọi Gemini với Structured Output + cơ chế fallback.
     */
    private static async callGeminiWithFallback(
        systemPrompt: string,
        history: Array<{ role: string; parts: Array<{ text: string }> }>,
        userMessage: string
    ): Promise<{
        textReply: string;
        analysisData: AiAnalysisData | null;
        modelUsed: string;
        tokensUsed: number;
    }> {
        // Deduplicate: loại bỏ model trùng tên
        const allModels = [...new Set([AI_GEMINI_CONFIG.MODEL_NAME, ...AI_GEMINI_CONFIG.FALLBACK_MODELS])];

        for (let i = 0; i < allModels.length; i++) {
            const modelName = allModels[i];
            try {
                const model = getGeminiModelWithSchema(modelName);

                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: 'system: ' + systemPrompt }] },
                        { role: 'model', parts: [{ text: '{"text_reply": "Đã hiểu. Tôi sẽ tuân thủ đúng vai trò trợ lý AI sàng lọc triệu chứng.", "analysis": {"is_complete": false, "symptoms_collected": [], "needs_doctor": false, "reasoning": "Khởi tạo phiên"}}' }] },
                        ...history,
                    ],
                });

                const result = await chat.sendMessage(userMessage);
                const responseText = result.response.text();
                const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;

                // Parse structured JSON response
                const { textReply, analysisData } = this.parseStructuredResponse(responseText);

                if (i > 0) {
                    console.log(`✅ [AI Chat] Fallback thành công với model: ${modelName}`);
                }

                return {
                    textReply,
                    analysisData,
                    modelUsed: modelName,
                    tokensUsed,
                };

            } catch (error: any) {
                const isRateLimit = error?.status === 429 || error?.status === 503 ||
                    error?.message?.includes('429') || error?.message?.includes('503') ||
                    error?.message?.includes('Resource has been exhausted');

                // Model cuối cùng thất bại → throw
                if (i === allModels.length - 1) {
                    console.error(`❌ [AI Chat] Model ${modelName} thất bại (cuối cùng):`, error?.message);
                    throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
                }

                if (isRateLimit) {
                    console.warn(`⚠️ [AI Chat] Model ${modelName} bị 429/503, đang chuyển sang fallback...`);
                    const delay = AI_GEMINI_CONFIG.RETRY_DELAY_MS;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.warn(`⚠️ [AI Chat] Model ${modelName} không khả dụng, bỏ qua: ${error?.message?.slice(0, 100)}`);
                }
            }
        }

        throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
    }

    /**
     * Gọi Gemini Streaming với cơ chế fallback.
     * Streaming dùng model THƯỜNG (không JSON schema) để client nhận text dễ đọc.
     * Sau khi stream xong, parse fullText bằng fallback regex để tách analysis.
     */
    private static async callGeminiStreamWithFallback(
        systemPrompt: string,
        history: Array<{ role: string; parts: Array<{ text: string }> }>,
        userMessage: string
    ): Promise<{ stream: AsyncIterable<any>; modelUsed: string }> {
        const allModels = [...new Set([AI_GEMINI_CONFIG.MODEL_NAME, ...AI_GEMINI_CONFIG.FALLBACK_MODELS])];

        for (let i = 0; i < allModels.length; i++) {
            const modelName = allModels[i];
            try {
                /**
                 * Streaming mode: dùng model THƯỜNG (không JSON schema).
                 * AI sẽ trả text thân thiện cho BN đọc, stream chunk-by-chunk.
                 * JSON analysis block được parse sau khi stream xong.
                 */
                const model = getGeminiModelByName(modelName);

                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: 'system: ' + systemPrompt }] },
                        { role: 'model', parts: [{ text: 'Đã hiểu. Tôi sẽ tuân thủ đúng vai trò trợ lý AI sàng lọc triệu chứng và các quy tắc được giao.' }] },
                        ...history,
                    ],
                });

                const result = await chat.sendMessageStream(userMessage);

                if (i > 0) {
                    console.log(`✅ [AI Chat Stream] Fallback thành công với model: ${modelName}`);
                }

                return { stream: result.stream, modelUsed: modelName };

            } catch (error: any) {
                const isRateLimit = error?.status === 429 || error?.status === 503 ||
                    error?.message?.includes('429') || error?.message?.includes('503') ||
                    error?.message?.includes('Resource has been exhausted');

                if (i === allModels.length - 1) {
                    console.error(`❌ [AI Chat Stream] Model ${modelName} thất bại (cuối cùng):`, error?.message);
                    throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
                }

                if (isRateLimit) {
                    console.warn(`⚠️ [AI Chat Stream] Model ${modelName} bị 429/503, chuyển fallback...`);
                    const delay = AI_GEMINI_CONFIG.RETRY_DELAY_MS;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.warn(`⚠️ [AI Chat Stream] Model ${modelName} không khả dụng, bỏ qua: ${error?.message?.slice(0, 100)}`);
                }
            }
        }

        throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
    }

    //  RESPONSE PARSING — Structured Output

    /**
     * Parse Gemini Structured JSON Response.
     * Với responseMimeType: "application/json", Gemini trả pure JSON → JSON.parse trực tiếp.
     * Fallback regex nếu model cũ không hỗ trợ structured output.
     */
    private static parseStructuredResponse(rawText: string): {
        textReply: string;
        analysisData: AiAnalysisData;
    } {
        try {
            // Ưu tiên: parse trực tiếp JSON (Structured Output mode)
            const parsed: GeminiStructuredResponse = JSON.parse(rawText);

            if (parsed.text_reply && parsed.analysis) {
                return {
                    textReply: parsed.text_reply,
                    analysisData: this.normalizeAnalysisData(parsed.analysis),
                };
            }

            // Nếu JSON hợp lệ nhưng thiếu trường → xử lý graceful
            return {
                textReply: parsed.text_reply || rawText,
                analysisData: parsed.analysis
                    ? this.normalizeAnalysisData(parsed.analysis)
                    : this.getDefaultAnalysis(),
            };
        } catch {
            // Fallback: model trả text + JSON block (format cũ)
            console.warn('⚠️ [AI Chat] Response không phải pure JSON, thử fallback parse...');
            return this.fallbackParseResponse(rawText);
        }
    }

    /**
     * Fallback parser cho model không hỗ trợ structured output.
     * Tách text + JSON block bằng regex (logic cũ).
     */
    private static fallbackParseResponse(rawText: string): {
        textReply: string;
        analysisData: AiAnalysisData;
    } {
        let analysisData = this.getDefaultAnalysis();

        try {
            // Tìm block ```json ... ```
            const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
            const match = rawText.match(jsonBlockRegex);

            if (match && match[1]) {
                analysisData = this.normalizeAnalysisData(JSON.parse(match[1].trim()));
            } else {
                // Fallback: tìm raw JSON object
                const jsonObjectRegex = /\{[\s\S]*"is_complete"[\s\S]*\}/;
                const fallbackMatch = rawText.match(jsonObjectRegex);
                if (fallbackMatch) {
                    analysisData = this.normalizeAnalysisData(JSON.parse(fallbackMatch[0]));
                }
            }
        } catch (error) {
            console.warn('⚠️ [AI Chat] Fallback parse cũng thất bại, dùng default:', error);
        }

        // Tách text (loại bỏ JSON block)
        let textReply = rawText;
        textReply = textReply.replace(/```json[\s\S]*?```/g, '');
        textReply = textReply.replace(/```[\s\S]*?```/g, '');
        textReply = textReply.replace(/\{[\s\S]*?"is_complete"[\s\S]*?\}/g, '');
        textReply = textReply.replace(/```/g, '');
        textReply = textReply.replace(/\n{3,}/g, '\n\n').trim();

        return { textReply, analysisData };
    }

    /**
     * Chuẩn hóa dữ liệu analysis — đảm bảo tất cả trường đều có giá trị mặc định.
     */
    private static normalizeAnalysisData(raw: any): AiAnalysisData {
        return {
            is_complete: raw.is_complete ?? false,
            suggested_specialty_code: raw.suggested_specialty_code || null,
            suggested_specialty_name: raw.suggested_specialty_name || null,
            priority: raw.priority || null,
            symptoms_collected: Array.isArray(raw.symptoms_collected)
                ? raw.symptoms_collected.map((s: any) => typeof s === 'string' ? s : String(s))
                : [],
            should_suggest_booking: raw.should_suggest_booking ?? false,
            reasoning: raw.reasoning || null,
            severity: raw.severity || null,
            can_self_treat: raw.can_self_treat ?? false,
            preliminary_assessment: raw.preliminary_assessment || null,
            recommended_actions: Array.isArray(raw.recommended_actions) ? raw.recommended_actions : [],
            red_flags_detected: Array.isArray(raw.red_flags_detected) ? raw.red_flags_detected : [],
            needs_doctor: raw.needs_doctor ?? false,
            predicted_next_action: raw.predicted_next_action || null,
            suggested_follow_up_questions: Array.isArray(raw.suggested_follow_up_questions) ? raw.suggested_follow_up_questions : [],
            confidence_score: typeof raw.confidence_score === 'number' ? raw.confidence_score : null,
        };
    }

    // ══════════════════════════════════════
    //  SERVER-SIDE ENFORCEMENT — Đảm bảo nhất quán
    // ══════════════════════════════════════

    /**
     * Gọi cả 3 hàm enforcement theo thứ tự.
     * Đảm bảo analysis data KHÔNG BAO GIỜ giảm severity/priority, không đổi specialty khi đã lock,
     * và không reset về default khi parse thất bại.
     */
    private static enforceAnalysisConsistency(
        analysisData: AiAnalysisData,
        conversationState: ConversationState,
        userMessage: string = ''
    ): AiAnalysisData {
        let enforced = { ...analysisData };

        // 1. Merge với dữ liệu cũ nếu AI trả về analysis rỗng
        enforced = this.mergeWithPreviousAnalysis(enforced, conversationState);

        // 2. Enforce severity/priority chỉ tăng
        enforced = this.enforceSeverityMonotonicity(enforced, conversationState);

        // 3. Enforce specialty lock
        enforced = this.enforceSpecialtyLock(enforced, conversationState);

        // 4. Server-side red flag detection từ user message
        enforced = this.enforceRedFlagEscalation(enforced, userMessage, conversationState);

        // 5. Ensure symptoms accumulation (UNION, không replace)
        enforced = this.enforceSymptomAccumulation(enforced, conversationState);

        return enforced;
    }

    /**
     * Severity, priority, needs_doctor CHỈ ĐƯỢC TĂNG, không bao giờ giảm.
     * So sánh với giá trị cao nhất đã lưu trong conversation state.
     */
    private static enforceSeverityMonotonicity(
        analysisData: AiAnalysisData,
        state: ConversationState
    ): AiAnalysisData {
        const enforced = { ...analysisData };

        // Bảng thứ tự severity/priority — index càng cao càng nặng
        const SEVERITY_ORDER: Record<string, number> = {
            'Nhẹ': 1, 'nhẹ': 1, 'Mild': 1, 'mild': 1,
            'Vừa': 2, 'vừa': 2, 'Moderate': 2, 'moderate': 2,
            'Nặng': 3, 'nặng': 3, 'Severe': 3, 'severe': 3,
        };
        const PRIORITY_ORDER: Record<string, number> = {
            'NORMAL': 1, 'normal': 1,
            'SOON': 2, 'soon': 2,
            'URGENT': 3, 'urgent': 3,
        };

        // Lấy giá trị cao nhất từ state hiện tại
        const prevSeverity = state.last_severity || null;
        const prevPriority = state.last_priority || null;
        const prevNeedsDoctor = state.last_needs_doctor || false;

        // Enforce severity: chỉ tăng
        if (prevSeverity && enforced.severity) {
            const prevOrder = SEVERITY_ORDER[prevSeverity] || 0;
            const newOrder = SEVERITY_ORDER[enforced.severity] || 0;
            if (newOrder < prevOrder) {
                enforced.severity = prevSeverity;
            }
        } else if (prevSeverity && !enforced.severity) {
            enforced.severity = prevSeverity;
        }

        // Enforce priority: chỉ tăng
        if (prevPriority && enforced.priority) {
            const prevOrder = PRIORITY_ORDER[prevPriority] || 0;
            const newOrder = PRIORITY_ORDER[enforced.priority] || 0;
            if (newOrder < prevOrder) {
                enforced.priority = prevPriority;
            }
        } else if (prevPriority && !enforced.priority) {
            enforced.priority = prevPriority;
        }

        // Enforce needs_doctor: một khi true → không quay false
        if (prevNeedsDoctor && !enforced.needs_doctor) {
            enforced.needs_doctor = true;
        }

        return enforced;
    }

    /**
     * Nếu specialty đã bị lock trong state, KHÔNG cho AI đổi sang specialty khác.
     * Chỉ cho đổi nếu phát hiện red flag.
     */
    private static enforceSpecialtyLock(
        analysisData: AiAnalysisData,
        state: ConversationState
    ): AiAnalysisData {
        const enforced = { ...analysisData };

        if (
            state.locked_specialty_group &&
            enforced.suggested_specialty_code &&
            enforced.suggested_specialty_code !== state.locked_specialty_group
        ) {
            // Chỉ cho phép đổi khi có red flag
            const hasRedFlags = enforced.red_flags_detected && enforced.red_flags_detected.length > 0;
            if (!hasRedFlags) {
                enforced.suggested_specialty_code = state.locked_specialty_group;
                // Giữ tên specialty cũ nếu có trong state
                if (state.locked_specialty_name) {
                    enforced.suggested_specialty_name = state.locked_specialty_name;
                }
            }
        }

        return enforced;
    }

    /**
     * Nếu AI trả analysis rỗng (parse thất bại) → kế thừa dữ liệu từ state trước đó.
     * Tránh hiện tượng "reset về mặc định" giữa phiên.
     */
    private static mergeWithPreviousAnalysis(
        analysisData: AiAnalysisData,
        state: ConversationState
    ): AiAnalysisData {
        const enforced = { ...analysisData };

        // Nhận diện analysis rỗng: reasoning chứa text default và không có triệu chứng
        const isDefaultAnalysis =
            !enforced.severity &&
            !enforced.priority &&
            !enforced.suggested_specialty_code &&
            enforced.symptoms_collected.length === 0 &&
            enforced.reasoning?.includes('chưa đủ thông tin');

        if (isDefaultAnalysis && state.symptom_tracking) {
            // Khôi phục triệu chứng đã thu thập
            if (state.symptom_tracking.collected?.length) {
                enforced.symptoms_collected = [...state.symptom_tracking.collected];
            }
            // Khôi phục severity/priority/specialty từ state
            if (state.last_severity) enforced.severity = state.last_severity;
            if (state.last_priority) enforced.priority = state.last_priority;
            if (state.last_needs_doctor) enforced.needs_doctor = true;
            if (state.locked_specialty_group) {
                enforced.suggested_specialty_code = state.locked_specialty_group;
                enforced.suggested_specialty_name = state.locked_specialty_name || null;
            }
            enforced.reasoning = 'Tiếp tục thu thập thông tin từ phiên trước đó.';
        }

        return enforced;
    }

    /**
     * Quét user message + symptom history tìm từ khóa RED FLAG.
     * Nếu phát hiện → tự động escalate URGENT + needs_doctor.
     */
    private static enforceRedFlagEscalation(
        analysisData: AiAnalysisData,
        userMessage: string,
        state: ConversationState
    ): AiAnalysisData {
        const enforced = { ...analysisData };
        const msgLower = userMessage.toLowerCase();

        // Quét cả message hiện tại và triệu chứng đã thu thập
        const allText = [
            msgLower,
            ...(state.symptom_tracking?.collected || []).map(s => s.toLowerCase()),
            ...(enforced.symptoms_collected || []).map(s => s.toLowerCase()),
        ].join(' ');

        const detectedFlags: string[] = [];
        for (const keyword of RED_FLAG_KEYWORDS) {
            if (allText.includes(keyword.toLowerCase())) {
                detectedFlags.push(keyword);
            }
        }

        if (detectedFlags.length > 0) {
            enforced.priority = 'URGENT';
            enforced.needs_doctor = true;
            enforced.severity = 'Nặng';

            // Merge red flags (không trùng lặp)
            const existingFlags = new Set(enforced.red_flags_detected || []);
            detectedFlags.forEach(f => existingFlags.add(f));
            enforced.red_flags_detected = [...existingFlags];
        }

        return enforced;
    }

    /**
     * Đảm bảo symptoms_collected là UNION giữa AI response và state tracking.
     * Không bao giờ mất triệu chứng đã thu thập.
     */
    private static enforceSymptomAccumulation(
        analysisData: AiAnalysisData,
        state: ConversationState
    ): AiAnalysisData {
        const enforced = { ...analysisData };

        if (state.symptom_tracking?.collected?.length) {
            const combined = new Set([
                ...state.symptom_tracking.collected,
                ...enforced.symptoms_collected,
            ]);
            enforced.symptoms_collected = [...combined];
        }

        return enforced;
    }

    /**
     * Tạo text phản hồi khi AI trả về rỗng (JSON-only hoặc parse thất bại).
     */
    private static generateFallbackText(analysisData: AiAnalysisData): string {
        const parts: string[] = [];

        if (analysisData.symptoms_collected?.length) {
            parts.push(`Tôi đã ghi nhận các triệu chứng của bạn: ${analysisData.symptoms_collected.join(', ')}.`);
        }

        if (analysisData.preliminary_assessment) {
            parts.push(analysisData.preliminary_assessment);
        }

        if (analysisData.red_flags_detected?.length) {
            parts.push(`⚠️ Cảnh báo: Phát hiện dấu hiệu cần lưu ý: ${analysisData.red_flags_detected.join(', ')}. Bạn nên đi khám bác sĩ NGAY.`);
        }

        if (analysisData.suggested_specialty_name) {
            parts.push(`Tôi khuyên bạn nên khám chuyên khoa ${analysisData.suggested_specialty_name}.`);
        }

        if (parts.length === 0) {
            parts.push('Cảm ơn bạn đã chia sẻ. Tôi đang phân tích thông tin của bạn.');
        }

        parts.push('⚠️ AI chỉ hỗ trợ tư vấn ban đầu, không thay thế chẩn đoán của bác sĩ.');
        return parts.join(' ');
    }
    /**
     * Trả về analysis mặc định khi AI không trả JSON hợp lệ.
     */
    private static getDefaultAnalysis(): AiAnalysisData {
        return {
            is_complete: false,
            suggested_specialty_code: null,
            suggested_specialty_name: null,
            priority: null,
            symptoms_collected: [],
            should_suggest_booking: false,
            reasoning: 'Đang trong quá trình trao đổi, chưa đủ thông tin để phân tích.',
            severity: null,
            can_self_treat: false,
            preliminary_assessment: null,
            recommended_actions: [],
            red_flags_detected: [],
            needs_doctor: false,
            predicted_next_action: undefined,
            suggested_follow_up_questions: [],
            confidence_score: undefined,
        };
    }

    //  UTILITY METHODS

    /**
     * Convert lịch sử tin nhắn từ DB sang format Gemini SDK.
     */
    private static convertHistoryToGemini(
        messages: AiChatMessage[]
    ): Array<{ role: string; parts: Array<{ text: string }> }> {
        return messages
            .filter(m => m.role === AI_CHAT_ROLES.USER || m.role === AI_CHAT_ROLES.ASSISTANT)
            .map(m => ({
                role: m.role === AI_CHAT_ROLES.USER ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));
    }

    /**
     * Build object cập nhật cho session dựa trên analysis results + conversation state.
     */
    private static async buildSessionUpdates(
        analysisData: AiAnalysisData | null,
        newMessageCount: number,
        conversationState?: ConversationState
    ): Promise<Partial<AiChatSession>> {
        const updates: Partial<AiChatSession> = {
            message_count: newMessageCount,
        };

        if (analysisData) {
            if (analysisData.priority) {
                updates.suggested_priority = analysisData.priority;
            }
            if (analysisData.symptoms_collected && analysisData.symptoms_collected.length > 0) {
                updates.symptoms_summary = analysisData.symptoms_collected.join(', ');
            }
            if (analysisData.is_complete && analysisData.preliminary_assessment) {
                updates.ai_conclusion = analysisData.preliminary_assessment;
            }
        }

        // Lưu conversation state (State Machine + Symptom Tracking + Rolling Memory)
        if (conversationState) {
            updates.conversation_state = conversationState;
        }

        return updates;
    }

    /**
     * Tạo mã phiên dạng AIC-YYYYMMDD-XXXX.
     */
    private static generateSessionCode(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
        return `${AI_CHAT_CONFIG.SESSION_CODE_PREFIX}-${dateStr}-${randomPart}`;
    }

    /** Tạo short ID duy nhất cho message/session */
    private static shortId(): string {
        return randomUUID().replace(/-/g, '').slice(0, 16);
    }

    /**
     * Gọi RAG context an toàn — nếu lỗi thì trả empty string thay vì throw.
     * Hỗ trợ filter theo document categories.
     */
    private static async safeRetrieveContext(query: string, categories?: string[]): Promise<string> {
        try {
            return await AiRagService.retrieveContext(query, categories);
        } catch (error) {
            console.warn('⚠️ [AI Chat] Lỗi khi lấy RAG context, tiếp tục không có context:', error);
            return '';
        }
    }

    /**
     * Mapping intent/conversation state → document categories phù hợp để filter RAG search.
     * Trả về undefined nếu không cần filter (search tất cả).
     */
    private static mapIntentToCategories(conversationState: ConversationState): string[] | undefined {
        const { locked_specialty_group, phase } = conversationState;

        // Đang trong giai đoạn sàng lọc triệu chứng → ưu tiên tài liệu y khỏa
        if (locked_specialty_group || phase === 'DISCOVERY' || phase === 'ASSESSMENT') {
            return ['MEDICAL_INFO', 'FAQ'];
        }

        // Đang giai đoạn đề xuất → cần thêm lịch + giá
        if (phase === 'RECOMMENDATION') {
            return ['MEDICAL_INFO', 'SCHEDULE', 'PRICING'];
        }

        // Mặc định (GREETING, FOLLOW_UP) → tìm tất cả
        return undefined;
    }
}
