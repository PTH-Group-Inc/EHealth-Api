export const AUTH_CONSTANTS = {
    VERIFY_EMAIL: {             
        EXPIRES_IN_MS: 5 * 60 * 1000, 
    },

    RESET_PASSWORD: {
        TOKEN_LENGTH: 32,
        EXPIRES_IN_MS: 5 * 60 * 1000, 
    },

    ACCOUNT_STATUS: {
        PENDING: 'PENDING',
        ACTIVE: 'ACTIVE',
        LOCKED: 'LOCKED',
    } as const,

    LOGIN_LIMIT: {
        MAX_ATTEMPTS: 5,      
        LOCK_DURATION_MINUTES: 30, 
        LOCK_DURATION_MS: 30 * 60 * 1000 
    }
};