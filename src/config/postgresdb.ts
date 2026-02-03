import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const connectDB = async () => {
    try {
        await pool.connect();
        console.log('✅ Kết nối PostgreSQL thành công');
    } catch (error) {
        console.error('❌ Kết nối database thất bại:', error);
        process.exit(1);
    }
};