import { randomUUID } from 'crypto';

export class SessionIdUtil {
    /*
     * Tạo session ID mới
    */
    static generate(accountId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `SES_${datePart}_${accountId}_${randomUUID()}`;
    }


}