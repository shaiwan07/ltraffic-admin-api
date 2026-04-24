/**
 * @fileoverview Global error handling middleware for the LTraffic Admin API.
 *
 * notFound    — generates a 404 JSON response for unmatched routes.
 * errorHandler — catches all errors passed via next(err) and returns a
 *               consistent JSON error shape. Includes the stack trace in
 *               development for easier debugging.
 *
 * @module middlewares/error.middleware
 */

const logger = require('../config/logger');

/**
 * 404 handler — placed after all routes to catch unmatched requests.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Central error handler — must be registered last with four parameters
 * so Express recognises it as an error-handling middleware.
 *
 * Special case: mysql2 throws AggregateError when it cannot reach the
 * database (e.g. all pool connections fail). We surface this as 503
 * instead of a generic 500 so clients can distinguish DB unavailability.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // AggregateError is thrown by mysql2 when the connection pool cannot reach the DB
  if (err instanceof AggregateError || err.constructor?.name === 'AggregateError') {
    logger.error('Database connection failed (AggregateError)', { url: req.originalUrl });
    return res.status(503).json({ success: false, message: 'Database connection failed. Please try again later.' });
  }

  logger.error(err.message, { url: req.originalUrl, stack: err.stack });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
    // Only expose stack traces in development — never in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
