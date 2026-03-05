"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_token_constant_1 = require("../constants/auth_token.constant");
class TokenUtil {
    /*
     * Tạo access token và refresh token
     * CẬP NHẬT: Thêm tham số sessionId
     */
    static generateAuthTokens(user, sessionId) {
        const payload = {
            sub: user.users_id,
            roles: user.roles,
            sessionId: sessionId, // Thêm sessionId vào payload
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, process.env[auth_token_constant_1.TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV], {
            expiresIn: auth_token_constant_1.TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, process.env[auth_token_constant_1.TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV], {
            expiresIn: auth_token_constant_1.TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN,
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: auth_token_constant_1.TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN_SECONDS,
        };
    }
    /*
     * Xác thực chữ ký của access token
     */
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env[auth_token_constant_1.TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV]);
        }
        catch {
            throw new Error('INVALID_ACCESS_TOKEN');
        }
    }
    /*
     * Xác thực chữ ký của refresh token
     */
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env[auth_token_constant_1.TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV]);
        }
        catch {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
    }
}
exports.TokenUtil = TokenUtil;
