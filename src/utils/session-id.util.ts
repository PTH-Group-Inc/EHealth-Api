export class SessionIdUtil {
  static generate(accountId: string): string {
    const now = new Date();

    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const datePart = `${yy}${mm}${dd}`;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `SES_${datePart}_${accountId}_${randomPart}`;
  }
}