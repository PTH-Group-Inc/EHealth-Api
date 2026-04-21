import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { AiHealthChatService } from '../../services/AI Health/ai-health-chat.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { AI_ERRORS, AI_SUCCESS } from '../../constants/AI Health/ai-health-chat.constant';

export class AiHealthChatController {

    /**
     * POST /api/ai/health-chat/sessions
     * Tạo phiên tư vấn mới và gửi tin nhắn đầu tiên
     */
    static createSession = asyncHandler(async (req: Request, res: Response) => {
        const { message } = req.body;
        if (!message?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, AI_ERRORS.MESSAGE_EMPTY.code, AI_ERRORS.MESSAGE_EMPTY.message);
        }

        const auth = (req as any).auth;
        const result = await AiHealthChatService.createSession({
            message: String(message).trim(),
            user_id: auth?.user_id as string | undefined,
            patient_id: auth?.patient_id as string | undefined,
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: AI_SUCCESS.SESSION_CREATED,
            data: result,
        });
    });

    /**
     * GET /api/ai/health-chat/sessions
     * Danh sách phiên tư vấn của user
     */
    static listSessions = asyncHandler(async (req: Request, res: Response) => {
        const auth = (req as any).auth;
        const page = parseInt(String(req.query.page)) || 1;
        const limit = Math.min(parseInt(String(req.query.limit)) || 20, 50);
        const status = req.query.status ? String(req.query.status) : undefined;

        const result = await AiHealthChatService.listSessions({
            user_id: auth?.user_id as string | undefined,
            patient_id: auth?.patient_id as string | undefined,
            status,
            page,
            limit,
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / result.limit),
            },
        });
    });

    /**
     * GET /api/ai/health-chat/sessions/:sessionId
     * Chi tiết phiên + lịch sử tin nhắn
     */
    static getSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = String(req.params.sessionId);
        const auth = (req as any).auth;

        const result = await AiHealthChatService.getSession(sessionId, auth?.user_id as string | undefined);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result,
        });
    });

    /**
     * POST /api/ai/health-chat/sessions/:sessionId/messages
     * Gửi tin nhắn (non-streaming)
     */
    static sendMessage = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = String(req.params.sessionId);
        const { message } = req.body;
        if (!message?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, AI_ERRORS.MESSAGE_EMPTY.code, AI_ERRORS.MESSAGE_EMPTY.message);
        }

        const auth = (req as any).auth;
        const result = await AiHealthChatService.sendMessage({
            session_id: sessionId,
            message: String(message).trim(),
            user_id: auth?.user_id as string | undefined,
            patient_id: auth?.patient_id as string | undefined,
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: AI_SUCCESS.MESSAGE_SENT,
            data: result,
        });
    });

    /**
     * POST /api/ai/health-chat/sessions/:sessionId/messages/stream
     * Gửi tin nhắn với SSE streaming
     */
    static streamMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const sessionId = String(req.params.sessionId);
        const { message } = req.body;

        if (!message?.trim()) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                code: AI_ERRORS.MESSAGE_EMPTY.code,
                message: AI_ERRORS.MESSAGE_EMPTY.message,
            });
            return;
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const auth = (req as any).auth;
        await AiHealthChatService.streamMessage({
            session_id: sessionId,
            message: String(message).trim(),
            user_id: auth?.user_id as string | undefined,
            patient_id: auth?.patient_id as string | undefined,
            res,
        });
    };

    /**
     * PATCH /api/ai/health-chat/sessions/:sessionId/complete
     * Kết thúc phiên tư vấn
     */
    static completeSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = String(req.params.sessionId);
        const auth = (req as any).auth;

        const session = await AiHealthChatService.completeSession(sessionId, auth?.user_id as string | undefined);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: AI_SUCCESS.SESSION_COMPLETED,
            data: session,
        });
    });

    /**
     * DELETE /api/ai/health-chat/sessions/:sessionId
     * Xóa phiên tư vấn
     */
    static deleteSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = String(req.params.sessionId);
        const auth = (req as any).auth;

        await AiHealthChatService.deleteSession(sessionId, auth?.user_id as string | undefined);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: AI_SUCCESS.SESSION_DELETED,
        });
    });

    /**
     * PATCH /api/ai/health-chat/sessions/:sessionId/messages/:messageId/feedback
     * Đánh giá chất lượng tin nhắn AI
     */
    static submitFeedback = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = String(req.params.sessionId);
        const messageId = String(req.params.messageId);
        const { feedback, note } = req.body;

        if (!['GOOD', 'BAD'].includes(feedback)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_FEEDBACK', 'feedback phải là GOOD hoặc BAD.');
        }

        await AiHealthChatService.submitFeedback(messageId, sessionId, feedback, note);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: AI_SUCCESS.FEEDBACK_SUBMITTED,
        });
    });
}
