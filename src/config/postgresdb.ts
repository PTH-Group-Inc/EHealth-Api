import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'postgres_db' ||'localhost',
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
});
  
(async () => {
  try {
    const client = await pool.connect(); 
    console.log('✅ Kết nối database thành công');
    client.release();
  } catch (error) {
    console.error('❌ Kết nối database thất bại:', error);
  }
})();

export default pool;
