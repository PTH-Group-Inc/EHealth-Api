"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(httpCode, code, message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.httpCode = httpCode;
        this.code = code;
        // Bắt giữ Stack Trace để thuận tiện cho việc debug
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
