import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { TeleRoomService } from '../../services/Remote Consultation/tele-room.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_ROOM_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.3 — Phòng khám trực tuyến
 * 18 handler chia 5 nhóm: Room, Chat, Files, Media, Events
 */
export class TeleRoomController {

    // ═══ NHÓM 1: Room ═══

    /** POST /room/:consultationId/open */
    static openRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.openRoom(String(req.params.consultationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_OPENED, data: result });
    });

    /** POST /room/:consultationId/join */
    static joinRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.joinRoom(String(req.params.consultationId), userId, req.body.device_info);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_JOINED, data: result });
    });

    /** POST /room/:consultationId/leave */
    static leaveRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.leaveRoom(String(req.params.consultationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_LEFT, data: result });
    });

    /** POST /room/:consultationId/close */
    static closeRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.closeRoom(String(req.params.consultationId), userId, req.body.ended_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_CLOSED, data: result });
    });

    /** GET /room/:consultationId */
    static getRoomDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleRoomService.getRoomDetail(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    // ═══ NHÓM 2: Chat ═══

    /** POST /room/:consultationId/messages */
    static sendMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const userRoles = (req as any).user?.roles || [];
            const result = await TeleRoomService.sendMessage(String(req.params.consultationId), userId, req.body, userRoles);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_ROOM_SUCCESS.MESSAGE_SENT, data: result });
    });

    /** GET /room/:consultationId/messages */
    static getMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleRoomService.getMessages(String(req.params.consultationId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** PUT /room/:consultationId/messages/read */
    static markRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const count = await TeleRoomService.markRead(String(req.params.consultationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.MESSAGES_READ, data: { marked_count: count } });
    });

    // ═══ NHÓM 3: Files ═══

    /** POST /room/:consultationId/files */
    static uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.uploadFile(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_ROOM_SUCCESS.FILE_UPLOADED, data: result });
    });

    /** GET /room/:consultationId/files */
    static getFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleRoomService.getFiles(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** DELETE /room/:consultationId/files/:fileId */
    static deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const isAdmin = ((req as any).user?.roles || []).includes('ADMIN');
            await TeleRoomService.deleteFile(String(req.params.consultationId), String(req.params.fileId), userId, isAdmin);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.FILE_DELETED });
    });

    // ═══ NHÓM 4: Media ═══

    /** PUT /room/:consultationId/media */
    static updateMedia = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.updateMedia(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.MEDIA_UPDATED, data: result });
    });

    /** GET /room/:consultationId/participants */
    static getParticipants = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleRoomService.getParticipants(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** POST /room/:consultationId/kick/:userId */
    static kickUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const kickedBy = (req as any).user?.userId;
            await TeleRoomService.kickUser(String(req.params.consultationId), String(req.params.userId), kickedBy);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.PARTICIPANT_KICKED });
    });

    // ═══ NHÓM 5: Events & Stats ═══

    /** GET /room/:consultationId/events */
    static getEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 100, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleRoomService.getEvents(String(req.params.consultationId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
    });

    /** POST /room/:consultationId/network-report */
    static networkReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).user?.userId;
            await TeleRoomService.reportNetwork(String(req.params.consultationId), userId, req.body.quality, req.body.details);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.NETWORK_REPORTED });
    });

    /** GET /room/:consultationId/summary */
    static getRoomSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleRoomService.getRoomSummary(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });

    /** GET /room/active */
    static getActiveRooms = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await TeleRoomService.getActiveRooms();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    });
}
