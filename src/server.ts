// ⚡ Import config đầu tiên — tự động load .env theo NODE_ENV 
import { env } from './config/env';

import app from './app';
import { connectDB, closeDB } from './config/postgresdb';
import { Server } from 'http';
import { ApiPermissionCacheService } from './services/Core/api-permission-cache.service';
import { AppointmentReminderJob } from './jobs/AppointmentReminder.jobs';
import { NoShowDetectionJob } from './jobs/NoShowDetection.jobs';
import { AutoApproveAppointmentJob } from './jobs/AutoApproveAppointment.jobs';
import { SessionCleanup } from './jobs/SessionCleanup.jobs';
import logger from './config/logger.config';

const PORT = env.PORT;
let server: Server;

// Khởi động ứng dụng
const startServer = async () => {
    await connectDB();
    await ApiPermissionCacheService.initCache();

    server = app.listen(PORT, () => {
        logger.info(`🚀 Server is running on port ${PORT}`);

        // Khởi động Cron Jobs
        AppointmentReminderJob.startReminderJob();
        NoShowDetectionJob.startJob();
        AutoApproveAppointmentJob.startJob();
        SessionCleanup.startSessionCleanupJob();
    });
};

startServer();

const gracefulShutdown = async (signal: string) => {
    logger.info(`\n🛑 Nhận tín hiệu ${signal}. Đang tiến hành tắt server an toàn...`);

    if (server) {
        server.close(async (err) => {
            if (err) {
                logger.error('❌ Lỗi khi tắt HTTP Server:', { error: err });
                process.exit(1);
            }

            logger.info('✅ Đã tắt HTTP Server (Không nhận thêm Request mới).');

            await closeDB();

            logger.info('👋 Tạm biệt! Graceful shutdown hoàn tất.');
            process.exit(0);
        });
    } else {
        await closeDB();
        process.exit(0);
    }
};

// Lắng nghe tín hiệu từ Hệ điều hành
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Bắt các vòng lặp lỗi không xác định
process.on('uncaughtException', (err) => {
    logger.error(`💥 Lỗi không xác định (uncaughtException): ${err.message || err}`, { stack: err.stack });
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`💥 Lệnh Promise bị từ chối (unhandledRejection): ${reason}`);
    gracefulShutdown('unhandledRejection');
});