import { Request, Response, NextFunction } from 'express';
import { PAYMENT_GATEWAY_ERRORS } from '../constants/billing-payment-gateway.constant';
import { env } from '../config/env';
import crypto from 'crypto';

/**
 * Middleware xác thực webhook từ SePay bằng HMAC
 */
export const verifySepayWebhook = (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-sepay-signature'] || req.headers['x-webhook-signature'] || req.headers['x-signature'];
    const authHeader = req.headers['authorization'] as string;
    const webhookSecret = env.sepay.webhookSecret;

    // Cho phép fallback về Authorization header (Api key) nếu chưa có signature (để tương thích) 
    // Tuy nhiên theo yêu cầu bảo mật, nên ưu tiên kiểm tra HMAC
    if (signature) {
        // Nếu có chữ ký HMAC, thực hiện xác thực HMAC
        const payloadString = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const expectedSignature = hmac.update(payloadString).digest('hex');

        if (signature !== expectedSignature) {
            res.status(401).json({
                success: false,
                ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
                message: "Invalid HMAC signature"
            });
            return;
        }
        return next();
    }

    // Fallback: nếu không có signature, kiểm tra header authorization thông thường (có thể bỏ qua sau này)
    if (!authHeader) {
        res.status(401).json({
            success: false,
            ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
        });
        return;
    }

    const token = authHeader.replace(/^(Apikey|Bearer)\s+/i, '');

    if (token !== webhookSecret) {
        res.status(401).json({
            success: false,
            ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
        });
        return;
    }

    next();
};
