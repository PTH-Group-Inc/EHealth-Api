import { randomUUID } from 'crypto';

/**
 * Auto-generate mã (code) cho entity khi FE không truyền code thủ công.
 * Format: PREFIX-{timestamp_base36}-{random_4_char}
 *
 * Ví dụ:
 *   generateCode('BR')   -> 'BR-LWX5K2-A3F7'
 *   generateCode('DEPT') -> 'DEPT-LWX5K2-B8C1'
 *
 * Đảm bảo unique nhờ timestamp + random suffix; không cần check DB.
 * Dùng khi FE bỏ field "Mã" thủ công khỏi modal Tạo mới.
 */
export function generateCode(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
