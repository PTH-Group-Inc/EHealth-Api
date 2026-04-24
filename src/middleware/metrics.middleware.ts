import { Request, Response, NextFunction } from 'express';
import { httpRequestCounter, httpRequestDurationHistogram } from '../config/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;

    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });

    httpRequestDurationHistogram.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode,
      },
      durationSeconds
    );
  });

  next();
};
