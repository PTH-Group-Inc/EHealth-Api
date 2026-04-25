export const AUTH_CONSTANTS = {
    VERIFY_EMAIL: {
        EXPIRES_IN_MS: 15 * 60 * 1000,
    },

    RESET_PASSWORD: {
        TOKEN_LENGTH: 32,
        EXPIRES_IN_MS: 15 * 60 * 1000,
    },

    ACCOUNT_STATUS: {
        PENDING: 'PENDING',
        ACTIVE: 'ACTIVE',
        LOCKED: 'LOCKED',
    },

    LOGIN_LIMIT: {
        MAX_ATTEMPTS: 7,
        LOCK_DURATION_MINUTES: 30,
        LOCK_DURATION_MS: 30 * 60 * 1000
    },
    SESSION: {
        IDLE_TIMEOUT_DAYS: 7,
        IDLE_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000,
        CLEANUP_CRON: '0 0 * * *',
    },

    SECURITY: {
        BCRYPT_ROUNDS: 12,
        PASSWORD_MIN_LENGTH: 8,
    },

    RATE_LIMIT: {
        LOGIN: {
            WINDOW_MS: 15 * 60 * 1000, // 15 minutes
            MAX_REQUESTS: 5
        },
        SENSITIVE: {
            WINDOW_MS: 60 * 60 * 1000, // 1 hour
            MAX_REQUESTS: 10
        },
        GLOBAL: {
            WINDOW_MS: 60 * 1000, // 1 minute
            MAX_REQUESTS: 600     // 600 req/phút — cho phép SPA dashboard + polling đồng thời
        },
        POLLING: {
            WINDOW_MS: 60 * 1000, // 1 minute
            MAX_REQUESTS: 60      // 60 req/phút — polling payment-status (~5s/lần = 12 req/phút/tab)
        }
    }

} as const;