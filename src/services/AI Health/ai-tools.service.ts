import Anthropic from '@anthropic-ai/sdk';
import { AiHealthChatRepository } from '../../repository/AI Health/ai-health-chat.repository';
import { AiRagRepository } from '../../repository/AI Health/ai-rag.repository';
import { AIEmbeddingService } from './ai-embedding.service';
import { AI_CONFIG } from '../../constants/AI Health/ai-health-chat.constant';

// ── Tool definitions gửi cho Claude ───────────────────────────────────

export const AI_HEALTH_TOOLS: Anthropic.Tool[] = [
    {
        name: 'get_patient_context',
        description: 'Lấy thông tin hồ sơ bệnh nhân: tiền sử bệnh, dị ứng, thuốc đang dùng, chỉ số sinh tồn gần nhất. Luôn gọi tool này trước khi tư vấn nếu biết patient_id.',
        input_schema: {
            type: 'object' as const,
            properties: {
                patient_id: { type: 'string', description: 'ID bệnh nhân' },
            },
            required: ['patient_id'],
        },
    },
    {
        name: 'search_medical_knowledge',
        description: 'Tìm kiếm thông tin y khoa trong knowledge base của phòng khám. Dùng khi cần tra cứu triệu chứng, thuốc, hoặc hỏi về dịch vụ phòng khám.',
        input_schema: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Câu hỏi hoặc triệu chứng cần tìm kiếm' },
                top_k: { type: 'number', description: 'Số kết quả trả về (mặc định 5, tối đa 10)' },
            },
            required: ['query'],
        },
    },
    {
        name: 'find_available_specialists',
        description: 'Tìm các bác sĩ chuyên khoa có lịch trống. Dùng sau khi xác định được chuyên khoa phù hợp với triệu chứng.',
        input_schema: {
            type: 'object' as const,
            properties: {
                symptoms: { type: 'string', description: 'Mô tả triệu chứng của bệnh nhân' },
                branch_id: { type: 'string', description: 'UUID chi nhánh (tuỳ chọn)' },
                date: { type: 'string', description: 'Ngày khám YYYY-MM-DD (mặc định hôm nay)' },
            },
            required: ['symptoms'],
        },
    },
    {
        name: 'get_appointment_slots',
        description: 'Lấy danh sách khung giờ khám còn trống tại một chi nhánh trong ngày cụ thể.',
        input_schema: {
            type: 'object' as const,
            properties: {
                branch_id: { type: 'string', description: 'ID chi nhánh' },
                date: { type: 'string', description: 'Ngày khám YYYY-MM-DD' },
                department_id: { type: 'string', description: 'ID khoa/chuyên khoa (tuỳ chọn)' },
            },
            required: ['branch_id', 'date'],
        },
    },
    {
        name: 'book_appointment',
        description: 'Đặt lịch khám cho bệnh nhân. CHỈ gọi khi bệnh nhân đã rõ ràng xác nhận muốn đặt lịch.',
        input_schema: {
            type: 'object' as const,
            properties: {
                patient_id: { type: 'string', description: 'ID bệnh nhân' },
                branch_id: { type: 'string', description: 'ID chi nhánh' },
                shift_id: { type: 'string', description: 'ID ca khám' },
                appointment_date: { type: 'string', description: 'Ngày khám YYYY-MM-DD' },
                reason_for_visit: { type: 'string', description: 'Triệu chứng / lý do khám' },
            },
            required: ['patient_id', 'branch_id', 'shift_id', 'appointment_date'],
        },
    },
    {
        name: 'get_drug_info',
        description: 'Tra cứu thông tin thuốc: công dụng, liều dùng, chống chỉ định, tác dụng phụ.',
        input_schema: {
            type: 'object' as const,
            properties: {
                drug_name: { type: 'string', description: 'Tên thuốc cần tra cứu' },
            },
            required: ['drug_name'],
        },
    },
];

// ── Tool executor ─────────────────────────────────────────────────────

export class AIToolsService {

    static async executeToolCall(
        toolName: string,
        toolInput: Record<string, unknown>
    ): Promise<{ result: unknown; error?: string }> {
        try {
            switch (toolName) {
                case 'get_patient_context': {
                    const context = await AiHealthChatRepository.getPatientContext(toolInput.patient_id as string);
                    return { result: context };
                }

                case 'search_medical_knowledge': {
                    const topK = Math.min((toolInput.top_k as number) ?? AI_CONFIG.RAG_TOP_K, 10);
                    try {
                        const embedding = await AIEmbeddingService.embed(toolInput.query as string);
                        const chunks = await AiRagRepository.vectorSearch(embedding, topK, AI_CONFIG.RAG_SIMILARITY_THRESHOLD);
                        const results = chunks.map(c => ({
                            content: c.content,
                            source: c.document_name,
                            relevance: Math.round(c.similarity * 100),
                        }));
                        return { result: results.length > 0 ? results : 'Không tìm thấy thông tin liên quan trong knowledge base.' };
                    } catch {
                        return { result: 'Knowledge base chưa có tài liệu y khoa. Sử dụng kiến thức y khoa chung.' };
                    }
                }

                case 'find_available_specialists': {
                    const date = (toolInput.date as string) ?? new Date().toISOString().split('T')[0];
                    const specialists = await AiHealthChatRepository.findAvailableSpecialists(
                        toolInput.branch_id as string | undefined, date
                    );
                    return { result: specialists.length > 0 ? specialists : 'Hiện không tìm thấy bác sĩ có lịch trống.' };
                }

                case 'get_appointment_slots': {
                    const slots = await AiHealthChatRepository.getAvailableSlots(
                        toolInput.branch_id as string,
                        toolInput.date as string,
                        toolInput.department_id as string | undefined
                    );
                    return { result: slots.length > 0 ? slots : 'Không có khung giờ trống vào ngày này.' };
                }

                case 'book_appointment': {
                    const result = await AiHealthChatRepository.bookAppointmentFromAI({
                        patient_id: toolInput.patient_id as string,
                        branch_id: toolInput.branch_id as string,
                        shift_id: toolInput.shift_id as string,
                        appointment_date: toolInput.appointment_date as string,
                        reason_for_visit: toolInput.reason_for_visit as string | undefined,
                    });
                    return { result: result ?? 'Đặt lịch thất bại.' };
                }

                case 'get_drug_info': {
                    const drugs = await AiHealthChatRepository.getDrugInfo(toolInput.drug_name as string);
                    return { result: drugs.length > 0 ? drugs : 'Không tìm thấy thông tin thuốc này.' };
                }

                default:
                    return { result: null, error: `Tool không tồn tại: ${toolName}` };
            }
        } catch (err: unknown) {
            return { result: null, error: err instanceof Error ? err.message : String(err) };
        }
    }
}
