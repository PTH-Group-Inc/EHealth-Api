import { Request, Response, NextFunction } from 'express';
import { PAYMENT_GATEWAY_ERRORS } from '../constants/billing-payment-gateway.constant';

/**
 * Middleware xác thực webhook từ SePay
 */
export const verifySepayWebhook = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
        res.status(401).json({
            success: false,
            ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
        });
        return;
    }

    const apiKey = process.env.SEPAY_API_KEY || '';

    /* SePay format: "Apikey xxx" hoặc "Bearer xxx" */
    const token = authHeader.replace(/^(Apikey|Bearer)\s+/i, '');

    if (token !== apiKey) {
        res.status(401).json({
            success: false,
            ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
        });
        return;
    }

    next();
};
