import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.isFinite(port) ? port : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,

  // optional tuning
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,

  // Nếu DB remote yêu cầu SSL => set DB_SSL=true trong .env
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

// Test connect: chỉ chạy trong môi trường development (tránh chạy trong test/CI)
if (process.env.NODE_ENV === "development") {
  (async () => {
    try {
      const client = await pool.connect();
      console.log("✅ Kết nối database thành công");
      client.release();
    } catch (error) {
      console.error("❌ Kết nối database thất bại:", error);
    }
  })();
}

export default pool;
