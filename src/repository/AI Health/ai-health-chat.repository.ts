import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    AiChatSession, AiChatMessage, AiAnalysisData,
    ConversationState, SessionListFilters,
} from '../../models/AI Health/ai-health-chat.model';

// ── ID Generators ─────────────────────────────────────────────────────

function genSessionId(): string {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    return `AIC_${ymd}_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
}

function genSessionCode(): string {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AIC-${ymd}-${rand}`;
}

function genMessageId(): string {
    return `AIM_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
}

// ── Repository ────────────────────────────────────────────────────────

export class AiHealthChatRepository {

    // ── Sessions ──────────────────────────────────────────────────────

    static async createSession(params: {
        user_id?: string;
        patient_id?: string;
    }): Promise<AiChatSession> {
        const sessionId = genSessionId();
        const sessionCode = genSessionCode();

        const r = await pool.query<AiChatSession>(
            `INSERT INTO ai_chat_sessions (session_id, session_code, user_id, patient_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [sessionId, sessionCode, params.user_id ?? null, params.patient_id ?? null]
        );
        return r.rows[0];
    }

    static async findSessionById(sessionId: string): Promise<AiChatSession | null> {
        const r = await pool.query<AiChatSession>(
            `SELECT * FROM ai_chat_sessions WHERE session_id = $1`,
            [sessionId]
        );
        return r.rows[0] ?? null;
    }

    static async findSessionsByUser(filters: SessionListFilters): Promise<{ data: AiChatSession[]; total: number }> {
        const conditions: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        if (filters.user_id) { conditions.push(`user_id = $${idx++}`); params.push(filters.user_id); }
        if (filters.patient_id) { conditions.push(`patient_id = $${idx++}`); params.push(filters.patient_id); }
        if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = filters.limit;
        const offset = (filters.page - 1) * limit;

        const [dataRes, countRes] = await Promise.all([
            pool.query<AiChatSession>(
                `SELECT * FROM ai_chat_sessions ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
                [...params, limit, offset]
            ),
            pool.query<{ count: string }>(
                `SELECT COUNT(*) FROM ai_chat_sessions ${where}`,
                params
            ),
        ]);

        return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
    }

    static async updateSession(sessionId: string, updates: Partial<{
        status: string;
        suggested_specialty_id: string;
        suggested_specialty_name: string;
        suggested_priority: string;
        symptoms_summary: string;
        ai_conclusion: string;
        appointment_id: string;
        completed_at: Date;
    }>): Promise<AiChatSession> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
        if (updates.suggested_specialty_id !== undefined) { fields.push(`suggested_specialty_id = $${idx++}`); values.push(updates.suggested_specialty_id); }
        if (updates.suggested_specialty_name !== undefined) { fields.push(`suggested_specialty_name = $${idx++}`); values.push(updates.suggested_specialty_name); }
        if (updates.suggested_priority !== undefined) { fields.push(`suggested_priority = $${idx++}`); values.push(updates.suggested_priority); }
        if (updates.symptoms_summary !== undefined) { fields.push(`symptoms_summary = $${idx++}`); values.push(updates.symptoms_summary); }
        if (updates.ai_conclusion !== undefined) { fields.push(`ai_conclusion = $${idx++}`); values.push(updates.ai_conclusion); }
        if (updates.appointment_id !== undefined) { fields.push(`appointment_id = $${idx++}`); values.push(updates.appointment_id); }
        if (updates.completed_at !== undefined) { fields.push(`completed_at = $${idx++}`); values.push(updates.completed_at); }

        fields.push(`updated_at = NOW()`);
        values.push(sessionId);

        const r = await pool.query<AiChatSession>(
            `UPDATE ai_chat_sessions SET ${fields.join(', ')} WHERE session_id = $${idx} RETURNING *`,
            values
        );
        return r.rows[0];
    }

    static async updateConversationState(sessionId: string, state: Partial<ConversationState>): Promise<void> {
        await pool.query(
            `UPDATE ai_chat_sessions
             SET conversation_state = conversation_state || $1::jsonb, updated_at = NOW()
             WHERE session_id = $2`,
            [JSON.stringify(state), sessionId]
        );
    }

    static async incrementMessageCount(sessionId: string): Promise<void> {
        await pool.query(
            `UPDATE ai_chat_sessions SET message_count = message_count + 1, updated_at = NOW() WHERE session_id = $1`,
            [sessionId]
        );
    }

    static async deleteSession(sessionId: string): Promise<void> {
        await pool.query(`DELETE FROM ai_chat_sessions WHERE session_id = $1`, [sessionId]);
    }

    // ── Messages ──────────────────────────────────────────────────────

    static async addMessage(params: {
        session_id: string;
        role: 'USER' | 'ASSISTANT' | 'SYSTEM';
        content: string;
        model_used?: string;
        tokens_used?: number;
        response_time_ms?: number;
        analysis_data?: AiAnalysisData | null;
    }): Promise<AiChatMessage> {
        const messageId = genMessageId();
        const r = await pool.query<AiChatMessage>(
            `INSERT INTO ai_chat_messages
             (message_id, session_id, role, content, model_used, tokens_used, response_time_ms, analysis_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                messageId,
                params.session_id,
                params.role,
                params.content,
                params.model_used ?? null,
                params.tokens_used ?? 0,
                params.response_time_ms ?? 0,
                params.analysis_data ? JSON.stringify(params.analysis_data) : null,
            ]
        );
        return r.rows[0];
    }

    static async getSessionMessages(sessionId: string): Promise<AiChatMessage[]> {
        const r = await pool.query<AiChatMessage>(
            `SELECT * FROM ai_chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
            [sessionId]
        );
        return r.rows;
    }

    static async submitFeedback(messageId: string, feedback: 'GOOD' | 'BAD', note?: string): Promise<void> {
        await pool.query(
            `UPDATE ai_chat_messages SET user_feedback = $1, feedback_note = $2 WHERE message_id = $3`,
            [feedback, note ?? null, messageId]
        );
    }

    // ── Patient Context ───────────────────────────────────────────────

    static async getPatientContext(patientId: string): Promise<Record<string, unknown>> {
        const [historyRes, allergyRes, vitalsRes, prescriptionRes] = await Promise.all([
            pool.query(
                `SELECT condition_name, diagnosis_date, notes
                 FROM patient_medical_history
                 WHERE patient_id = $1
                 ORDER BY diagnosis_date DESC NULLS LAST
                 LIMIT 10`,
                [patientId]
            ),
            pool.query(
                `SELECT allergen, reaction, severity
                 FROM patient_allergies
                 WHERE patient_id = $1`,
                [patientId]
            ),
            pool.query(
                `SELECT metric_type, value, unit, recorded_at
                 FROM vital_metrics
                 WHERE patient_id = $1
                 ORDER BY recorded_at DESC
                 LIMIT 15`,
                [patientId]
            ),
            pool.query(
                `SELECT d.name AS drug_name, pi.dosage, pi.frequency, pi.duration_days
                 FROM prescriptions p
                 JOIN prescription_items pi ON pi.prescription_id = p.id
                 JOIN drugs d ON d.id = pi.drug_id
                 WHERE p.patient_id = $1
                 ORDER BY p.created_at DESC
                 LIMIT 10`,
                [patientId]
            ),
        ]);

        return {
            medical_history: historyRes.rows,
            allergies: allergyRes.rows,
            recent_vitals: vitalsRes.rows,
            current_medications: prescriptionRes.rows,
        };
    }

    static async findAvailableSpecialists(branchId: string | undefined, date: string): Promise<unknown[]> {
        const params: unknown[] = [date];
        const branchFilter = branchId ? `AND st.branch_id = $2` : '';
        if (branchId) params.push(branchId);

        const r = await pool.query(
            `SELECT DISTINCT
                d.id AS department_id, d.name AS specialty_name,
                st.id AS doctor_id,
                CONCAT(st.first_name, ' ', st.last_name) AS doctor_name,
                COUNT(asp.id) FILTER (WHERE asp.booked_count < asp.max_capacity) AS available_slots
             FROM staff st
             JOIN departments d ON d.id = st.department_id
             LEFT JOIN staff_schedules ss ON ss.staff_id = st.id AND ss.work_date = $1::date
             LEFT JOIN appointment_slots asp ON asp.shift_id = ss.shift_id
             WHERE st.is_active = TRUE
               AND st.role = 'DOCTOR'
               ${branchFilter}
             GROUP BY d.id, d.name, st.id, st.first_name, st.last_name
             HAVING COUNT(asp.id) FILTER (WHERE asp.booked_count < asp.max_capacity) > 0
             ORDER BY available_slots DESC
             LIMIT 8`,
            params
        );
        return r.rows;
    }

    static async getAvailableSlots(branchId: string, date: string, departmentId?: string): Promise<unknown[]> {
        const params: unknown[] = [date, branchId];
        const deptFilter = departmentId ? `AND d.id = $3` : '';
        if (departmentId) params.push(departmentId);

        const r = await pool.query(
            `SELECT
                asp.id AS slot_id, asp.start_time, asp.end_time,
                sh.id AS shift_id, sh.name AS shift_name,
                asp.max_capacity - asp.booked_count AS remaining_capacity,
                CONCAT(st.first_name, ' ', st.last_name) AS doctor_name,
                d.name AS specialty
             FROM appointment_slots asp
             JOIN shifts sh ON sh.id = asp.shift_id
             JOIN staff_schedules ss ON ss.shift_id = asp.shift_id AND ss.work_date = $1::date
             JOIN staff st ON st.id = ss.staff_id
             JOIN departments d ON d.id = st.department_id
             WHERE asp.is_active = TRUE
               AND asp.booked_count < asp.max_capacity
               AND st.branch_id = $2
               ${deptFilter}
             ORDER BY asp.start_time
             LIMIT 15`,
            params
        );
        return r.rows;
    }

    static async getDrugInfo(drugName: string): Promise<unknown[]> {
        const r = await pool.query(
            `SELECT name, generic_name, drug_form, dosage_strength, description, contraindications, side_effects
             FROM drugs
             WHERE (name ILIKE $1 OR generic_name ILIKE $1)
               AND is_active = TRUE
             LIMIT 5`,
            [`%${drugName}%`]
        );
        return r.rows;
    }

    static async bookAppointmentFromAI(input: {
        patient_id: string;
        branch_id: string;
        shift_id: string;
        appointment_date: string;
        reason_for_visit?: string;
    }): Promise<{ appointments_id: string; appointment_code: string; status: string } | null> {
        const r = await pool.query(
            `INSERT INTO appointments
             (patient_id, branch_id, shift_id, appointment_date, booking_channel, reason_for_visit, status)
             VALUES ($1, $2, $3, $4::date, 'APP', $5, 'PENDING')
             RETURNING appointments_id, appointment_code, status`,
            [
                input.patient_id, input.branch_id, input.shift_id,
                input.appointment_date, input.reason_for_visit ?? null,
            ]
        );
        return r.rows[0] ?? null;
    }
}
