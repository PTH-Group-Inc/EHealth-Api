import { randomUUID } from "crypto";
import { ClientInfo } from "../models/auth_user-session.model";
import { UserSessionRepository } from "../repository/auth_user-session.repository";
import { SecurityUtil } from "./auth-security.util";

export class AuthSessionUtil {
    /*
     * Tạo hoặc cập nhật user session
     */
    static async upsertSession(accountId: string, refreshTokenHash: string, clientInfo: ClientInfo,) {
        const expiredAt = SecurityUtil.getRefreshTokenExpiredAt();
        const existingSession = await UserSessionRepository.findByAccountAndDevice(
            accountId,
            clientInfo.deviceId!,
        );
        if (existingSession) {
            await UserSessionRepository.updateSessionBySessionId(
                existingSession.sessionId,
                {
                    refreshTokenHash,
                    ipAddress: clientInfo.ip,
                    userAgent: clientInfo.userAgent,
                    expiredAt,
                },
            );
            return;
        }
        await UserSessionRepository.createSession({
            sessionId: this.generate(accountId),
            accountId,
            refreshTokenHash,
            deviceId: clientInfo.deviceId!,
            deviceName: clientInfo.deviceName,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            expiredAt,
        });
    }

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
