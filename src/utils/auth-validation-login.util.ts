import { AUTH_ERRORS } from '../constants/auth-error.constant';

export type LoginIdentifierType = 'EMAIL' | 'PHONE';

export class ValidationLogin {
    /*
     * Xác thực đầu vào đăng nhập
     */
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

    /*
     * Kiểm tra định dạng email
     */
    private static isValidEmail(email: string): boolean {
        if (!email) return false;

        const normalizedEmail = email.trim().toLowerCase();
        
        const emailRegex =
            /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

        return emailRegex.test(normalizedEmail);
    }

    /*
     * Kiểm tra định dạng số điện thoại
     */
    private static isValidPhone(phone: string): boolean {
        if (!phone) return false;

        const normalizedPhone = phone
            .replace(/\s+/g, '')
            .replace(/[-()]/g, '');

        const vnPhoneRegex = /^(0\d{9}|(\+84)\d{9})$/;

        const internationalPhoneRegex = /^\+\d{10,15}$/;

        return (
            vnPhoneRegex.test(normalizedPhone) ||
            internationalPhoneRegex.test(normalizedPhone)
        );
    }
}