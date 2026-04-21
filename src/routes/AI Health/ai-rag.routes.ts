import { Router } from 'express';
import multer from 'multer';
import { AiRagController } from '../../controllers/AI Health/ai-rag.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

// Multer: lưu file vào memory buffer (không lưu disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Chỉ chấp nhận file PDF.'));
    },
});

export const aiRagRoutes = Router();

// ═══════════════════════════════════════════════════════════════════════
// MODULE 7.2 — AI KNOWLEDGE BASE (RAG)
// Base: /api/ai/rag
// Chỉ ADMIN mới có quyền quản lý tài liệu
// ═══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/ai/rag/documents:
 *   post:
 *     summary: Upload tài liệu PDF vào knowledge base
 *     description: |
 *       Upload file PDF (hướng dẫn điều trị, thông tin thuốc, chính sách phòng khám...).
 *       File được xử lý bất đồng bộ: parse → chunk → embed → lưu pgvector.
 *     tags: [7.2 AI Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               document_category:
 *                 type: string
 *                 enum: [GENERAL, PRICING, SCHEDULE, POLICY, MEDICAL_INFO, FAQ]
 *     responses:
 *       201:
 *         description: Upload thành công, đang xử lý
 */
aiRagRoutes.post(
    '/documents',
    [verifyAccessToken, checkSessionStatus, authorizeRoles('ADMIN')],
    upload.single('file'),
    AiRagController.uploadDocument
);

/**
 * @swagger
 * /api/ai/rag/documents:
 *   get:
 *     summary: Danh sách tài liệu trong knowledge base
 *     tags: [7.2 AI Knowledge Base]
 *     security:
 *       - bearerAuth: []
 */
aiRagRoutes.get(
    '/documents',
    [verifyAccessToken, checkSessionStatus, authorizeRoles('ADMIN')],
    AiRagController.listDocuments
);

/**
 * @swagger
 * /api/ai/rag/documents/{docId}:
 *   get:
 *     summary: Chi tiết tài liệu
 *     tags: [7.2 AI Knowledge Base]
 *     security:
 *       - bearerAuth: []
 */
aiRagRoutes.get(
    '/documents/:docId',
    [verifyAccessToken, checkSessionStatus, authorizeRoles('ADMIN')],
    AiRagController.getDocument
);

/**
 * @swagger
 * /api/ai/rag/documents/{docId}:
 *   delete:
 *     summary: Xóa tài liệu
 *     tags: [7.2 AI Knowledge Base]
 *     security:
 *       - bearerAuth: []
 */
aiRagRoutes.delete(
    '/documents/:docId',
    [verifyAccessToken, checkSessionStatus, authorizeRoles('ADMIN')],
    AiRagController.deleteDocument
);

/**
 * @swagger
 * /api/ai/rag/search-test:
 *   post:
 *     summary: Test tìm kiếm knowledge base
 *     tags: [7.2 AI Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query: { type: string }
 *               top_k: { type: integer, default: 5 }
 */
aiRagRoutes.post(
    '/search-test',
    [verifyAccessToken, checkSessionStatus, authorizeRoles('ADMIN')],
    AiRagController.searchTest
);
