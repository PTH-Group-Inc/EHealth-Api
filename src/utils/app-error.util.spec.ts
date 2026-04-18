import { AppError } from './app-error.util';

describe('AppError Utility', () => {
    it('should create a basic operational error with correct properties', () => {
        const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.httpCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('Resource not found');
        expect(error.isOperational).toBe(true); // default
        expect(error.context).toBeUndefined();
    });

    it('should mark non-operational (system) errors correctly', () => {
        const error = new AppError(500, 'DB_FAILURE', 'Database connection lost', false, {
            module: 'UserService.findById',
        });

        expect(error.isOperational).toBe(false);
        expect(error.context?.module).toBe('UserService.findById');
    });

    it('should capture stack trace correctly', () => {
        const error = new AppError(500, 'SERVER_ERROR', 'Internal Error');
        expect(error.stack).toBeDefined();
    });

    it('should accept optional context data', () => {
        const error = new AppError(409, 'CONFLICT', 'Duplicate email', true, {
            module: 'PatientService.create',
            data: { email: 'test@example.com' },
        });

        expect(error.context?.module).toBe('PatientService.create');
        expect(error.context?.data).toEqual({ email: 'test@example.com' });
    });
});
