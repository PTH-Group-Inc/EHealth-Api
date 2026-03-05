"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pool.on('error', (err) => {
    console.error('❌ Lỗi PostgreSQL Pool ngầm:', err.message);
});
const connectDB = async () => {
    try {
        const client = await exports.pool.connect();
        console.log('✅ Kết nối PostgreSQL thành công');
        client.release();
    }
    catch (error) {
        console.error('❌ Kết nối database thất bại:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const closeDB = async () => {
    try {
        await exports.pool.end();
        console.log('🔌 Đã đóng kết nối PostgreSQL Pool an toàn.');
    }
    catch (error) {
        console.error('❌ Lỗi khi đóng kết nối PostgreSQL:', error);
    }
};
exports.closeDB = closeDB;
