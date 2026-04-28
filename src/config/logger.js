/**
 * @fileoverview Winston logger configuration for the LTraffic Admin API.
 * Console logging is always active. File logging (rotating daily) is enabled
 * in development only — IIS/iisnode captures stdout in production.
 *
 * @module config/logger
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, errors, json, splat } = format;

const isDev = process.env.NODE_ENV !== 'production';

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${stack || message}${extra}`;
  })
);

const fileFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const loggerTransports = [new transports.Console({ format: consoleFormat })];

// File logging only in development — IIS/iisnode captures stdout in production
if (isDev) {
  require('winston-daily-rotate-file');
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch (_) {}
  loggerTransports.push(
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  transports: loggerTransports,
});

logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
