/**
 * @file errorHandler.middleware.ts
 * @description Global Error Handler Middleware — tập trung xử lý toàn bộ lỗi trong ứng dụng.
 *
 * Luồng xử lý:
 *  1. AppError (isOperational=true)  → Lỗi nghiệp vụ → log warn → trả lỗi cho client
 *  2. AppError (isOperational=false) → Lỗi hệ thống  → log error → trả 500
 *  3. Lỗi thư viện phổ biến (JWT, Sequelize/TypeORM, Multer, Zod, ValidationError)
 *     → Chuẩn hóa thành AppError trước khi xử lý
 *  4. Unknown Error                  → log error đầy đủ → trả 500 chung chung
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.config';
import { AppError } from '../utils/app-error.util';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Chuẩn hóa các lỗi từ thư viện thứ ba thành AppError */
function normalizeError(err: any): AppError | null {
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return new AppError(401, 'INVALID_TOKEN', 'Token không hợp lệ.');
    }
    if (err.name === 'TokenExpiredError') {
        return new AppError(401, 'TOKEN_EXPIRED', 'Token đã hết hạn.');
    }
    if (err.name === 'NotBeforeError') {
        return new AppError(401, 'TOKEN_NOT_ACTIVE', 'Token chưa có hiệu lực.');
    }

    // Prisma / TypeORM duplicate key
    if (
        err.code === '23505' || // PostgreSQL unique violation
        err.name === 'QueryFailedError' && err.message?.includes('duplicate key')
    ) {
        return new AppError(409, 'CONFLICT', 'Dữ liệu đã tồn tại, không thể tạo trùng.');
    }

    // Prisma not found
    if (err.name === 'NotFoundError' || err.code === 'P2025') {
        return new AppError(404, 'NOT_FOUND', 'Không tìm thấy bản ghi.');
    }

    // Multer file size
    if (err.code === 'LIMIT_FILE_SIZE') {
        return new AppError(400, 'FILE_TOO_LARGE', 'File tải lên vượt quá giới hạn cho phép.');
    }

    // Express body-parser / JSON parse error
    if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
        return new AppError(400, 'INVALID_JSON', 'Dữ liệu JSON không hợp lệ.');
    }

    // Zod validation
    if (err.name === 'ZodError') {
        const details = err.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return new AppError(422, 'VALIDATION_ERROR', `Dữ liệu không hợp lệ: ${details}`);
    }

    return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    // 1. Thử chuẩn hóa lỗi từ thư viện thứ ba
    const normalizedError = normalizeError(err);
    if (normalizedError) {
        return errorHandler(normalizedError, req, res, next);
    }

    // 2. Xử lý AppError (lỗi đã biết)
    if (err instanceof AppError) {
        const logMeta = {
            code: err.code,
            httpCode: err.httpCode,
            module: err.context?.module,
            data: err.context?.data,
            stack: !err.isOperational ? err.stack : undefined, // Chỉ log stack nếu là lỗi hệ thống
        };

        if (err.isOperational) {
            // Lỗi nghiệp vụ: log ở mức warn (bình thường, không cần alert)
            logger.warn(`[AppError] ${err.code} - ${err.message}`, logMeta);
        } else {
            // Lỗi hệ thống không mong muốn: log error đầy đủ
            logger.error(`[SystemError] ${err.code} - ${err.message}`, logMeta);
        }

        res.status(err.httpCode).json({
            success: false,
            code: err.code,
            message: err.message,
        });
        return;
    }

    // 3. Lỗi không xác định (Unknown Error)
    logger.error(`[UnhandledError] ${req.method} ${req.originalUrl}`, {
        message: err?.message || String(err),
        stack: err?.stack,
        body: req.body,
        params: req.params,
        query: req.query,
        userId: (req as any).auth?.user_id,
    });

    res.status(500).json({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
    logger.warn(`[404] ${req.method} ${req.originalUrl} — Endpoint không tồn tại`);
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Endpoint '${req.originalUrl}' không tồn tại trên hệ thống.`,
    });
}
