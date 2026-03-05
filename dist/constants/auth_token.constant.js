"use strict";
// constants/token.constant.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_CONFIG = void 0;
exports.TOKEN_CONFIG = {
    ACCESS_TOKEN: {
        EXPIRES_IN: '15m',
        EXPIRES_IN_SECONDS: 15 * 60,
        SECRET_ENV: 'JWT_ACCESS_SECRET',
    },
    REFRESH_TOKEN: {
        EXPIRES_IN: '14d',
        EXPIRES_IN_SECONDS: 14 * 24 * 60 * 60,
        SECRET_ENV: 'JWT_REFRESH_SECRET',
    },
};
