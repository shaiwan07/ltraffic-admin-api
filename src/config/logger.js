/**
 * @fileoverview Winston logger configuration for the LTraffic Admin API.
 * Outputs colourised logs to the console in development, and writes
 * JSON-formatted rotating log files for errors and combined output.
 *
 * Log files are stored in the /logs directory:
 *   - error-YYYY-MM-DD.log   (error level only, kept 30 days)
 *   - combined-YYYY-MM-DD.log (all levels, kept 14 days)
 *
 * @module config/logger
 */

const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, errors, json, splat } = format;

const isDev = process.env.NODE_ENV !== 'production';

const logsDir = path.join(__dirname, '..', '..', 'logs');
try { fs.mkdirSync(logsDir, { recursive: true }); } catch (_) { /* ignore permission errors */ }

/**
 * Console format: coloured, human-readable with timestamp and metadata.
 * Stack traces are printed inline when an Error is logged.
 */
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

/**
 * File format: structured JSON — machine-readable for log aggregation tools.
 */
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

const logger = createLogger({
  // In development, log debug-level and above; in production, info and above
  level: isDev ? 'debug' : 'info',
  transports: [
    new transports.Console({ format: consoleFormat }),
    // Error-only log file, rotated daily, compressed after rotation, kept 30 days
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      zippedArchive: true,
    }),
    // Combined log file (all levels), rotated daily, kept 14 days
    new transports.DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});

/**
 * Morgan-compatible stream — pipes HTTP access logs into Winston
 * at the 'http' level so they appear in combined log files.
 */
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
