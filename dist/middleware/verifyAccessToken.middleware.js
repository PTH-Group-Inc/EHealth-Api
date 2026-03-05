"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
const token_util_1 = require("../utils/token.util");
const auth_error_constant_1 = require("../constants/auth-error.constant");
function verifyAccessToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            throw auth_error_constant_1.AUTH_ERRORS.UNAUTHORIZED;
        }
        const token = authHeader.split(" ")[1];
        const payload = token_util_1.TokenUtil.verifyAccessToken(token);
        req.auth = {
            user_id: payload.sub,
            roles: payload.roles,
            sessionId: payload.sessionId,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            code: "AUTH_401",
            message: "Unauthorized",
        });
    }
}
