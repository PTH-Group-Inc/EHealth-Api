import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { AiHealthChatRepository } from '../../repository/AI Health/ai-health-chat.repository';
import { AI_HEALTH_TOOLS, AIToolsService } from './ai-tools.service';
import { AI_CONFIG, AI_ERRORS } from '../../constants/AI Health/ai-health-chat.constant';
import {
    AiChatSession, AiChatMessage, AiAnalysisData, ConversationState,
    SessionListFilters, SessionMessageResponse, DEFAULT_CONVERSATION_STATE,
} from '../../models/AI Health/ai-health-chat.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import logger from '../../config/logger.config';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System Prompt ─────────────────────────────────────────────────────

function buildSystemPrompt(patientContext?: Record<string, unknown>): string {
    const contextSection = patientContext
        ? `\n\n[THÔNG TIN BỆNH NHÂN TỪ HỒ SƠ]
${JSON.stringify(patientContext, null, 2)}
[KẾT THÚC THÔNG TIN BỆNH NHÂN]
Sử dụng thông tin trên để cá nhân hóa tư vấn (chú ý dị ứng, bệnh mãn tính, thuốc đang dùng).`
        : '';

    return `Bạn là Trợ lý Sức khỏe AI của phòng khám, hỗ trợ tư vấn sức khỏe ban đầu cho bệnh nhân bằng tiếng Việt.

## NHIỆM VỤ
Lắng nghe triệu chứng → đặt câu hỏi làm rõ → gợi ý chuyên khoa phù hợp → hỗ trợ đặt lịch khám.

## LUẬT BẮT BUỘC
1. Trả lời HOÀN TOÀN bằng tiếng Việt, ngắn gọn, thân thiện, dễ hiểu với người không chuyên y
2. LUÔN kết thúc câu trả lời có gợi ý y tế bằng: "⚕️ Đây là tư vấn ban đầu, không thay thế chẩn đoán của bác sĩ."
3. KHÔNG chẩn đoán bệnh cụ thể — chỉ gợi ý chuyên khoa và mức độ ưu tiên
4. KHẨN CẤP (đau ngực, khó thở, liệt nửa người, nói ngọng, chảy máu nhiều, sốt >40°C): khuyên GỌI 115 HOẶC ĐẾN CẤP CỨU NGAY — không tập trung vào đặt lịch
5. Hỏi tối đa 4-5 câu làm rõ trước khi đưa ra gợi ý chuyên khoa
6. Nếu biết patient_id: gọi get_patient_context để cá nhân hóa tư vấn

## QUY TRÌNH TƯ VẤN
GREETING → COLLECTING (3-5 câu hỏi) → ANALYSIS (gợi ý chuyên khoa + mức ưu tiên) → BOOKING_SUGGEST (nếu BN muốn)

## MỨC ĐỘ ƯU TIÊN
- 🔴 KHẨN (URGENT): cấp cứu ngay — đau ngực/khó thở/co giật/xuất huyết nặng
- 🟡 SỚM (SOON): khám trong 24-48h — sốt cao, đau dữ dội, triệu chứng không cải thiện
- 🟢 BÌNH THƯỜNG (NORMAL): đặt lịch thông thường — triệu chứng nhẹ, mãn tính ổn định

## PHÂN TÍCH JSON (THÊM VÀO CUỐI MỖI PHẢN HỒI — KHÔNG HIỂN THỊ CHO BN)
Sau phần trả lời, thêm khối JSON với định dạng chính xác sau (không thêm text sau khối này):

---AI_ANALYSIS_START---
{"is_complete":false,"follow_up_questions":[],"suggested_specialty_code":null,"suggested_specialty_name":null,"priority":null,"symptoms_collected":[],"should_suggest_booking":false,"conclusion":null}
---AI_ANALYSIS_END---${contextSection}`;
}

// ── Helper: parse analysis JSON từ Claude response ────────────────────

function parseAnalysis(rawText: string): { cleanText: string; analysis: AiAnalysisData | null } {
    const startMarker = '---AI_ANALYSIS_START---';
    const endMarker = '---AI_ANALYSIS_END---';
    const startIdx = rawText.indexOf(startMarker);
    const endIdx = rawText.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1) {
        return { cleanText: rawText.trim(), analysis: null };
    }

    const cleanText = rawText.slice(0, startIdx).trim();
    const jsonStr = rawText.slice(startIdx + startMarker.length, endIdx).trim();

    try {
        const analysis = JSON.parse(jsonStr) as AiAnalysisData;
        return { cleanText, analysis };
    } catch {
        logger.warn('[AI] Failed to parse analysis JSON block');
        return { cleanText, analysis: null };
    }
}

// ── Service ───────────────────────────────────────────────────────────

export class AiHealthChatService {

    // ── Sessions ──────────────────────────────────────────────────────

    static async createSession(input: {
        message: string;
        user_id?: string;
        patient_id?: string;
    }): Promise<SessionMessageResponse> {
        const session = await AiHealthChatRepository.createSession({
            user_id: input.user_id,
            patient_id: input.patient_id,
        });

        const result = await AiHealthChatService.processMessage({
            session,
            userMessage: input.message,
            patientId: input.patient_id,
        });

        return result;
    }

    static async listSessions(filters: SessionListFilters): Promise<{ data: AiChatSession[]; total: number; page: number; limit: number }> {
        const { data, total } = await AiHealthChatRepository.findSessionsByUser(filters);
        return { data, total, page: filters.page, limit: filters.limit };
    }

    static async getSession(sessionId: string, userId?: string): Promise<{ session: AiChatSession; messages: AiChatMessage[] }> {
        const session = await AiHealthChatRepository.findSessionById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, AI_ERRORS.SESSION_NOT_FOUND.code, AI_ERRORS.SESSION_NOT_FOUND.message);

        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Không có quyền truy cập phiên này.');
        }

        const messages = await AiHealthChatRepository.getSessionMessages(sessionId);
        return { session, messages };
    }

    static async completeSession(sessionId: string, userId?: string): Promise<AiChatSession> {
        const session = await AiHealthChatRepository.findSessionById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, AI_ERRORS.SESSION_NOT_FOUND.code, AI_ERRORS.SESSION_NOT_FOUND.message);

        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Không có quyền truy cập phiên này.');
        }

        return AiHealthChatRepository.updateSession(sessionId, {
            status: 'COMPLETED',
            completed_at: new Date(),
        });
    }

    static async deleteSession(sessionId: string, userId?: string): Promise<void> {
        const session = await AiHealthChatRepository.findSessionById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, AI_ERRORS.SESSION_NOT_FOUND.code, AI_ERRORS.SESSION_NOT_FOUND.message);

        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Không có quyền truy cập phiên này.');
        }

        await AiHealthChatRepository.deleteSession(sessionId);
    }

    // ── Messages ──────────────────────────────────────────────────────

    static async sendMessage(input: {
        session_id: string;
        message: string;
        user_id?: string;
        patient_id?: string;
    }): Promise<SessionMessageResponse> {
        const session = await AiHealthChatRepository.findSessionById(input.session_id);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, AI_ERRORS.SESSION_NOT_FOUND.code, AI_ERRORS.SESSION_NOT_FOUND.message);

        if (session.status !== 'ACTIVE') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, AI_ERRORS.SESSION_EXPIRED.code, AI_ERRORS.SESSION_EXPIRED.message);
        }

        if (session.message_count >= AI_CONFIG.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, AI_ERRORS.SESSION_LIMIT.code, AI_ERRORS.SESSION_LIMIT.message);
        }

        if (input.user_id && session.user_id && session.user_id !== input.user_id) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Không có quyền truy cập phiên này.');
        }

        return AiHealthChatService.processMessage({
            session,
            userMessage: input.message,
            patientId: input.patient_id ?? session.patient_id ?? undefined,
        });
    }

    static async streamMessage(input: {
        session_id: string;
        message: string;
        user_id?: string;
        patient_id?: string;
        res: Response;
    }): Promise<void> {
        const { res } = input;
        const session = await AiHealthChatRepository.findSessionById(input.session_id);
        if (!session) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: AI_ERRORS.SESSION_NOT_FOUND.message })}\n\n`);
            res.end();
            return;
        }

        if (session.status !== 'ACTIVE') {
            res.write(`data: ${JSON.stringify({ type: 'error', message: AI_ERRORS.SESSION_EXPIRED.message })}\n\n`);
            res.end();
            return;
        }

        const startTime = Date.now();
        const patientId = input.patient_id ?? session.patient_id ?? undefined;
        const systemPrompt = await AiHealthChatService.buildPromptWithContext(patientId);
        const history = await AiHealthChatRepository.getSessionMessages(input.session_id);

        // Save user message
        await AiHealthChatRepository.addMessage({ session_id: input.session_id, role: 'USER', content: input.message });
        await AiHealthChatRepository.incrementMessageCount(input.session_id);

        const claudeMessages = AiHealthChatService.toClaudeMessages(history, input.message);

        try {
            let fullText = '';
            let totalInputTokens = 0;
            let totalOutputTokens = 0;

            const stream = await anthropic.messages.stream({
                model: AI_CONFIG.MODEL,
                max_tokens: AI_CONFIG.MAX_TOKENS,
                system: systemPrompt,
                tools: AI_HEALTH_TOOLS,
                messages: claudeMessages,
            });

            for await (const event of stream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    const chunk = event.delta.text;
                    // Only stream the clean text portion (before analysis block)
                    const analysisMarker = '---AI_ANALYSIS_START---';
                    if (!fullText.includes(analysisMarker)) {
                        const combined = fullText + chunk;
                        if (combined.includes(analysisMarker)) {
                            // Partial: send only the part before the marker
                            const toSend = combined.split(analysisMarker)[0].slice(fullText.length);
                            if (toSend) res.write(`data: ${JSON.stringify({ type: 'chunk', content: toSend })}\n\n`);
                        } else {
                            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
                        }
                    }
                    fullText += chunk;
                }

                if (event.type === 'message_delta') {
                    totalOutputTokens += event.usage?.output_tokens ?? 0;
                }

                if (event.type === 'message_start') {
                    totalInputTokens += event.message.usage?.input_tokens ?? 0;
                }
            }

            const finalMessage = await stream.finalMessage();

            // Handle tool use in stream (simplified: execute tools and get final text)
            if (finalMessage.stop_reason === 'tool_use') {
                const toolResult = await AiHealthChatService.handleToolUse(finalMessage, systemPrompt, claudeMessages);
                fullText = toolResult.text;
                totalInputTokens += toolResult.tokens;
            }

            const { cleanText, analysis } = parseAnalysis(fullText);
            const responseMs = Date.now() - startTime;
            const totalTokens = totalInputTokens + totalOutputTokens;

            const assistantMsg = await AiHealthChatRepository.addMessage({
                session_id: input.session_id,
                role: 'ASSISTANT',
                content: cleanText,
                model_used: AI_CONFIG.MODEL,
                tokens_used: totalTokens,
                response_time_ms: responseMs,
                analysis_data: analysis,
            });
            await AiHealthChatRepository.incrementMessageCount(input.session_id);

            const updatedSession = await AiHealthChatService.applyAnalysisToSession(input.session_id, analysis);

            res.write(`data: ${JSON.stringify({ type: 'analysis', data: analysis })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'done', session: updatedSession, assistant_message_id: assistantMsg.message_id })}\n\n`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
            logger.error('[AI Stream]', err);
            res.write(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`);
        } finally {
            res.end();
        }
    }

    static async submitFeedback(messageId: string, sessionId: string, feedback: 'GOOD' | 'BAD', note?: string): Promise<void> {
        await AiHealthChatRepository.submitFeedback(messageId, feedback, note);
    }

    // ── Core processing (non-streaming) ───────────────────────────────

    private static async processMessage(params: {
        session: AiChatSession;
        userMessage: string;
        patientId?: string;
    }): Promise<SessionMessageResponse> {
        const { session, userMessage, patientId } = params;
        const startTime = Date.now();

        // Save user message
        await AiHealthChatRepository.addMessage({ session_id: session.session_id, role: 'USER', content: userMessage });
        await AiHealthChatRepository.incrementMessageCount(session.session_id);

        // Build conversation history for Claude
        const history = await AiHealthChatRepository.getSessionMessages(session.session_id);
        const systemPrompt = await AiHealthChatService.buildPromptWithContext(patientId);
        const claudeMessages = AiHealthChatService.toClaudeMessages(history.slice(0, -1), userMessage);

        // Agentic loop
        const { text, tokens } = await AiHealthChatService.runAgentLoop(systemPrompt, claudeMessages);
        const responseMs = Date.now() - startTime;

        const { cleanText, analysis } = parseAnalysis(text);

        const assistantMsg = await AiHealthChatRepository.addMessage({
            session_id: session.session_id,
            role: 'ASSISTANT',
            content: cleanText,
            model_used: AI_CONFIG.MODEL,
            tokens_used: tokens,
            response_time_ms: responseMs,
            analysis_data: analysis,
        });
        await AiHealthChatRepository.incrementMessageCount(session.session_id);

        const updatedSession = await AiHealthChatService.applyAnalysisToSession(session.session_id, analysis);

        return {
            session: updatedSession,
            ai_reply: cleanText,
            analysis,
            assistant_message_id: assistantMsg.message_id,
        };
    }

    private static async runAgentLoop(
        systemPrompt: string,
        messages: Anthropic.MessageParam[]
    ): Promise<{ text: string; tokens: number }> {
        let totalTokens = 0;
        let iteration = 0;

        while (iteration < AI_CONFIG.MAX_TOOL_ITERATIONS) {
            iteration++;

            const response = await anthropic.messages.create({
                model: AI_CONFIG.MODEL,
                max_tokens: AI_CONFIG.MAX_TOKENS,
                system: systemPrompt,
                tools: AI_HEALTH_TOOLS,
                messages,
            });

            totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

            if (response.stop_reason === 'end_turn') {
                const text = response.content
                    .filter(b => b.type === 'text')
                    .map(b => (b as Anthropic.TextBlock).text)
                    .join('\n');
                return { text, tokens: totalTokens };
            }

            if (response.stop_reason === 'tool_use') {
                const toolBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
                messages.push({ role: 'assistant', content: response.content });

                const toolResults = await Promise.all(
                    toolBlocks.map(async (tb) => {
                        const { result, error } = await AIToolsService.executeToolCall(
                            tb.name, tb.input as Record<string, unknown>
                        );
                        return {
                            type: 'tool_result' as const,
                            tool_use_id: tb.id,
                            content: error ? `Lỗi: ${error}` : JSON.stringify(result, null, 2),
                        };
                    })
                );

                messages.push({ role: 'user', content: toolResults });
                continue;
            }

            break;
        }

        return { text: 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.', tokens: totalTokens };
    }

    private static async handleToolUse(
        finalMessage: Anthropic.Message,
        systemPrompt: string,
        originalMessages: Anthropic.MessageParam[]
    ): Promise<{ text: string; tokens: number }> {
        const msgs = [...originalMessages, { role: 'assistant' as const, content: finalMessage.content }];
        const toolBlocks = finalMessage.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];

        const toolResults = await Promise.all(
            toolBlocks.map(async (tb) => {
                const { result, error } = await AIToolsService.executeToolCall(tb.name, tb.input as Record<string, unknown>);
                return {
                    type: 'tool_result' as const,
                    tool_use_id: tb.id,
                    content: error ? `Lỗi: ${error}` : JSON.stringify(result, null, 2),
                };
            })
        );

        msgs.push({ role: 'user', content: toolResults });
        return AiHealthChatService.runAgentLoop(systemPrompt, msgs);
    }

    private static async buildPromptWithContext(patientId?: string): Promise<string> {
        let context: Record<string, unknown> | undefined;
        if (patientId) {
            try {
                context = await AiHealthChatRepository.getPatientContext(patientId);
            } catch { /* Patient context fetch failed — continue without it */ }
        }
        return buildSystemPrompt(context);
    }

    private static toClaudeMessages(
        history: AiChatMessage[],
        newUserMessage?: string
    ): Anthropic.MessageParam[] {
        const msgs: Anthropic.MessageParam[] = history.map(m => ({
            role: m.role === 'USER' ? 'user' : 'assistant',
            content: m.content,
        }));

        if (newUserMessage) {
            msgs.push({ role: 'user', content: newUserMessage });
        }

        return msgs;
    }

    private static async applyAnalysisToSession(
        sessionId: string,
        analysis: AiAnalysisData | null
    ): Promise<AiChatSession> {
        if (!analysis) {
            return (await AiHealthChatRepository.findSessionById(sessionId))!;
        }

        const updates: Parameters<typeof AiHealthChatRepository.updateSession>[1] = {};

        if (analysis.is_complete) {
            if (analysis.suggested_specialty_name) updates.suggested_specialty_name = analysis.suggested_specialty_name;
            if (analysis.priority) updates.suggested_priority = analysis.priority;
            if (analysis.conclusion) updates.ai_conclusion = analysis.conclusion;
            if (analysis.symptoms_collected.length > 0) updates.symptoms_summary = analysis.symptoms_collected.join(', ');
        }

        // Update conversation state
        const stateUpdate: Partial<ConversationState> = {};
        if (analysis.is_complete) stateUpdate.phase = analysis.should_suggest_booking ? 'BOOKING_SUGGEST' : 'DONE';
        if (analysis.symptoms_collected.length > 0) stateUpdate.symptoms_collected = analysis.symptoms_collected;

        if (Object.keys(stateUpdate).length > 0) {
            await AiHealthChatRepository.updateConversationState(sessionId, stateUpdate);
        }

        if (Object.keys(updates).length > 0) {
            return AiHealthChatRepository.updateSession(sessionId, updates);
        }

        return (await AiHealthChatRepository.findSessionById(sessionId))!;
    }
}
