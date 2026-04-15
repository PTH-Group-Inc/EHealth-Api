import { AppError } from './app-error.util';

describe('AppError Utility', () => {
    it('should create an error with the correct properties', () => {
        const httpCode = 404;
        const code = 'NOT_FOUND';
        const message = 'Resource not found';

        const error = new AppError(httpCode, code, message);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.httpCode).toBe(httpCode);
        expect(error.code).toBe(code);
        expect(error.message).toBe(message);
    });

    it('should capture stack trace correctly', () => {
        const error = new AppError(500, 'SERVER_ERROR', 'Internal Error');
        expect(error.stack).toBeDefined();
    });
});
