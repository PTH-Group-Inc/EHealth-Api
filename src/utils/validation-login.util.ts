import { AUTH_ERRORS } from '../constants/auth-error.constant';

export type LoginIdentifierType = 'EMAIL' | 'PHONE';

export class ValidationLogin {
    static validateLoginInput(identifier: string, password: string, type: LoginIdentifierType): void {
        if (!identifier || !password) {
            throw AUTH_ERRORS.INVALID_INPUT;
        }

        if (password.length < 6) {
            throw AUTH_ERRORS.INVALID_PASSWORD_FORMAT;
        }

        if (type === 'EMAIL' && !this.isValidEmail(identifier)) {
            throw AUTH_ERRORS.INVALID_EMAIL_FORMAT;
        }

        if (type === 'PHONE' && !this.isValidPhone(identifier)) {
            throw AUTH_ERRORS.INVALID_PHONE_FORMAT;
        }
    }

    private static isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private static isValidPhone(phone: string): boolean {
        return /^[0-9]{9,15}$/.test(phone);
    }
}