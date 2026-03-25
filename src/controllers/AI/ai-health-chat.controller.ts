import { Request, Response } from 'express';
import { AiHealthChatService } from '../../services/AI/ai-health-chat.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    AI_CHAT_SUCCESS,
    AI_CHAT_ERRORS,
} from '../../constants/ai-health-chat.constant';

/**
 * Controller tiếp nhận HTTP Request cho module AI Tư Vấn Sức Khỏe.
 * Chỉ parse request → gọi Service → trả response. Không chứa business logic.
 */
export class AiHealthChatController {

    /**
     * POST /api/ai/health-chat/sessions — Bắt đầu phiên tư vấn AI mới
     */
    static async startSession(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id || null;
            const { message, patient_id } = req.body;

            if (!message) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
            }

            const result = await AiHealthChatService.startSession(userId, message, patient_id);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_CREATED,
                data: {
                    session: result.session,
                    ai_reply: result.ai_reply,
                    analysis: result.analysis,
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[AiHealthChatController.startSession] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Lỗi máy chủ khi bắt đầu phiên tư vấn AI.',
                });
            }
        }
    }

    /**
     * POST /api/ai/health-chat/sessions/:sessionId/messages — Gửi tin nhắn (JSON response)
     */
    static async sendMessage(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const sessionId = req.params.sessionId as string;
            const { message } = req.body;

            if (!message) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
            }

            const result = await AiHealthChatService.sendMessage(sessionId, userId, message);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.MESSAGE_SENT,
                data: {
                    session: result.session,
                    ai_reply: result.ai_reply,
                    analysis: result.analysis,
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[AiHealthChatController.sendMessage] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Lỗi máy chủ khi gửi tin nhắn.',
                });
            }
        }
    }

    /**
     * POST /api/ai/health-chat/sessions/:sessionId/messages/stream — Gửi tin nhắn (SSE streaming)
     */
    static async sendMessageStream(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const sessionId = req.params.sessionId as string;
            const { message } = req.body;

            if (!message) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
            }

            // SSE streaming — Service sẽ ghi trực tiếp vào res
            await AiHealthChatService.sendMessageStream(sessionId, userId, message, res);
        } catch (error: any) {
            // Nếu lỗi xảy ra TRƯỚC khi bắt đầu stream → trả JSON lỗi bình thường
            if (!res.headersSent) {
                if (error instanceof AppError) {
                    res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
                } else {
                    console.error('[AiHealthChatController.sendMessageStream] Error:', error);
                    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Lỗi máy chủ khi stream phản hồi AI.',
                    });
                }
            }
        }
    }

    /**
     * PATCH /api/ai/health-chat/sessions/:sessionId/complete — Kết thúc phiên tư vấn
     */
    static async completeSession(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const sessionId = req.params.sessionId as string;

            const session = await AiHealthChatService.completeSession(sessionId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_COMPLETED,
                data: session,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[AiHealthChatController.completeSession] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Lỗi máy chủ khi kết thúc phiên.',
                });
            }
        }
    }

    /**
     * GET /api/ai/health-chat/sessions/:sessionId — Lịch sử chat 1 phiên
     */
    static async getSessionHistory(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const sessionId = req.params.sessionId as string;

            const result = await AiHealthChatService.getSessionHistory(sessionId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[AiHealthChatController.getSessionHistory] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Lỗi máy chủ khi lấy lịch sử phiên.',
                });
            }
        }
    }

    /**
     * GET /api/ai/health-chat/sessions — Danh sách phiên tư vấn của user
     */
    static async getUserSessions(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
            const status = req.query.status?.toString();

            const result = await AiHealthChatService.getUserSessions(userId, page, limit, status);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSIONS_LISTED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            });
        } catch (error: any) {
            console.error('[AiHealthChatController.getUserSessions] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Lỗi máy chủ khi lấy danh sách phiên.',
            });
        }
    }
}
