/**
 * @fileoverview Authentication and authorisation middleware for the LTraffic Admin API.
 *
 * authenticate — verifies the JWT Bearer token and ensures the caller is an admin user.
 * authorize    — further restricts a route to a specific subset of admin levels.
 *
 * Admin user levels (stored as PHP-serialised integers in login_users.user_level):
 *   1 = Admin (full access)
 *   4 = Admin1 (read + write, no user management)
 *   7 = Admin2 (read-only)
 *   8 = Essex Supervisor (read + approve timesheets)
 *
 * @module middlewares/auth.middleware
 */

const jwt = require('jsonwebtoken');

/** All user levels permitted to call admin API endpoints. */
const ADMIN_LEVELS = [1, 4, 7, 8];

/**
 * Middleware: validates the Authorization Bearer token.
 * - Rejects requests with no token (401).
 * - Rejects tokens belonging to non-admin users (403).
 * - Populates req.user with the decoded JWT payload on success.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Even if the JWT is valid, reject it if the user is not an admin
    if (!ADMIN_LEVELS.includes(decoded.level)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    // Provide a specific message for expired tokens so the client can refresh
    const message = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ success: false, message });
  }
};

/**
 * Middleware factory: restricts a route to the specified admin levels.
 * Must be used after authenticate (relies on req.user being set).
 *
 * @param {...number} levels - Permitted user level IDs.
 * @returns {import('express').RequestHandler}
 */
const authorize = (...levels) => {
  return (req, res, next) => {
    if (!levels.includes(req.user.level)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

/** Write access: Admin (1) and Admin1 (4) only. */
const adminOnly = authorize(1, 4);

/** Read access: all four admin levels. */
const adminAll = authorize(1, 4, 7, 8);

/** Write + approve: Admin (1), Admin1 (4), and Essex Supervisor (8). */
const adminAndSuper = authorize(1, 4, 8);

module.exports = { authenticate, authorize, adminOnly, adminAll, adminAndSuper };
