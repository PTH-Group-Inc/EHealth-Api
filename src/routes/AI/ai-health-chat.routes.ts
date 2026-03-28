import { Router } from 'express';
import { AiHealthChatController } from '../../controllers/AI/ai-health-chat.controller';
import { optionalVerifyAccessToken } from '../../middleware/optionalVerifyAccessToken.middleware';
import { aiSessionCreateLimiter, aiMessageSendLimiter, aiReadLimiter } from '../../middleware/aiChatRateLimit.middleware';

const router = Router();

/** AI Chat sử dụng optionalVerifyAccessToken — hỗ trợ cả Guest lẫn User đã đăng nhập */
router.use(optionalVerifyAccessToken);

/**
 * @swagger
 * tags:
 *   - name: '7.1 AI Tư Vấn Sức Khỏe'
 *     description: >
 *       Chatbot AI tư vấn sức khỏe ban đầu cho bệnh nhân.
 *       AI tiếp nhận triệu chứng → hỏi chi tiết → gợi ý chuyên khoa phù hợp + mức độ ưu tiên + hướng dẫn đặt lịch.
 *       Hỗ trợ hội thoại nhiều lượt (multi-turn) và streaming response (SSE).
 *       Liên kết: Module 2 (Chuyên khoa), Module 3 (Bệnh nhân), Module 4 (Lịch khám)
 */


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
 *       - Tích hợp RAG: AI tham khảo tài liệu nội bộ phòng khám (bảng giá, lịch bác sĩ...)
 *       - Giới hạn tối đa 3 phiên ACTIVE đồng thời / user
 *       - Tối đa 20 tin nhắn / phiên (10 lượt hỏi-đáp)
 *
 *       **Phân quyền:** Không bắt buộc đăng nhập (hỗ trợ Guest). Nếu có Bearer Token sẽ gắn session vào user.
 *       **Vai trò được phép:** Tất cả (Guest + mọi user đã đăng nhập)
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
 *                       example: "Tôi hiểu bạn đang bị đau bụng. Để giúp bạn chính xác hơn, cho tôi hỏi thêm: Cơn đau ở mức nhẹ, vừa hay dữ dội?"
 *                     analysis:
 *                       $ref: '#/components/schemas/AiAnalysisData'
 *       400:
 *         description: Tin nhắn rỗng hoặc quá dài
 *       429:
 *         description: Quá nhiều phiên ACTIVE đồng thời (tối đa 3)
 *       503:
 *         description: Lỗi kết nối dịch vụ AI (Gemini)
 */
router.post('/sessions', aiSessionCreateLimiter, AiHealthChatController.startSession as any);

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
 *       Gửi tin nhắn tiếp theo trong phiên hội thoại AI. AI dựa vào toàn bộ lịch sử chat
 *       (multi-turn) để hiểu ngữ cảnh và phản hồi phù hợp.
 *
 *       **Nghiệp vụ:**
 *       - Load toàn bộ conversation history → gửi cùng Gemini
 *       - Giai đoạn Discovery: AI hỏi thêm 1-2 câu nếu chưa đủ thông tin
 *       - Giai đoạn Recommendation: Gợi ý chuyên khoa + ưu tiên + đặt lịch khi đủ thông tin
 *       - Tự động map specialty_code từ AI → specialty_id trong DB
 *       - Phát hiện red flags → cảnh báo URGENT ngay lập tức
 *       - Luôn kèm cảnh báo "AI không thay thế bác sĩ"
 *
 *       **Phân quyền:** Chỉ chủ phiên mới gửi được (kiểm tra user_id)
 *       **Vai trò được phép:** Tất cả
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên tư vấn
 *         example: "AIC_a1b2c3d4e5f67890"
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
 *       403:
 *         description: Không có quyền truy cập phiên này
 *       404:
 *         description: Không tìm thấy phiên
 *       503:
 *         description: Lỗi kết nối dịch vụ AI
 */
router.post('/sessions/:sessionId/messages', aiMessageSendLimiter, AiHealthChatController.sendMessage as any);

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
 *       **Phân quyền:** Chỉ chủ phiên
 *       **Vai trò được phép:** Tất cả
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên tư vấn
 *         example: "AIC_a1b2c3d4e5f67890"
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
 *       403:
 *         description: Không có quyền truy cập phiên này
 *       404:
 *         description: Không tìm thấy phiên
 */
router.post('/sessions/:sessionId/messages/stream', aiMessageSendLimiter, AiHealthChatController.sendMessageStream as any);

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
 *       **Phân quyền:** Chỉ chủ phiên
 *       **Vai trò được phép:** Tất cả
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên tư vấn cần kết thúc
 *         example: "AIC_a1b2c3d4e5f67890"
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
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy phiên
 */
router.patch('/sessions/:sessionId/complete', aiReadLimiter, AiHealthChatController.completeSession as any);

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
 *       **Phân quyền:** Chỉ chủ phiên
 *       **Vai trò được phép:** Tất cả
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên tư vấn
 *         example: "AIC_a1b2c3d4e5f67890"
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
 *                 message:
 *                   type: string
 *                   example: "Lấy lịch sử phiên thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/AiChatSession'
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AiChatMessage'
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy phiên
 */
router.get('/sessions/:sessionId', aiReadLimiter, AiHealthChatController.getSessionHistory as any);

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
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách phiên thành công."
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
router.get('/sessions', aiReadLimiter, AiHealthChatController.getUserSessions as any);

//  7. Đánh giá phản hồi AI (Feedback Loop)

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/messages/{messageId}/feedback:
 *   patch:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Đánh giá chất lượng phản hồi AI (GOOD / BAD)
 *     description: |
 *       Cho phép user đánh giá chất lượng từng tin nhắn phản hồi của AI.
 *       Dữ liệu feedback được dùng để phân tích, thống kê và cải thiện prompt AI theo thời gian.
 *
 *       **Nghiệp vụ:**
 *       - Chỉ đánh giá được tin nhắn có role = ASSISTANT (không đánh giá tin nhắn USER)
 *       - Mỗi tin nhắn chỉ được đánh giá 1 lần, không cho ghi đè
 *       - Giá trị feedback hợp lệ: `GOOD` hoặc `BAD`
 *       - Ghi chú (note) tùy chọn, tối đa 500 ký tự
 *
 *       **Phân quyền:** Chỉ chủ phiên mới đánh giá được
 *       **Vai trò được phép:** Tất cả (Guest + User đã đăng nhập)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên tư vấn
 *         example: "AIC_a1b2c3d4e5f67890"
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tin nhắn ASSISTANT cần đánh giá
 *         example: "MSG_a1b2c3d4e5f67890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: string
 *                 enum: [GOOD, BAD]
 *                 description: "Đánh giá: GOOD = phản hồi hữu ích, BAD = phản hồi kém"
 *                 example: "GOOD"
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 description: Ghi chú tùy chọn (lý do đánh giá)
 *                 example: "AI trả lời rất chi tiết và hữu ích"
 *     responses:
 *       200:
 *         description: Đánh giá phản hồi thành công
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
 *                   example: "Đánh giá phản hồi AI thành công."
 *                 data:
 *                   $ref: '#/components/schemas/AiChatMessage'
 *       400:
 *         description: |
 *           Lỗi validation:
 *           - Giá trị feedback không hợp lệ (chỉ GOOD/BAD)
 *           - Tin nhắn không phải ASSISTANT
 *           - Đã đánh giá rồi
 *           - Ghi chú quá dài (>500 ký tự)
 *       403:
 *         description: Không có quyền truy cập phiên này
 *       404:
 *         description: Không tìm thấy phiên hoặc tin nhắn
 */
router.patch('/sessions/:sessionId/messages/:messageId/feedback', aiReadLimiter, AiHealthChatController.submitFeedback as any);

//  8. Thống kê Token Usage (Admin only)

/**
 * @swagger
 * /api/ai/health-chat/analytics/tokens:
 *   get:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Thống kê token usage & feedback của AI (Admin Dashboard)
 *     description: |
 *       Thống kê chi tiết lượng token AI sử dụng theo ngày, model, và tình hình feedback.
 *       Dùng để kiểm soát chi phí AI và đánh giá chất lượng phản hồi.
 *
 *       **Dữ liệu trả về:**
 *       - `daily`: Breakdown theo từng ngày + model (messages, tokens, response time)
 *       - `summary`: Tổng hợp toàn khoảng thời gian (bao gồm feedback stats)
 *
 *       **Phân quyền:** Yêu cầu đăng nhập (Bearer token)
 *       **Vai trò được phép:** ADMIN, STAFF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD). Mặc định 30 ngày trước.
 *         example: "2026-03-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD). Mặc định hôm nay.
 *         example: "2026-03-28"
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                   example: "Lấy thống kê token usage thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           usage_date:
 *                             type: string
 *                             example: "2026-03-28"
 *                           model_used:
 *                             type: string
 *                             example: "gemini-2.5-flash-preview-04-17"
 *                           total_messages:
 *                             type: integer
 *                             example: 45
 *                           total_tokens:
 *                             type: integer
 *                             example: 12500
 *                           avg_response_ms:
 *                             type: integer
 *                             example: 1230
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_messages:
 *                           type: integer
 *                           example: 320
 *                         total_tokens:
 *                           type: integer
 *                           example: 89000
 *                         avg_response_ms:
 *                           type: integer
 *                           example: 1150
 *                         total_sessions:
 *                           type: integer
 *                           example: 85
 *                         feedback_stats:
 *                           type: object
 *                           properties:
 *                             good:
 *                               type: integer
 *                               example: 45
 *                             bad:
 *                               type: integer
 *                               example: 8
 *                             no_feedback:
 *                               type: integer
 *                               example: 267
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền (chỉ ADMIN/STAFF)
 */
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

router.get('/analytics/tokens', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), AiHealthChatController.getTokenAnalytics as any);

// ═══════════════════════════════════════════
//  Swagger Schemas (tái sử dụng qua $ref)
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
 *           example: "AIC_a1b2c3d4e5f67890"
 *         session_code:
 *           type: string
 *           example: "AIC-20260327-A1B2"
 *         patient_id:
 *           type: string
 *           nullable: true
 *         user_id:
 *           type: string
 *         suggested_specialty_id:
 *           type: string
 *           nullable: true
 *           description: ID chuyên khoa AI gợi ý (FK → specialties)
 *         suggested_specialty_name:
 *           type: string
 *           nullable: true
 *           description: Tên chuyên khoa AI gợi ý
 *           example: "Tiêu hóa"
 *         suggested_priority:
 *           type: string
 *           nullable: true
 *           enum: [NORMAL, SOON, URGENT]
 *           description: "NORMAL = bình thường, SOON = cần khám 1-2 ngày, URGENT = cấp cứu"
 *         symptoms_summary:
 *           type: string
 *           nullable: true
 *           description: AI tóm tắt triệu chứng đã thu thập
 *         ai_conclusion:
 *           type: string
 *           nullable: true
 *           description: Đánh giá sơ bộ / lý do gợi ý
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
 *           description: true khi AI đã thu thập đủ triệu chứng và đưa ra gợi ý
 *         suggested_specialty_code:
 *           type: string
 *           nullable: true
 *           description: Mã chuyên khoa gợi ý (dùng để map sang specialty_id)
 *           example: "TIEU_HOA"
 *         suggested_specialty_name:
 *           type: string
 *           nullable: true
 *           example: "Tiêu hóa"
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
 *           description: Đánh giá sơ bộ
 *           example: "Triệu chứng có thể liên quan đến viêm dạ dày tá tràng"
 *         recommended_actions:
 *           type: array
 *           items:
 *             type: string
 *           description: Gợi ý hành động cụ thể
 *         red_flags_detected:
 *           type: array
 *           items:
 *             type: string
 *           description: Dấu hiệu nguy hiểm đã phát hiện
 *         needs_doctor:
 *           type: boolean
 *           description: Có cần đi khám bác sĩ không
 */

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}:
 *   delete:
 *     tags: ['7.1 AI Tư Vấn Sức Khỏe']
 *     summary: Xóa phiên tư vấn AI (soft delete)
 *     description: |
 *       Soft delete phiên tư vấn — chuyển trạng thái sang `DELETED`.
 *       Phiên đã xóa sẽ không hiện trong danh sách phiên của user.
 *
 *       **Phân quyền:** Không yêu cầu token (Guest + User đều dùng được).
 *       **Vai trò được phép:** Tất cả. User chỉ xóa được phiên của chính mình.
 *
 *       Lưu ý:
 *       - Phiên đã xóa (DELETED) không thể xóa lại lần nữa.
 *       - Dữ liệu phiên vẫn tồn tại trong DB phục vụ analytics, chỉ ẩn khỏi user.
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên tư vấn cần xóa
 *         example: "AIC_a1b2c3d4e5f67890"
 *     responses:
 *       200:
 *         description: Xóa phiên thành công
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
 *                   example: "Xóa phiên tư vấn thành công."
 *       400:
 *         description: Phiên đã bị xóa trước đó
 *       403:
 *         description: Không có quyền xóa phiên này
 *       404:
 *         description: Không tìm thấy phiên
 *       500:
 *         description: Lỗi server
 */
router.delete(
    '/sessions/:sessionId',
    aiReadLimiter,
    AiHealthChatController.deleteSession as any
);

export { router as aiHealthChatRoutes };
