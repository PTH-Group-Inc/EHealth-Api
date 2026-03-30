import { pool } from '../../config/postgresdb';
import {
    AiChatSession,
    AiChatMessage,
    SpecialtyForPrompt,
    ConversationState,
    AiTokenUsageDaily,
    AiTokenUsageSummary,
} from '../../models/AI/ai-health-chat.model';
import { AI_CHAT_STATUS, AI_CONVERSATION_PHASES } from '../../constants/ai-health-chat.constant';


export class AiHealthChatRepository {

    /**
     * Tạo phiên chat AI mới.
     * Ghi nhận thông tin ban đầu: mã phiên, user_id, trạng thái ACTIVE.
     */
    static async createSession(session: Partial<AiChatSession>): Promise<AiChatSession> {
        /** Khởi tạo conversation_state mặc định nếu chưa có */
        const defaultState: ConversationState = {
            phase: AI_CONVERSATION_PHASES.GREETING,
            locked_specialty_group: null,
            locked_specialty_name: null,
            symptoms_collected: [],
            symptoms_excluded: [],
            questions_asked: 0,
            discovery_complete: false,
            conversation_summary: null,
            last_severity: null,
            last_priority: null,
            last_needs_doctor: false,
            symptom_tracking: null,
        };

        const query = `
            INSERT INTO ai_chat_sessions 
                (session_id, session_code, patient_id, user_id, status, message_count, conversation_state)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            session.session_id,
            session.session_code,
            session.patient_id || null,
            session.user_id || null,
            session.status || AI_CHAT_STATUS.ACTIVE,
            session.message_count || 0,
            JSON.stringify(session.conversation_state || defaultState),
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /** Lấy phiên chat theo ID */
    static async getSessionById(sessionId: string): Promise<AiChatSession | null> {
        const query = `SELECT * FROM ai_chat_sessions WHERE session_id = $1`;
        const result = await pool.query(query, [sessionId]);
        return result.rows[0] ?? null;
    }

    /** Lấy phiên chat theo session_code (dùng cho tra cứu bằng mã phiên) */
    static async getSessionByCode(sessionCode: string): Promise<AiChatSession | null> {
        const query = `SELECT * FROM ai_chat_sessions WHERE session_code = $1`;
        const result = await pool.query(query, [sessionCode]);
        return result.rows[0] ?? null;
    }

    /**
     * Cập nhật phiên chat — chỉ cập nhật các trường được truyền vào.
     * Dùng dynamic query builder để tránh overwrite trường không liên quan.
     */
    static async updateSession(
        sessionId: string,
        updates: Partial<AiChatSession>
    ): Promise<AiChatSession | null> {
        const allowedFields = [
            'suggested_specialty_id', 'suggested_specialty_name', 'suggested_priority',
            'symptoms_summary', 'ai_conclusion', 'status', 'message_count',
            'appointment_id', 'completed_at', 'updated_at', 'conversation_state',
        ];
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if ((updates as any)[field] !== undefined) {
                fields.push(`${field} = $${paramIndex}`);
                /**
                 * conversation_state là JSONB → cần serialize trước khi gửi query.
                 */
                const value = field === 'conversation_state'
                    ? JSON.stringify((updates as any)[field])
                    : (updates as any)[field];
                values.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) return null;

        // Luôn cập nhật updated_at nếu chưa có trong danh sách
        if (!fields.some(f => f.startsWith('updated_at'))) {
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
        }

        values.push(sessionId);
        const query = `
            UPDATE ai_chat_sessions 
            SET ${fields.join(', ')}
            WHERE session_id = $${paramIndex}
            RETURNING *
        `;
        const result = await pool.query(query, values);
        return result.rows[0] ?? null;
    }

    /**
     * Danh sách phiên chat của user — phân trang, sắp xếp mới nhất trước.
     * Hỗ trợ lọc theo trạng thái (ACTIVE, COMPLETED, EXPIRED).
     * Phiên DELETED luôn bị ẩn khỏi danh sách.
     */
    static async getSessionsByUser(
        userId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<[AiChatSession[], number]> {
        const offset = (page - 1) * limit;
        const params: any[] = [userId];
        let whereClause = `WHERE user_id = $1 AND status != '${AI_CHAT_STATUS.DELETED}'`;

        if (status) {
            params.push(status);
            whereClause += ` AND status = $${params.length}`;
        }

        const countQuery = `SELECT COUNT(*) as total FROM ai_chat_sessions ${whereClause}`;
        const dataQuery = `
            SELECT * FROM ai_chat_sessions 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, params),
            pool.query(dataQuery, [...params, limit, offset]),
        ]);

        return [dataResult.rows, parseInt(countResult.rows[0].total, 10)];
    }

    /**
     * Đếm số phiên ACTIVE đồng thời của user.
     * Dùng để kiểm tra giới hạn trước khi tạo phiên mới.
     */
    static async countActiveSessionsByUser(userId: string): Promise<number> {
        const query = `
            SELECT COUNT(*) as total 
            FROM ai_chat_sessions 
            WHERE user_id = $1 AND status = $2
        `;
        const result = await pool.query(query, [userId, AI_CHAT_STATUS.ACTIVE]);
        return parseInt(result.rows[0].total, 10);
    }


    /**
     * Thêm tin nhắn mới vào phiên.
     * Lưu cả metadata AI: model_used, tokens_used, response_time_ms, analysis_data.
     */
    static async addMessage(message: Partial<AiChatMessage>): Promise<AiChatMessage> {
        const query = `
            INSERT INTO ai_chat_messages 
                (message_id, session_id, role, content, model_used, tokens_used, response_time_ms, analysis_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            message.message_id,
            message.session_id,
            message.role,
            message.content,
            message.model_used || null,
            message.tokens_used || 0,
            message.response_time_ms || 0,
            message.analysis_data ? JSON.stringify(message.analysis_data) : null,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy toàn bộ tin nhắn trong phiên — sắp xếp theo thời gian ASC.
     * Dùng để build conversation history gửi cho Gemini.
     */
    static async getMessagesBySession(sessionId: string): Promise<AiChatMessage[]> {
        const query = `
            SELECT * FROM ai_chat_messages 
            WHERE session_id = $1 
            ORDER BY created_at ASC
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows;
    }

    /**
     * Lấy N tin nhắn gần nhất trong phiên — dùng cho Rolling Memory.
     * Khi phiên dài (>6 tin), thay vì gửi toàn bộ history cho AI,
     * chỉ gửi summary + N tin gần nhất để tiết kiệm tokens.
     */
    static async getRecentMessages(sessionId: string, limit: number): Promise<AiChatMessage[]> {
        const query = `
            SELECT * FROM (
                SELECT * FROM ai_chat_messages
                WHERE session_id = $1
                ORDER BY created_at DESC
                LIMIT $2
            ) sub
            ORDER BY created_at ASC
        `;
        const result = await pool.query(query, [sessionId, limit]);
        return result.rows;
    }


    /**
     * Lấy danh sách chuyên khoa đang hoạt động (chưa bị xóa mềm).
     * Dùng để inject vào system prompt cho Gemini biết phòng khám có chuyên khoa nào.
     */
    static async getActiveSpecialties(): Promise<SpecialtyForPrompt[]> {
        const query = `
            SELECT specialties_id, code, name, description
            FROM specialties
            WHERE deleted_at IS NULL
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Tìm chuyên khoa theo code — dùng khi AI gợi ý specialty_code để map về specialty_id.
     * Ví dụ: AI trả "TIEU_HOA" → Repository tìm trong bảng specialties → trả về specialties_id.
     */
    static async findSpecialtyByCode(code: string): Promise<SpecialtyForPrompt | null> {
        const query = `
            SELECT specialties_id, code, name, description
            FROM specialties
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows[0] ?? null;
    }

    /**
     * Lấy tin nhắn theo ID — dùng khi submit feedback để validate tin nhắn tồn tại.
     */
    static async getMessageById(messageId: string): Promise<AiChatMessage | null> {
        const query = `SELECT * FROM ai_chat_messages WHERE message_id = $1`;
        const result = await pool.query(query, [messageId]);
        return result.rows[0] ?? null;
    }

    /**
     * Cập nhật đánh giá feedback cho tin nhắn AI.
     */
    static async updateMessageFeedback(
        messageId: string,
        feedback: string,
        note: string | null
    ): Promise<AiChatMessage | null> {
        const query = `
            UPDATE ai_chat_messages
            SET user_feedback = $1, feedback_note = $2
            WHERE message_id = $3
            RETURNING *
        `;
        const result = await pool.query(query, [feedback, note, messageId]);
        return result.rows[0] ?? null;
    }

    /**
     * Lấy danh sách feedback notes gần đây theo loại (GOOD/BAD).
     */
    static async getRecentFeedbackNotes(
        feedbackType: string,
        limit: number,
        lookbackDays: number
    ): Promise<{ feedback_note: string }[]> {
        const query = `
            SELECT DISTINCT feedback_note
            FROM ai_chat_messages
            WHERE user_feedback = $1
              AND feedback_note IS NOT NULL
              AND feedback_note != ''
              AND created_at > NOW() - INTERVAL '1 day' * $3
            ORDER BY feedback_note
            LIMIT $2
        `;
        const result = await pool.query(query, [feedbackType, limit, lookbackDays]);
        return result.rows;
    }

    /**
     * Lấy nội dung tin nhắn ASSISTANT được đánh giá GOOD (truncated).
     * Dùng làm sample để AI học theo phong cách phản hồi hiệu quả.
     */
    static async getGoodRatedMessageSamples(
        limit: number,
        lookbackDays: number,
        truncateLength: number
    ): Promise<{ content: string }[]> {
        const query = `
            SELECT LEFT(content, $3) AS content
            FROM ai_chat_messages
            WHERE user_feedback = 'GOOD'
              AND role = 'ASSISTANT'
              AND created_at > NOW() - INTERVAL '1 day' * $2
            ORDER BY created_at DESC
            LIMIT $1
        `;
        const result = await pool.query(query, [limit, lookbackDays, truncateLength]);
        return result.rows;
    }

    /**
     * Lấy thống kê token usage theo ngày (từ VIEW ai_token_usage_daily).
     */
    static async getTokenUsageDaily(
        startDate: string,
        endDate: string
    ): Promise<AiTokenUsageDaily[]> {
        const query = `
            SELECT usage_date, model_used, total_messages, total_tokens, avg_response_ms
            FROM ai_token_usage_daily
            WHERE usage_date >= $1 AND usage_date <= $2
            ORDER BY usage_date DESC, model_used
        `;
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows;
    }

    /**
     * Lấy tổng hợp thống kê: tổng messages, tokens, sessions, feedback.
     */
    static async getTokenUsageSummary(
        startDate: string,
        endDate: string
    ): Promise<AiTokenUsageSummary> {
        const query = `
            SELECT
                COALESCE(SUM(CASE WHEN role = 'ASSISTANT' THEN 1 ELSE 0 END), 0)::INTEGER AS total_messages,
                COALESCE(SUM(CASE WHEN role = 'ASSISTANT' THEN tokens_used ELSE 0 END), 0)::INTEGER AS total_tokens,
                COALESCE(AVG(CASE WHEN role = 'ASSISTANT' THEN response_time_ms END), 0)::INTEGER AS avg_response_ms,
                COALESCE(SUM(CASE WHEN role = 'ASSISTANT' AND user_feedback = 'GOOD' THEN 1 ELSE 0 END), 0)::INTEGER AS good_count,
                COALESCE(SUM(CASE WHEN role = 'ASSISTANT' AND user_feedback = 'BAD' THEN 1 ELSE 0 END), 0)::INTEGER AS bad_count,
                COALESCE(SUM(CASE WHEN role = 'ASSISTANT' AND user_feedback IS NULL THEN 1 ELSE 0 END), 0)::INTEGER AS no_feedback_count
            FROM ai_chat_messages
            WHERE created_at >= $1::DATE AND created_at < ($2::DATE + INTERVAL '1 day')
        `;
        const msgResult = await pool.query(query, [startDate, endDate]);
        const msg = msgResult.rows[0];

        const sessionQuery = `
            SELECT COUNT(*)::INTEGER AS total_sessions
            FROM ai_chat_sessions
            WHERE created_at >= $1::DATE AND created_at < ($2::DATE + INTERVAL '1 day')
        `;
        const sessionResult = await pool.query(sessionQuery, [startDate, endDate]);

        return {
            total_messages: msg.total_messages,
            total_tokens: msg.total_tokens,
            avg_response_ms: msg.avg_response_ms,
            total_sessions: sessionResult.rows[0]?.total_sessions || 0,
            feedback_stats: {
                good: msg.good_count,
                bad: msg.bad_count,
                no_feedback: msg.no_feedback_count,
            },
        };
    }
    /**
     * Expire các phiên ACTIVE đã inactive quá thời gian quy định.
     * Dùng bởi cron job để giải phóng slot cho user.
     */
    static async expireInactiveSessions(inactiveHours: number): Promise<number> {
        const query = `
            UPDATE ai_chat_sessions
            SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'ACTIVE'
              AND updated_at < NOW() - INTERVAL '1 hour' * $1
            RETURNING session_id
        `;
        const result = await pool.query(query, [inactiveHours]);
        return result.rowCount || 0;
    }

    /**
     * Đếm tổng tin nhắn USER đã gửi trong khoảng thời gian (cross-session).
     * Dùng để kiểm tra user quota trước khi cho phép gửi tin mới.
     */
    static async countUserMessagesInWindow(userId: string, windowHours: number): Promise<number> {
        const query = `
            SELECT COUNT(*) AS total
            FROM ai_chat_messages m
            JOIN ai_chat_sessions s ON m.session_id = s.session_id
            WHERE s.user_id = $1
              AND m.role = 'USER'
              AND m.created_at > NOW() - INTERVAL '1 hour' * $2
        `;
        const result = await pool.query(query, [userId, windowHours]);
        return parseInt(result.rows[0].total, 10);
    }
}

