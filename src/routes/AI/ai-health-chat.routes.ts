import { Router } from 'express';
import { AiHealthChatController } from '../../controllers/AI/ai-health-chat.controller';

const router = Router();

// AI Chat không yêu cầu đăng nhập — ai cũng có thể chat

/**
 * @swagger
 * tags:
 *   - name: '7.1 AI Tư Vấn Sức Khỏe'
 *     description: >
 *       Chatbot AI tư vấn sức khỏe ban đầu cho bệnh nhân.
 *       AI tiếp nhận triệu chứng → hỏi chi tiết → gợi ý chuyên khoa phù hợp + mức độ ưu tiên + hướng dẫn đặt lịch.
 *       Hỗ trợ hội thoại nhiều lượt (multi-turn) và streaming response (SSE).
 *       Liên kết: Module 2 (Chuyên khoa), Module 3 (Bệnh nhân), Module 3 (Lịch khám)
 */

// ═══════════════════════════════════════════
//  1. Bắt đầu phiên tư vấn AI
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions:
 *   post:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Bắt đầu phiên tư vấn AI mới
 *     description: |
 *       Tạo phiên tư vấn sức khỏe mới với AI. Bệnh nhân gửi mô tả triệu chứng ban đầu,
 *       AI sẽ phân tích và đặt câu hỏi chi tiết (vị trí đau, mức độ, thời gian, triệu chứng kèm...).
 *
 *       **Nghiệp vụ:**
 *       - Tạo session mới (mã phiên dạng AIC-YYYYMMDD-XXXX)
 *       - AI sử dụng danh sách chuyên khoa thật từ DB để gợi ý
 *       - Giới hạn tối đa 3 phiên ACTIVE đồng thời / user
 *       - Tối đa 20 tin nhắn / phiên (10 lượt hỏi-đáp)
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token)
 *       **Vai trò được phép:** Tất cả user đã đăng nhập (PATIENT, ADMIN, DOCTOR, NURSE...)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Mô tả triệu chứng ban đầu
 *                 example: "Tôi bị đau bụng từ sáng nay, đau nhiều ở bên phải bụng dưới"
 *               patient_id:
 *                 type: string
 *                 nullable: true
 *                 description: ID bệnh nhân (nếu đã có hồ sơ, tùy chọn)
 *                 example: "PAT_2506_a1b2c3d4"
 *     responses:
 *       201:
 *         description: Tạo phiên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bắt đầu phiên tư vấn AI thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/AiChatSession'
 *                     ai_reply:
 *                       type: string
 *                       example: "Tôi hiểu bạn đang bị đau bụng. Để giúp bạn chính xác hơn, cho tôi hỏi thêm..."
 *                     analysis:
 *                       $ref: '#/components/schemas/AiAnalysisData'
 *       400:
 *         description: Tin nhắn rỗng hoặc quá dài
 *       401:
 *         description: Chưa đăng nhập
 *       429:
 *         description: Quá nhiều phiên ACTIVE đồng thời
 *       503:
 *         description: Lỗi kết nối dịch vụ AI (Gemini)
 */
router.post('/sessions', AiHealthChatController.startSession);

// ═══════════════════════════════════════════
//  2. Gửi tin nhắn (JSON response)
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/messages:
 *   post:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Gửi tin nhắn tiếp theo (JSON response)
 *     description: |
 *       Gửi tin nhắn tiếp theo trong phiên hội thoại AI. AI sẽ dựa vào toàn bộ lịch sử chat
 *       (multi-turn) để hiểu ngữ cảnh và phản hồi.
 *
 *       **Nghiệp vụ:**
 *       - Load toàn bộ conversation history → gửi cùng Gemini
 *       - Nếu AI chưa đủ thông tin → tiếp tục hỏi thêm
 *       - Nếu AI đủ thông tin → gợi ý chuyên khoa + ưu tiên + đặt lịch
 *       - Tự động map specialty_code từ AI → specialty_id trong DB
 *       - Luôn kèm cảnh báo "không thay thế bác sĩ"
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token) — chỉ chủ phiên mới gửi được
 *       **Vai trò được phép:** Tất cả user đã đăng nhập
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "AIC_2603_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Tin nhắn tiếp theo
 *                 example: "Đau nhói ở bụng dưới bên phải, bắt đầu từ sáng, kèm sốt nhẹ"
 *     responses:
 *       200:
 *         description: Gửi tin nhắn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Gửi tin nhắn thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/AiChatSession'
 *                     ai_reply:
 *                       type: string
 *                     analysis:
 *                       $ref: '#/components/schemas/AiAnalysisData'
 *       400:
 *         description: Tin nhắn rỗng / quá dài / hết lượt tin nhắn / phiên đã kết thúc
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập phiên này
 *       404:
 *         description: Không tìm thấy phiên
 *       503:
 *         description: Lỗi kết nối dịch vụ AI
 */
router.post('/sessions/:sessionId/messages', AiHealthChatController.sendMessage);

// ═══════════════════════════════════════════
//  3. Gửi tin nhắn (SSE Streaming response)
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/messages/stream:
 *   post:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Gửi tin nhắn với streaming response (SSE)
 *     description: |
 *       Giống endpoint messages nhưng trả phản hồi dạng **Server-Sent Events (SSE)**.
 *       Frontend nhận từng chunk text real-time (giống ChatGPT).
 *
 *       **SSE Events:**
 *       - `{"type":"chunk","content":"..."}` — từng phần text phản hồi
 *       - `{"type":"analysis","data":{...}}` — kết quả phân tích sau khi stream xong
 *       - `{"type":"done","session":{...}}` — session cập nhật cuối cùng
 *       - `{"type":"error","message":"..."}` — lỗi trong quá trình stream
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token) — chỉ chủ phiên
 *       **Vai trò được phép:** Tất cả user đã đăng nhập
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "AIC_2603_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Tôi bị ho kéo dài 2 tuần, có đờm xanh"
 *     responses:
 *       200:
 *         description: SSE stream response
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Tin nhắn rỗng / phiên đã kết thúc
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập phiên này
 *       404:
 *         description: Không tìm thấy phiên
 */
router.post('/sessions/:sessionId/messages/stream', AiHealthChatController.sendMessageStream);

// ═══════════════════════════════════════════
//  4. Kết thúc phiên tư vấn
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/complete:
 *   patch:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Kết thúc phiên tư vấn AI
 *     description: |
 *       Đánh dấu phiên tư vấn là COMPLETED. Sau khi kết thúc, không thể gửi thêm tin nhắn.
 *       Phiên vẫn có thể xem lại lịch sử.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token) — chỉ chủ phiên
 *       **Vai trò được phép:** Tất cả user đã đăng nhập
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "AIC_2603_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Kết thúc phiên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Kết thúc phiên tư vấn thành công."
 *                 data:
 *                   $ref: '#/components/schemas/AiChatSession'
 *       400:
 *         description: Phiên đã kết thúc/hết hạn rồi
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy phiên
 */
router.patch('/sessions/:sessionId/complete', AiHealthChatController.completeSession);

// ═══════════════════════════════════════════
//  5. Lịch sử chat 1 phiên
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}:
 *   get:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Lấy lịch sử chat 1 phiên
 *     description: |
 *       Trả về thông tin phiên + toàn bộ tin nhắn (BN ↔ AI) sắp xếp theo thời gian.
 *       Dùng để hiển thị lại lịch sử hội thoại.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token) — chỉ chủ phiên
 *       **Vai trò được phép:** Tất cả user đã đăng nhập
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "AIC_2603_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/AiChatSession'
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AiChatMessage'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy phiên
 */
router.get('/sessions/:sessionId', AiHealthChatController.getSessionHistory);

// ═══════════════════════════════════════════
//  6. Danh sách phiên tư vấn
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions:
 *   get:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Danh sách phiên tư vấn AI của user
 *     description: |
 *       Lấy danh sách phiên tư vấn AI của user hiện tại (phân trang).
 *       Có thể lọc theo trạng thái (ACTIVE, COMPLETED, EXPIRED).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer Token)
 *       **Vai trò được phép:** Tất cả user đã đăng nhập
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, EXPIRED]
 *         description: Lọc theo trạng thái phiên
 *         example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AiChatSession'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/sessions', AiHealthChatController.getUserSessions);

// ═══════════════════════════════════════════
//  Swagger Schemas
// ═══════════════════════════════════════════

/**
 * @swagger
 * components:
 *   schemas:
 *     AiChatSession:
 *       type: object
 *       properties:
 *         session_id:
 *           type: string
 *           example: "AIC_2603_a1b2c3d4"
 *         session_code:
 *           type: string
 *           example: "AIC-20260324-A1B2"
 *         patient_id:
 *           type: string
 *           nullable: true
 *         user_id:
 *           type: string
 *         suggested_specialty_id:
 *           type: string
 *           nullable: true
 *           description: ID chuyên khoa AI gợi ý (liên kết bảng specialties)
 *         suggested_specialty_name:
 *           type: string
 *           nullable: true
 *           description: Tên chuyên khoa AI gợi ý
 *           example: "Ngoại khoa Tổng quát"
 *         suggested_priority:
 *           type: string
 *           nullable: true
 *           enum: [NORMAL, SOON, URGENT]
 *           description: "NORMAL = bình thường, SOON = 1-2 ngày, URGENT = cấp cứu"
 *         symptoms_summary:
 *           type: string
 *           nullable: true
 *           description: AI tóm tắt triệu chứng đã thu thập
 *         ai_conclusion:
 *           type: string
 *           nullable: true
 *           description: Kết luận / lý do gợi ý
 *         status:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, EXPIRED]
 *         message_count:
 *           type: integer
 *         appointment_id:
 *           type: string
 *           nullable: true
 *           description: ID lịch khám nếu BN đặt lịch từ gợi ý AI
 *         created_at:
 *           type: string
 *           format: date-time
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     AiChatMessage:
 *       type: object
 *       properties:
 *         message_id:
 *           type: string
 *         session_id:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ASSISTANT, SYSTEM]
 *         content:
 *           type: string
 *         model_used:
 *           type: string
 *           nullable: true
 *           example: "gemini-2.5-flash"
 *         tokens_used:
 *           type: integer
 *         response_time_ms:
 *           type: integer
 *           description: Thời gian phản hồi AI (ms)
 *         analysis_data:
 *           $ref: '#/components/schemas/AiAnalysisData'
 *         created_at:
 *           type: string
 *           format: date-time
 *     AiAnalysisData:
 *       type: object
 *       nullable: true
 *       description: Dữ liệu phân tích triệu chứng từ AI (chỉ có trong tin nhắn ASSISTANT)
 *       properties:
 *         is_complete:
 *           type: boolean
 *           description: true khi AI đã thu thập đủ triệu chứng
 *         follow_up_questions:
 *           type: array
 *           items:
 *             type: string
 *           description: Câu hỏi AI muốn hỏi thêm
 *         suggested_specialty_code:
 *           type: string
 *           nullable: true
 *           description: Mã chuyên khoa gợi ý
 *           example: "NGOAI_KHOA"
 *         suggested_specialty_name:
 *           type: string
 *           nullable: true
 *           example: "Ngoại khoa Tổng quát"
 *         priority:
 *           type: string
 *           nullable: true
 *           enum: [NORMAL, SOON, URGENT]
 *         symptoms_collected:
 *           type: array
 *           items:
 *             type: string
 *           description: Triệu chứng AI đã thu thập được
 *         should_suggest_booking:
 *           type: boolean
 *           description: AI có nên gợi ý đặt lịch không
 *         reasoning:
 *           type: string
 *           nullable: true
 *           description: Lý do AI chọn chuyên khoa này
 *         severity:
 *           type: string
 *           nullable: true
 *           enum: [MILD, MODERATE, SEVERE]
 *           description: "Mức độ nghiêm trọng: MILD = nhẹ, MODERATE = trung bình, SEVERE = nặng"
 *         can_self_treat:
 *           type: boolean
 *           description: BN có thể tự chăm sóc tại nhà không
 *         preliminary_assessment:
 *           type: string
 *           nullable: true
 *           description: Đánh giá sơ bộ (VD Ho khan do viêm họng nhẹ)
 *           example: "Ho khan do viêm họng nhẹ / kích ứng đường hô hấp"
 *         recommended_actions:
 *           type: array
 *           items:
 *             type: string
 *           description: Gợi ý hành động cụ thể (chăm sóc nhà, OTC, điều kiện cần khám)
 *         red_flags_detected:
 *           type: array
 *           items:
 *             type: string
 *           description: Dấu hiệu nguy hiểm đã phát hiện
 *         needs_doctor:
 *           type: boolean
 *           description: Có cần đi khám bác sĩ không
 */

export { router as aiHealthChatRoutes };
