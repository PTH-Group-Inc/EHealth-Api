import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { SignOffService } from '../../services/EMR/medical-signoff.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SIGNOFF_SUCCESS } from '../../constants/medical-signoff.constant';



export class SignOffController {

    /** API 1: PATCH /api/sign-off/:encounterId/complete */
    static completeEncounter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const roles = (req as any).auth?.roles || [];
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.completeEncounter(encounterId, userId, roles, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.COMPLETED, data });
    });

    /** API 2: POST /api/sign-off/:encounterId/draft-sign */
    static draftSign = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.draftSign(encounterId, req.body, userId, clientIp);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: SIGNOFF_SUCCESS.DRAFT_SIGNED, data });
    });

    /** API 3: POST /api/sign-off/:encounterId/official-sign */
    static officialSign = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.officialSign(encounterId, req.body, userId, clientIp);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: SIGNOFF_SUCCESS.OFFICIAL_SIGNED, data });
    });

    /** API 4: POST /api/sign-off/:encounterId/revoke */
    static revoke = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.revoke(encounterId, req.body, userId, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.REVOKED, data });
    });

    /** API 5: GET /api/sign-off/:encounterId/signatures */
    static getSignatures = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await SignOffService.getSignatures(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.SIGNATURES_FETCHED, data });
    });

    /** API 6: GET /api/sign-off/:encounterId/verify */
    static verify = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.verify(encounterId, userId, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.VERIFIED, data });
    });

    /** API 7: GET /api/sign-off/:encounterId/audit-log */
    static getAuditLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await SignOffService.getAuditLog(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.AUDIT_FETCHED, data });
    });

    /** API 8: GET /api/sign-off/:encounterId/lock-status */
    static getLockStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const encounterId = req.params.encounterId as string;
            const data = await SignOffService.getLockStatus(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.LOCK_STATUS_FETCHED, data });
    });

    /** API 9: GET /api/sign-off/by-doctor/pending */
    static getPending = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const roles = (req as any).auth?.roles || [];
            const data = await SignOffService.getPendingForDoctor(userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.PENDING_FETCHED, data });
    });

    /** API 10: GET /api/sign-off/:encounterId/cosign-status */
    static getCosignStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const encounterId = req.params.encounterId as string;
        const data = await SignOffService.getCosignStatus(encounterId);
        res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lấy trạng thái đồng ký thành công', data });
    });

    /** API 11: POST /api/sign-off/:encounterId/cosign/:cosignId */
    static cosign = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const encounterId = req.params.encounterId as string;
        const cosignId = req.params.cosignId as string;
        const userId = (req as any).auth?.user_id;
        const roles = (req as any).auth?.roles || [];
        const clientIp = req.ip || req.socket.remoteAddress || null;
        const data = await SignOffService.cosign(encounterId, cosignId, userId, roles, clientIp);
        res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đồng ký thành công', data });
    });

    /** API 12: POST /api/sign-off/:encounterId/waive-cosign/:cosignId */
    static waiveCosign = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const encounterId = req.params.encounterId as string;
        const cosignId = req.params.cosignId as string;
        const userId = (req as any).auth?.user_id;
        const roles = (req as any).auth?.roles || [];
        const clientIp = req.ip || req.socket.remoteAddress || null;
        const reason = req.body.reason;
        if (!reason) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REASON', 'Vui lòng cung cấp lý do miễn đồng ký');
        const data = await SignOffService.waiveCosign(encounterId, cosignId, userId, roles, clientIp, reason);
        res.status(HTTP_STATUS.OK).json({ success: true, message: 'Miễn đồng ký thành công', data });
    });
}
