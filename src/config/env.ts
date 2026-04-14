/**
 * ============================================
 * 🌍 Centralized Environment Configuration
 * ============================================
 *
 * File này là NGUỒN DUY NHẤT (Single Source of Truth) cho toàn bộ config.
 * Tất cả module khác import từ đây, KHÔNG gọi process.env trực tiếp.
 *
 * Cách hoạt động:
 *   1. Đọc NODE_ENV (mặc định: 'development')
 *   2. Load file .env tương ứng: .env.development hoặc .env.production
 *   3. Export object `env` đã typed + validated
 *
 * Sử dụng:
 *   import { env } from './config/env';
 *   console.log(env.PORT);        // number - 3000
 *   console.log(env.isDev);       // boolean - true/false
 *   console.log(env.db.host);     // string  - 'localhost'
 */

import dotenv from 'dotenv';
import path from 'path';

// ─── 1. Xác định môi trường hiện tại ────────────────────────────
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── 2. Load file .env theo môi trường ──────────────────────────
const envFile = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
const result = dotenv.config({ path: envFile });

if (result.error) {
    console.warn(`⚠️  Không tìm thấy file ${envFile}, thử load .env mặc định...`);
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// ─── 3. Helper: đọc biến bắt buộc / tùy chọn ──────────────────
function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`❌ Thiếu biến môi trường bắt buộc: ${key} (file: .env.${NODE_ENV})`);
    }
    return value;
}

function optional(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
}

// ─── 4. Export config object (typed & validated) ────────────────
export const env = {
    // ── Flags môi trường ──
    NODE_ENV,
    isDev: NODE_ENV === 'development',
    isProd: NODE_ENV === 'production',
    isTest: NODE_ENV === 'test',

    // ── Server ──
    PORT: parseInt(optional('PORT', '3000'), 10),
    LOG_LEVEL: optional('LOG_LEVEL', NODE_ENV === 'production' ? 'error' : 'debug'),

    // ── Database ──
    db: {
        host: required('DB_HOST'),
        port: parseInt(optional('DB_PORT', '5432'), 10),
        name: required('DB_NAME'),
        user: required('DB_USER'),
        password: required('DB_PASSWORD'),
        // Production: pool lớn hơn, timeout dài hơn
        poolSize: NODE_ENV === 'production' ? 30 : 10,
        idleTimeoutMs: NODE_ENV === 'production' ? 60000 : 30000,
        connectionTimeoutMs: NODE_ENV === 'production' ? 5000 : 2000,
    },

    // ── JWT ──
    jwt: {
        accessSecret: required('JWT_ACCESS_SECRET'),
        refreshSecret: required('JWT_REFRESH_SECRET'),
    },

    // ── Frontend ──
    frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),

    // ── Email ──
    email: {
        host: optional('EMAIL_HOST', 'smtp.gmail.com'),
        port: parseInt(optional('EMAIL_PORT', '587'), 10),
        user: optional('EMAIL_USER'),
        pass: optional('EMAIL_PASS'),
        from: optional('EMAIL_FROM'),
    },

    // ── Cloudinary ──
    cloudinary: {
        cloudName: optional('CLOUDINARY_CLOUD_NAME'),
        apiKey: optional('CLOUDINARY_API_KEY'),
        apiSecret: optional('CLOUDINARY_API_SECRET'),
    },

    // ── Firebase ──
    firebaseServiceAccount: optional('FIREBASE_SERVICE_ACCOUNT', '{}'),

    // ── SePay Payment ──
    sepay: {
        merchantId: optional('SEPAY_MERCHANT_ID'),
        apiKey: optional('SEPAY_API_KEY'),
        webhookSecret: optional('SEPAY_WEBHOOK_SECRET'),
        environment: optional('SEPAY_ENVIRONMENT', 'SANDBOX'),
        bankAccount: optional('SEPAY_BANK_ACCOUNT'),
        bankName: optional('SEPAY_BANK_NAME'),
        accountHolder: optional('SEPAY_ACCOUNT_HOLDER'),
        vaAccount: optional('SEPAY_VA_ACCOUNT'),
    },

    // ── AI ──
    ai: {
        geminiApiKey: optional('GEMINI_API_KEY'),
        openaiApiKey: optional('OPENAI_API_KEY'),
    },
} as const;

// ─── 5. Log thông tin khởi động ─────────────────────────────────
if (env.isDev) {
    console.log('┌──────────────────────────────────────────────┐');
    console.log('│  🔧 DEVELOPMENT MODE                        │');
    console.log(`│  📄 Loaded: .env.${NODE_ENV}`);
    console.log(`│  🔌 DB: ${env.db.host}:${env.db.port}/${env.db.name}`);
    console.log(`│  🌐 Frontend: ${env.frontendUrl}`);
    console.log(`│  📊 Log level: ${env.LOG_LEVEL}`);
    console.log(`│  💳 SePay: ${env.sepay.environment}`);
    console.log('└──────────────────────────────────────────────┘');
} else {
    console.log(`🚀 [${NODE_ENV.toUpperCase()}] Server starting | DB: ${env.db.host}/${env.db.name}`);
}
