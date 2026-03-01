import crypto from 'crypto';

export class IdentifierPatientUtil {
  /**
   * Tạo định danh nội bộ (Khóa chính)
   */
  static generateInternalId(): string {
    return crypto.randomUUID();
  }

  /**
   * Tạo mã bệnh nhân hiển thị
   */
  static generatePatientCode(): string {
    const now = new Date();
    const year = now.getFullYear();

    const timestampPart = Date.now().toString(36).slice(-4).toUpperCase();

    const randomPart = crypto.randomUUID().slice(-5).toUpperCase();

    return `PAT-${year}-${timestampPart}${randomPart}`;
  }
}