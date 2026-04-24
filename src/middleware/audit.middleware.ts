import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '../repository/Core/audit-log.repository';
import { AuditActionType } from '../models/Core/audit-log.model';
import logger from '../config/logger.config';


export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return next();
    }

    if (req.originalUrl.includes('/refresh-token')) {
        return next();
    }

    const originalSend = res.send;

    res.send = function (body) {
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 300;

        let actionType = AuditActionType.OTHER;
        if (req.method === 'POST') actionType = AuditActionType.CREATE;
        if (req.method === 'PUT' || req.method === 'PATCH') actionType = AuditActionType.UPDATE;
        if (req.method === 'DELETE') actionType = AuditActionType.DELETE;

        if (req.originalUrl.includes('/login')) actionType = AuditActionType.LOGIN;
        
        const customActionType = (req as any).auditActionType;
        if (customActionType) {
            actionType = customActionType;
        }

        if (!isSuccess) {
            actionType = AuditActionType.FAILED_ATTEMPT;
        }

        const parts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
        let moduleIndex = 1;
        if (parts.length > 1 && /^v\d+$/.test(parts[1])) {
            moduleIndex = 2;
        }

        const moduleName = parts[moduleIndex] ? parts[moduleIndex].toUpperCase() : 'SYSTEM_UNKNOWN';
        const lastPart = parts[parts.length - 1];
        const entityId = req.params.id ? String(req.params.id) : (lastPart ? String(lastPart) : undefined);

        const userId = (req as any).auth?.user_id || (req as any).user?.user_id || undefined;
        let safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***';
        if (safeBody.refreshToken) safeBody.refreshToken = '***';

        if (req.file || req.files) {
            safeBody = { _audit_info: 'File upload payload omitted' };
        }

        /**
         * Lấy old_value từ Controller nếu có gắn trước đó.
         */
        const oldValue = (req as any).auditOldValue || null;

        AuditLogRepository.createLog({
            user_id: userId,
            action_type: actionType,
            module_name: moduleName,
            target_id: entityId !== moduleName ? entityId : undefined,
            old_value: oldValue,
            new_value: safeBody,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            status_code: statusCode,
            is_success: isSuccess
        }).catch((e: any) => logger.error('[AUDIT_GUARD_ERROR]', e));

        return originalSend.call(this, body);
    };

    next();
};
