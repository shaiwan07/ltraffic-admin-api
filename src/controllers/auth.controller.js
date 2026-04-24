/**
 * @fileoverview HTTP controller for authentication endpoints.
 * Delegates business logic to AuthService and formats HTTP responses.
 *
 * @module controllers/auth.controller
 */

const AuthService = require('../services/auth.service');

/**
 * POST /api/auth/login
 * Authenticates an admin user and returns a JWT token.
 *
 * @param {import('express').Request} req - Body: { email, password }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    // Service returns success:false for business failures (wrong password, not admin, etc.)
    const status = result.success ? 200 : 401;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 * Allows an authenticated admin to change their own password.
 * Requires the current password for verification.
 *
 * @param {import('express').Request} req - Body: { current_password, new_password }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await AuthService.changePassword(req.user.id, current_password, new_password);
    const status = result.success ? 200 : 400;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the profile of the currently authenticated admin (decoded from JWT).
 * No database query — data comes directly from the token payload.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const me = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { login, changePassword, me };
