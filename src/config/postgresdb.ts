import { Pool } from 'pg';
import { env } from './env';
import logger from './logger.config';
import { dbPoolActiveConnections } from './metrics';

export const pool = new Pool({
    user: env.db.user,
    host: env.db.host,
    database: env.db.name,
    password: env.db.password,
    port: env.db.port,
    max: env.db.poolSize,
    idleTimeoutMillis: env.db.idleTimeoutMs,
    connectionTimeoutMillis: env.db.connectionTimeoutMs,
});

if (env.db.poolSize > 20) {
    logger.warn(`⚠️ Cảnh báo: DB_POOL_SIZE đang được set là ${env.db.poolSize}, lớn hơn 20. Hãy đảm bảo DB instance (PostgreSQL) có thể chịu tải được.`);
}

setInterval(() => {
    dbPoolActiveConnections.set(pool.totalCount - pool.idleCount);
}, 10000);

pool.on('error', (err) => {
    logger.error('❌ Lỗi PostgreSQL Pool ngầm:', err.message);
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        logger.info('✅ Kết nối PostgreSQL thành công');
        client.release();
    } catch (error) {
        logger.error('❌ Kết nối database thất bại:', error);
        process.exit(1);
    }
};

export const closeDB = async () => {
    try {
        await pool.end();
        logger.info('🔌 Đã đóng kết nối PostgreSQL Pool an toàn.');
    } catch (error) {
        logger.error('❌ Lỗi khi đóng kết nối PostgreSQL:', error);
    }
};