export const AUTH_CONSTANTS = {
    VERIFY_EMAIL: {             
        EXPIRES_IN_MS: 5 * 60 * 1000, 
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