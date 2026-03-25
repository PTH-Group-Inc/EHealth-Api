import { pool } from '../../config/postgresdb';
import {
    AiChatSession,
    AiChatMessage,
    AiAnalysisData,
    SpecialtyForPrompt,
} from '../../models/AI/ai-health-chat.model';

/**
 * Repository cho module AI Tư Vấn Sức Khỏe.
 * Chịu trách nhiệm toàn bộ thao tác DB: sessions, messages, specialties lookup.
 */
export class AiHealthChatRepository {

    /** Tạo phiên chat AI mới */
    static async createSession(session: Partial<AiChatSession>): Promise<AiChatSession> {
        const query = `
            INSERT INTO ai_chat_sessions 
                (session_id, session_code, patient_id, user_id, status, message_count)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [
            session.session_id,
            session.session_code,
            session.patient_id || null,
            session.user_id || null,
            session.status || 'ACTIVE',
            session.message_count || 0,
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

    /** Lấy phiên chat theo session_code */
    static async getSessionByCode(sessionCode: string): Promise<AiChatSession | null> {
        const query = `SELECT * FROM ai_chat_sessions WHERE session_code = $1`;
        const result = await pool.query(query, [sessionCode]);
        return result.rows[0] ?? null;
    }

    /**
     * Cập nhật phiên chat (kết quả phân tích, trạng thái, ...).
     * Chỉ cập nhật các trường được truyền vào.
     */
    static async updateSession(
        sessionId: string,
        updates: Partial<AiChatSession>
    ): Promise<AiChatSession | null> {
        const allowedFields = [
            'suggested_specialty_id', 'suggested_specialty_name', 'suggested_priority',
            'symptoms_summary', 'ai_conclusion', 'status', 'message_count',
            'appointment_id', 'completed_at', 'updated_at',
        ];
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if ((updates as any)[field] !== undefined) {
                fields.push(`${field} = $${paramIndex}`);
                values.push((updates as any)[field]);
                paramIndex++;
            }
        }

        if (fields.length === 0) return null;

        // Luôn cập nhật updated_at
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
     * Danh sách phiên chat của user, phân trang, sắp xếp mới nhất trước.
     */
    static async getSessionsByUser(
        userId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<[AiChatSession[], number]> {
        const offset = (page - 1) * limit;
        const params: any[] = [userId];
        let whereClause = 'WHERE user_id = $1';

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
     * Đếm số phiên ACTIVE của user.
     */
    static async countActiveSessionsByUser(userId: string): Promise<number> {
        const query = `
            SELECT COUNT(*) as total 
            FROM ai_chat_sessions 
            WHERE user_id = $1 AND status = 'ACTIVE'
        `;
        const result = await pool.query(query, [userId]);
        return parseInt(result.rows[0].total, 10);
    }


    /** Thêm tin nhắn mới vào phiên */
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
     * Lấy toàn bộ tin nhắn trong phiên, sắp xếp theo thời gian ASC.
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
     * Tìm chuyên khoa theo code (dùng khi AI gợi ý specialty_code để map về specialty_id).
     * Liên kết với Module 2 (Facility Management) — bảng specialties.
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
}
