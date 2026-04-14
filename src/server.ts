// ⚡ Import config đầu tiên — tự động load .env theo NODE_ENV
import { env } from './config/env';

import app from './app';
import { connectDB, closeDB } from './config/postgresdb';
import { Server } from 'http';
import { ApiPermissionCacheService } from './services/Core/api-permission-cache.service';
import { AppointmentReminderJob } from './jobs/AppointmentReminder.jobs';
import { NoShowDetectionJob } from './jobs/NoShowDetection.jobs';
import { AutoApproveAppointmentJob } from './jobs/AutoApproveAppointment.jobs';

const PORT = env.PORT;
let server: Server;

// Khởi động ứng dụng
const startServer = async () => {
    await connectDB();
    await ApiPermissionCacheService.initCache();

    server = app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);

        // Khởi động Cron Jobs
        AppointmentReminderJob.startReminderJob();
        NoShowDetectionJob.startJob();
        AutoApproveAppointmentJob.startJob();
    });
};

startServer();

const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang tiến hành tắt server an toàn...`);

    if (server) {
        server.close(async (err) => {
            if (err) {
                console.error('❌ Lỗi khi tắt HTTP Server:', err);
                process.exit(1);
            }

            console.log('✅ Đã tắt HTTP Server (Không nhận thêm Request mới).');

            await closeDB();

            console.log('👋 Tạm biệt! Graceful shutdown hoàn tất.');
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
    console.error('💥 Lỗi không xác định (uncaughtException):', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Lệnh Promise bị từ chối (unhandledRejection):', reason);
    gracefulShutdown('unhandledRejection');
});