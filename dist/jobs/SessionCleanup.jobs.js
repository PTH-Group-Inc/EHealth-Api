"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCleanup = void 0;
const auth_user_session_repository_1 = require("../repository/auth_user-session.repository");
const auth_constant_1 = require("../constants/auth.constant");
class SessionCleanup {
    static startSessionCleanupJob() {
        this.runCleanup();
        const now = new Date();
        const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msToMidnight = night.getTime() - now.getTime();
        setTimeout(() => {
            this.runCleanup();
            setInterval(() => {
                this.runCleanup();
            }, 24 * 60 * 60 * 1000);
        }, msToMidnight);
    }
    static async runCleanup() {
        try {
            const deletedCount = await auth_user_session_repository_1.UserSessionRepository.revokeExpiredSessions(auth_constant_1.AUTH_CONSTANTS.SESSION.IDLE_TIMEOUT_DAYS);
            if (deletedCount > 0) {
                console.log(`✅ Cron Job: Đã thu hồi ${deletedCount} session hết hạn.`);
            }
            else {
            }
        }
        catch (error) {
            console.error("❌ Cron Job Error:", error);
        }
    }
}
exports.SessionCleanup = SessionCleanup;
