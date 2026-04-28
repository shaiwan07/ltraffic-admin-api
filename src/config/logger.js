/**
 * @fileoverview Winston logger for the LTraffic Admin API.
 * Console-only logging — IIS/iisnode captures stdout on the server.
 * @module config/logger
 */

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors, splat } = format;

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

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  transports: [new transports.Console({ format: consoleFormat })],
});

logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
