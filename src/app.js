/**
 * @fileoverview Express application setup for the LTraffic Admin API.
 * Registers all middleware (security, CORS, logging, rate limiting),
 * mounts static file serving, Swagger UI, and all API routes.
 *
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const logger = require('./config/logger');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Set secure HTTP response headers (XSS, MIME sniffing, etc.)
app.use(helmet());

// Allow all origins — Flutter mobile app connects from any device
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));

// Parse JSON and URL-encoded request bodies up to 10 MB (for base64 images if needed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Pipe Morgan HTTP logs through Winston so they share the same log transport
app.use(morgan('combined', { stream: logger.stream }));

/**
 * Rate limiter: max 300 requests per 15 minutes per IP.
 * Applied to all /api/* routes only — health check is exempt.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// In development, serve uploaded files locally so they can be previewed without Apache.
// In production, Apache serves all files from the PHP web directory (UPLOADS_ROOT) — Node.js
// has no static file role and this block is skipped entirely.
if (process.env.NODE_ENV !== 'production') {
  const uploadsRoot = process.env.UPLOADS_ROOT || './dev-files';
  app.use('/', express.static(uploadsRoot));
}

// Interactive API documentation — accessible at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

/**
 * @route GET /health
 * @desc Health check endpoint — used by load balancers and monitoring tools.
 * Does not require authentication.
 */
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'LTraffic Admin API is running', timestamp: new Date() });
});

// Mount all API routes under /api prefix
app.use('/api', routes);

// 404 handler — catches any unmatched routes
app.use(notFound);

// Global error handler — converts errors to JSON responses
app.use(errorHandler);

module.exports = app;
