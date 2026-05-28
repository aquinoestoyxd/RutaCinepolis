import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

const logDir = env.LOG_DIR;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  simple(),
);

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'ruta-cinepolis' },
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export const httpLogger = (req: { method: string; url: string; ip?: string }, durationMs: number, status: number): void => {
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  logger.log(level, `${req.method} ${req.url} ${status} ${durationMs}ms`, {
    ip: req.ip,
    type: 'http',
  });
};
