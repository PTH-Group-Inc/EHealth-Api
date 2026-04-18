import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedicalChatService } from '../../services/Remote Consultation/tele-medical-chat.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { MED_CHAT_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.4 — Trao đổi thông tin y tế trực tuyến
 * 15 handler chia 4 nhóm: Conversations, Messages, Attachments, Stats
 */
export class MedicalChatController {

    // ═══ NHÓM 1: Conversations ═══

    /** POST /conversations */
    static createConversation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const isPatient = roles.includes('PATIENT') && !roles.includes('DOCTOR');
            const result = await MedicalChatService.createConversation(req.body, userId, isPatient);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: MED_CHAT_SUCCESS.CONVERSATION_CREATED, data: result });
    });

    /** GET /conversations */
    static listConversations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                status: req.query.status as string,
                priority: req.query.priority as string,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await MedicalChatService.listConversations(filters, userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** GET /conversations/:conversationId */
    static getConversation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const result = await MedicalChatService.getConversation(String(req.params.conversationId), userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** PUT /conversations/:conversationId/close */
    static closeConversation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await MedicalChatService.closeConversation(String(req.params.conversationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_CHAT_SUCCESS.CONVERSATION_CLOSED });
    });

    /** PUT /conversations/:conversationId/reopen */
    static reopenConversation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await MedicalChatService.reopenConversation(String(req.params.conversationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_CHAT_SUCCESS.CONVERSATION_REOPENED });
    });

    // ═══ NHÓM 2: Messages ═══

    /** POST /conversations/:conversationId/messages */
    static sendMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const result = await MedicalChatService.sendMessage(String(req.params.conversationId), userId, roles, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: MED_CHAT_SUCCESS.MESSAGE_SENT, data: result });
    });

    /** GET /conversations/:conversationId/messages */
    static getMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await MedicalChatService.getMessages(String(req.params.conversationId), userId, roles, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** PUT /conversations/:conversationId/messages/read */
    static markRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const count = await MedicalChatService.markRead(String(req.params.conversationId), userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_CHAT_SUCCESS.MESSAGES_READ, data: { marked_count: count } });
    });

    /** PUT /conversations/:conversationId/messages/:messageId/pin */
    static togglePin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const isPinned = await MedicalChatService.togglePin(String(req.params.conversationId), String(req.params.messageId), userId, roles);
            const msg = isPinned ? MED_CHAT_SUCCESS.MESSAGE_PINNED : MED_CHAT_SUCCESS.MESSAGE_UNPINNED;
            res.status(HTTP_STATUS.OK).json({ success: true, message: msg, data: { is_pinned: isPinned } });
    });

    /** DELETE /conversations/:conversationId/messages/:messageId */
    static deleteMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const isAdmin = ((req as any).user?.roles || []).includes('ADMIN');
            await MedicalChatService.deleteMessage(String(req.params.conversationId), String(req.params.messageId), userId, isAdmin);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_CHAT_SUCCESS.MESSAGE_DELETED });
    });

    /** GET /conversations/:conversationId/messages/pinned */
    static getPinnedMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const result = await MedicalChatService.getPinnedMessages(String(req.params.conversationId), userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 3: Attachments ═══

    /** GET /conversations/:conversationId/attachments */
    static getAttachments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const result = await MedicalChatService.getAttachments(String(req.params.conversationId), userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /conversations/:conversationId/attachments/medical */
    static getMedicalAttachments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await MedicalChatService.getMedicalAttachments(String(req.params.conversationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 4: Stats ═══

    /** GET /unread-count */
    static getUnreadCount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const roles: string[] = (req as any).user?.roles || [];
            const count = await MedicalChatService.getUnreadCount(userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, data: { unread_count: count } });
    });

    /** GET /my-patients */
    static getMyPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await MedicalChatService.getMyPatients(userId);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });
}
