import { SecurityUtil } from "../utils/security.util";
import { UserSessionRepository } from "../repository/auth_user-session.repository";

interface CreateSessionInput {
    accountId: string;
    refreshToken: string;
    deviceId?: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
}

export class SessionUtil {
    /*
     * Tạo mới một user session
     */
    static async createSession(input: CreateSessionInput): Promise<void> {
        const refreshTokenHash = await SecurityUtil.hashToken(input.refreshToken);

        await UserSessionRepository.createSession({
            accountId: input.accountId,
            refreshTokenHash,
            deviceId: input.deviceId,
            deviceName: input.deviceName,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
    }
}
