import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/postgresdb';
import logger from '../config/logger.config';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Chỉ áp dụng cho các mutating requests (POST, PUT, PATCH, DELETE)
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
        return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (!idempotencyKey) {
        // Tuỳ yêu cầu, có thể throw lỗi bắt buộc hoặc bypass nếu client không gửi.
        // Ở đây ta có thể bypass nếu không có key, hoặc có thể yêu cầu bắt buộc cho POST /appointments
        return next();
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if key exists
        const checkResult = await client.query(
            `SELECT * FROM idempotency_keys WHERE idempotency_key = $1 FOR UPDATE`,
            [idempotencyKey]
        );

        if (checkResult.rows.length > 0) {
            const existingRequest = checkResult.rows[0];

            if (existingRequest.status === 'COMPLETED') {
                await client.query('COMMIT');
                logger.info(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
                // Trả về cached response
                return res.status(existingRequest.response_code).json(existingRequest.response_body);
            }

            if (existingRequest.status === 'PROCESSING') {
                await client.query('COMMIT');
                logger.warn(`[Idempotency] Concurrent request detected for key: ${idempotencyKey}`);
                return res.status(409).json({
                    success: false,
                    message: "Request đang được xử lý. Vui lòng không thực hiện lại.",
                });
            }
        }

        // Insert new processing record
        await client.query(
            `INSERT INTO idempotency_keys (idempotency_key, http_method, endpoint, user_id, status)
             VALUES ($1, $2, $3, $4, 'PROCESSING')`,
            [idempotencyKey, req.method, req.originalUrl, (req as any).user?.id || null]
        );
        await client.query('COMMIT');

        // Intercept response để lưu kết quả
        const originalSend = res.send;
        let responseBody: any;

        res.send = function (body?: any): Response {
            responseBody = body;
            return originalSend.call(this, body);
        };

        res.on('finish', async () => {
            // Sau khi response được gửi xong, update record thành COMPLETED
            try {
                let parsedBody = null;
                if (responseBody) {
                    try {
                        parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                    } catch (e) {
                        parsedBody = { data: 'unparseable' };
                    }
                }

                await pool.query(
                    `UPDATE idempotency_keys 
                     SET status = 'COMPLETED', response_code = $1, response_body = $2 
                     WHERE idempotency_key = $3`,
                    [res.statusCode, parsedBody, idempotencyKey]
                );
            } catch (error) {
                logger.error(`[Idempotency] Failed to update key status: ${idempotencyKey}`, error);
            }
        });

        next();
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[Idempotency] Error processing key: ${idempotencyKey}`, error);
        next(error);
    } finally {
        client.release();
    }
};
