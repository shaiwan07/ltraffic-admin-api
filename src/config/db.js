/**
 * @fileoverview MySQL connection pool for the LTraffic Admin API.
 * Uses mysql2/promise for async/await support.
 * Connection settings are loaded from environment variables.
 *
 * @module config/db
 */

const mysql = require('mysql2/promise');
const logger = require('./logger');

/**
 * Shared connection pool — reused across all requests.
 * waitForConnections: queues requests when all connections are busy.
 * connectionLimit: max 10 simultaneous MySQL connections.
 * timezone: UTC to avoid date/time offset issues between Node.js and MySQL.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'lt_employee',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

// Verify the connection on startup — logs success or failure without crashing the process
pool.getConnection()
  .then(conn => {
    logger.info('MySQL connected', { database: process.env.DB_NAME, host: process.env.DB_HOST });
    conn.release();
  })
  .catch(err => {
    logger.error('MySQL connection failed', { message: err.message });
  });

module.exports = pool;
