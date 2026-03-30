import cron from 'node-cron';
import { AiHealthChatRepository } from '../repository/AI/ai-health-chat.repository';
import { AI_SESSION_EXPIRY_CONFIG } from '../constants/ai-health-chat.constant';

/**
 * Tự đóng phiên AI chat inactive quá 24h.
 * Giải phóng slot cho user (giới hạn 3 phiên ACTIVE đồng thời).
 * Chạy mỗi giờ 1 lần.
 */
export const startAiSessionExpiryJob = (): void => {
    cron.schedule(AI_SESSION_EXPIRY_CONFIG.CRON_EXPRESSION, async () => {
        try {
            const expiredCount = await AiHealthChatRepository.expireInactiveSessions(
                AI_SESSION_EXPIRY_CONFIG.INACTIVE_HOURS
            );
            if (expiredCount > 0) {
                console.log(`[AiSessionExpiry] Expired ${expiredCount} phiên inactive >${AI_SESSION_EXPIRY_CONFIG.INACTIVE_HOURS}h.`);
            }
        } catch (error) {
            console.error('[AiSessionExpiry] Lỗi:', error);
        }
    });
    console.log(`[AiSessionExpiry] Cron job khởi động (${AI_SESSION_EXPIRY_CONFIG.CRON_EXPRESSION}).`);
};
