import { Pool, types } from 'pg';
import { env } from './env';
import logger from './logger.config';
import { dbPoolActiveConnections } from './metrics';

// --- Type parsers ---
// Mặc định driver `pg` trả về NUMERIC/DECIMAL và INT8 dưới dạng string để tránh mất chính xác.
// Trong scope dự án này (ID, count, price tiền VND) các giá trị luôn nằm trong miền số an toàn của JS (Number.MAX_SAFE_INTEGER = 2^53 - 1),
// nên ta cast về number để FE khỏi phải `Number(item.price ?? 0)` mỗi nơi.
// OID 1700 = NUMERIC/DECIMAL
types.setTypeParser(1700, (val: string | null) => (val === null ? null : parseFloat(val)));
// OID 20 = INT8 (bigint)
types.setTypeParser(20, (val: string | null) => (val === null ? null : parseInt(val, 10)));

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