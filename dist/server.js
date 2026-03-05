"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const postgresdb_1 = require("./config/postgresdb");
const PORT = process.env.PORT || 3000;
let server;
// Khởi động ứng dụng
const startServer = async () => {
    await (0, postgresdb_1.connectDB)();
    server = app_1.default.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
};
startServer();
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang tiến hành tắt server an toàn...`);
    if (server) {
        server.close(async (err) => {
            if (err) {
                console.error('❌ Lỗi khi tắt HTTP Server:', err);
                process.exit(1);
            }
            console.log('✅ Đã tắt HTTP Server (Không nhận thêm Request mới).');
            await (0, postgresdb_1.closeDB)();
            console.log('👋 Tạm biệt! Graceful shutdown hoàn tất.');
            process.exit(0);
        });
    }
    else {
        await (0, postgresdb_1.closeDB)();
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
