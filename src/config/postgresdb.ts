import { Pool } from 'pg';
import { env } from './env';
import logger from './logger.config';


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