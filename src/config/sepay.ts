import { env } from './env';

export interface SepayConfig {
    merchantId: string;
    apiKey: string;
    webhookSecret: string;
    environment: string;
    bankAccount: string;
    bankName: string;
    vaAccount: string;
    qrBaseUrl: string;
    apiBaseUrl: string;
}

/** Đọc cấu hình SePay từ centralized config */
export function getSepayConfig(): SepayConfig {
    return {
        merchantId: env.sepay.merchantId,
        apiKey: env.sepay.apiKey,
        webhookSecret: env.sepay.webhookSecret,
        environment: env.sepay.environment,
        bankAccount: env.sepay.bankAccount,
        bankName: env.sepay.bankName,
        vaAccount: env.sepay.vaAccount,
        qrBaseUrl: 'https://qr.sepay.vn/img',
        apiBaseUrl: 'https://my.sepay.vn/userapi',
    };
}

/**
 * Sinh URL ảnh QR Code thanh toán SePay
 */
export function generateSepayQRUrl(
    vaAccount: string,
    bankName: string,
    amount: number,
    content: string
): string {
    const params = new URLSearchParams({
        acc: vaAccount,
        bank: bankName,
        amount: amount.toString(),
        des: content,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
}
