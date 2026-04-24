import cron from "node-cron";
import { UserSessionRepository } from "../repository/Core/auth_user-session.repository";
import { AUTH_CONSTANTS } from "../constants/auth.constant";
import logger from '../config/logger.config';


export class SessionCleanup {
    static startSessionCleanupJob() {
        this.runCleanup();

        cron.schedule(AUTH_CONSTANTS.SESSION.CLEANUP_CRON, () => {
            this.runCleanup();
        });
    }

    private static async runCleanup() {
        try {
            const deletedCount = await UserSessionRepository.revokeExpiredSessions(
                AUTH_CONSTANTS.SESSION.IDLE_TIMEOUT_DAYS
            );

            if (deletedCount > 0) {
                logger.info(`✅ Cron Job: Đã thu hồi ${deletedCount} session hết hạn.`);
            } else {

            }
        } catch (error) {
            logger.error("❌ Cron Job Error:", error);
        }
    }
}