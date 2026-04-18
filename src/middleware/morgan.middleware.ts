import morgan, { StreamOptions } from 'morgan';
import logger from '../config/logger.config';

// Định tuyến log HTTP thông qua cấp độ `http` của Winston
const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

// Custom format cho morgan dễ nhìn hơn
const format = ':method :url :status :res[content-length] bytes - :response-time ms';

const morganMiddleware = morgan(format, { stream });

export default morganMiddleware;
