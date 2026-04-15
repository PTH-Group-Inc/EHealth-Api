import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Khai báo các level của log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Hàm lấy level tùy vào môi trường (Dev thì hiện tất cả, Prod chỉ hiện warn/error)
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info'; // Đổi lại thành info cho production để vẫn thấy API request
};

// Định dạng màu
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

// Định dạng log đầu ra
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Transports: nơi xuất log ra
const transports = [
  // Xuất ra Terminal (Console)
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize({ all: true })),
  }),
  // Nhóm file error riêng
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // Nén lại sau khi xoay vòng
    maxSize: '20m', // Độ lớn tối đa mỗi file
    maxFiles: '14d', // Xóa file sau 14 ngày
    level: 'error',
  }),
  // Nhóm folder chung 
  new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }),
];

// Khởi tạo đối tượng logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
