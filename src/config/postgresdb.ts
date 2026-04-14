import { Pool } from 'pg';
import { env } from './env';

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
    console.error('❌ Lỗi PostgreSQL Pool ngầm:', err.message);
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Kết nối PostgreSQL thành công');
        client.release();
    } catch (error) {
        console.error('❌ Kết nối database thất bại:', error);
        process.exit(1);
    }
};

export const closeDB = async () => {
    try {
        await pool.end();
        console.log('🔌 Đã đóng kết nối PostgreSQL Pool an toàn.');
    } catch (error) {
        console.error('❌ Lỗi khi đóng kết nối PostgreSQL:', error);
    }
};