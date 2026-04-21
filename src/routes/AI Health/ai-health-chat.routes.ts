import { Router } from 'express';
import { AiHealthChatController } from '../../controllers/AI Health/ai-health-chat.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

export const aiHealthChatRoutes = Router();

// ═══════════════════════════════════════════════════════════════════════
// MODULE 7.1 — AI TƯ VẤN SỨC KHỎE (AI Health Consultation)
// Base: /api/ai/health-chat
// ═══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/ai/health-chat/sessions:
 *   post:
 *     summary: Tạo phiên tư vấn AI mới
 *     description: |
 *       Tạo phiên hội thoại mới với AI và gửi tin nhắn đầu tiên.
 *       AI sẽ phản hồi với tư vấn ban đầu và kèm analysis data (chuyên khoa gợi ý, mức ưu tiên).
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Tôi bị đau đầu và sốt 38.5 độ từ sáng đến giờ"
 *     responses:
 *       201:
 *         description: Tạo phiên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     session: { type: object }
 *                     ai_reply: { type: string }
 *                     analysis: { type: object, nullable: true }
 *                     assistant_message_id: { type: string }
 */
aiHealthChatRoutes.post('/sessions', [verifyAccessToken, checkSessionStatus], AiHealthChatController.createSession);

/**
 * @swagger
 * /api/ai/health-chat/sessions:
 *   get:
 *     summary: Danh sách phiên tư vấn của tôi
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, COMPLETED, EXPIRED] }
 *     responses:
 *       200:
 *         description: Lấy danh sách phiên thành công
 */
aiHealthChatRoutes.get('/sessions', [verifyAccessToken, checkSessionStatus], AiHealthChatController.listSessions);

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}:
 *   get:
 *     summary: Chi tiết phiên tư vấn + lịch sử tin nhắn
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lấy chi tiết phiên thành công
 */
aiHealthChatRoutes.get('/sessions/:sessionId', [verifyAccessToken, checkSessionStatus], AiHealthChatController.getSession);

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/messages:
 *   post:
 *     summary: Gửi tin nhắn (JSON response)
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Gửi tin nhắn thành công
 */
aiHealthChatRoutes.post('/sessions/:sessionId/messages', [verifyAccessToken, checkSessionStatus], AiHealthChatController.sendMessage);

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/messages/stream:
 *   post:
 *     summary: Gửi tin nhắn với SSE streaming
 *     description: |
 *       Trả về Server-Sent Events với các event types:
 *       - `chunk`: text đang stream
 *       - `analysis`: kết quả phân tích AI (chuyên khoa, mức ưu tiên)
 *       - `done`: hoàn thành với session và message_id
 *       - `error`: lỗi
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 */
aiHealthChatRoutes.post('/sessions/:sessionId/messages/stream', [verifyAccessToken, checkSessionStatus], AiHealthChatController.streamMessage);

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/complete:
 *   patch:
 *     summary: Kết thúc phiên tư vấn
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 */
aiHealthChatRoutes.patch('/sessions/:sessionId/complete', [verifyAccessToken, checkSessionStatus], AiHealthChatController.completeSession);

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}:
 *   delete:
 *     summary: Xóa phiên tư vấn
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 */
aiHealthChatRoutes.delete('/sessions/:sessionId', [verifyAccessToken, checkSessionStatus], AiHealthChatController.deleteSession);

/**
 * @swagger
 * /api/ai/health-chat/sessions/{sessionId}/messages/{messageId}/feedback:
 *   patch:
 *     summary: Đánh giá chất lượng tin nhắn AI (GOOD/BAD)
 *     tags: [7.1 AI Tư vấn sức khỏe]
 *     security:
 *       - bearerAuth: []
 */
aiHealthChatRoutes.patch(
    '/sessions/:sessionId/messages/:messageId/feedback',
    [verifyAccessToken, checkSessionStatus],
    AiHealthChatController.submitFeedback
);
