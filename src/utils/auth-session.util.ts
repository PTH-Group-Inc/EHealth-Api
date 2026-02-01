import { ClientInfo } from '../models/auth_user-session.model';
import { UserSessionRepository } from '../repository/auth_user-session.repository';
import { SecurityUtil } from './security.util';
import { SessionIdUtil } from './session-id.util';

export class AuthSessionHelper {
    static async upsertSession(accountId: string, refreshTokenHash: string, clientInfo: ClientInfo) {
        const expiredAt = SecurityUtil.getRefreshTokenExpiredAt();

        const existingSession = await UserSessionRepository.findByAccountAndDevice(accountId, clientInfo.deviceId!);

        if (existingSession) {
            await UserSessionRepository.updateSessionBySessionId(existingSession.sessionId,
                {
                    refreshTokenHash,
                    ipAddress: clientInfo.ip,
                    userAgent: clientInfo.userAgent,
                    expiredAt,
                }
            );
            return;
        }

        await UserSessionRepository.createSession({
            sessionId: SessionIdUtil.generate(accountId),
            accountId,
            refreshTokenHash,
            deviceId: clientInfo.deviceId!,
            deviceName: clientInfo.deviceName,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            expiredAt,
        });
    }
}