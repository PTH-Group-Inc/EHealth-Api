export const AUTH_CONSTANTS = {
    VERIFY_EMAIL: {
        TOKEN_LENGTH: 64,               
        EXPIRES_IN_MS: 24 * 60 * 60 * 1000, 
    },

    RESET_PASSWORD: {
        TOKEN_LENGTH: 32,
        EXPIRES_IN_MS: 15 * 60 * 1000, 
    },

    ACCOUNT_STATUS: {
        PENDING: 'PENDING',
        ACTIVE: 'ACTIVE',
        LOCKED: 'LOCKED',
    } as const 
};