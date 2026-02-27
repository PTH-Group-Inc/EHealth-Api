import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';

export class ValidationPatientUtil {
    /**
     * Chuẩn hóa họ tên:
     */
    static normalizeFullName(fullName: string): string {
        if (!fullName) return '';

        return fullName
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Parse và validate ngày sinh
     */
    static parseAndValidateDateOfBirth(dobInput: string): string {
        if (!dobInput) {
            throw PATIENT_ERROR_CODES.INVALID_DOB;
        }

        const trimmedInput = dobInput.trim();
        let formattedDate = '';
        let year: number, month: number, day: number;

        // Hỗ trợ 3 định dạng: YYYY, DD-MM-YYYY, YYYY-MM-DD
        if (trimmedInput.length === 4 && /^\d{4}$/.test(trimmedInput)) {
            year = parseInt(trimmedInput, 10);
            month = 1;
            day = 1;
            formattedDate = `${year}-01-01`;

        } else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedInput)) {
            const parts = trimmedInput.split('-');
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);

            const paddedMonth = month.toString().padStart(2, '0');
            const paddedDay = day.toString().padStart(2, '0');
            formattedDate = `${year}-${paddedMonth}-${paddedDay}`;

        } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedInput)) {

            const parts = trimmedInput.split('-');
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);

            const paddedMonth = month.toString().padStart(2, '0');
            const paddedDay = day.toString().padStart(2, '0');
            formattedDate = `${year}-${paddedMonth}-${paddedDay}`;
        } else {
            throw PATIENT_ERROR_CODES.INVALID_DOB;
        }

        // Validate tính hợp lệ của ngày tháng
        const strictDate = new Date(year, month - 1, day);

        if (
            strictDate.getFullYear() !== year ||
            strictDate.getMonth() !== month - 1 ||
            strictDate.getDate() !== day
        ) {
            throw PATIENT_ERROR_CODES.INVALID_DOB;
        }

        //Validate ngày không được ở tương lai
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (strictDate > now) {
            throw PATIENT_ERROR_CODES.INVALID_DOB;
        }

        // Tuổi không quá 130 tuổi
        const ageInMilliseconds = now.getTime() - strictDate.getTime();
        const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
        if (ageInYears > 130) {
            throw PATIENT_ERROR_CODES.INVALID_DOB;
        }

        return formattedDate;
    }


    /**
     * Kiểm tra định dạng số điện thoại
     */
    static validatePhoneNumber(phoneInput: string): string {
        if (!phoneInput) return '';
        
        const trimmedPhone = phoneInput.trim();

        const phoneRegex = /^(0[35789])[0-9]{8}$/;
        
        if (!phoneRegex.test(trimmedPhone)) {
            throw PATIENT_ERROR_CODES.INVALID_PHONE;
        }
        
        return trimmedPhone;
    }

    /**
     * Chuẩn hóa chuỗi: Xóa khoảng trắng thừa ở 2 đầu
     */
    static normalizeString(input: string | undefined | null): string {
        if (!input) return '';
        return input.trim();
    }
}