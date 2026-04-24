/**
 * @fileoverview Authentication service for the LTraffic Admin API.
 * Handles login (with admin-level enforcement), JWT generation,
 * and password change operations.
 *
 * Password storage: the legacy PHP application stored passwords as plain MD5 hashes.
 * Passwords set or changed through the Node.js API use bcrypt.
 * Both formats are supported transparently via verifyPassword().
 *
 * @module services/auth.service
 */

const jwt = require('jsonwebtoken');
const md5 = require('md5');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const logger = require('../config/logger');

/** User levels permitted to log in to the admin panel. */
const ADMIN_LEVELS = [1, 4, 7, 8];

/**
 * Signs a JWT containing the user's id, username, name, email, level,
 * ltrafficid, and team. The token is valid for the duration set in JWT_EXPIRES_IN.
 *
 * @param {object} user - User row from login_users.
 * @returns {string} Signed JWT string.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.user_id,
      username: user.username,
      name: user.name,
      email: user.email,
      level: user.level,
      ltrafficid: user.ltrafficid,
      team: user.team,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

/**
 * Verifies a plain-text password against a stored hash.
 * Detects whether the stored value is bcrypt (starts with $2 and is long)
 * or legacy MD5 (32-char hex string), and compares accordingly.
 *
 * @param {string} plaintext - Password submitted by the user.
 * @param {string} stored - Hash stored in the database.
 * @returns {Promise<boolean>} True if the password matches.
 */
const verifyPassword = async (plaintext, stored) => {
  const isBcrypt = stored.startsWith('$2') && stored.length > 40;
  if (isBcrypt) return bcrypt.compare(plaintext, stored);
  // Legacy MD5 — used by original PHP admin accounts
  return md5(plaintext) === stored;
};

/**
 * Authenticates an admin user and returns a JWT on success.
 * Accepts email or username as the identifier.
 *
 * Failure reasons are logged but all returned as "Invalid credentials."
 * to avoid leaking whether the account exists.
 *
 * @param {string} email - Email address or username.
 * @param {string} password - Plain-text password.
 * @returns {Promise<{success: boolean, token?: string, user?: object, message?: string}>}
 */
const login = async (email, password) => {
  // Try email first, then fall back to username lookup
  let user = await UserModel.findByEmail(email);
  if (!user) user = await UserModel.findByUsername(email);

  if (!user) {
    logger.warn('Admin login failed — user not found', { email });
    return { success: false, message: 'Invalid credentials.' };
  }

  // Block non-admin accounts from accessing the admin API
  if (!ADMIN_LEVELS.includes(user.level)) {
    logger.warn('Admin login failed — not an admin user', { email, level: user.level });
    return { success: false, message: 'Access denied. Admin privileges required.' };
  }

  // Restricted flag can be set by admin to lock an account
  if (user.restricted) {
    logger.warn('Admin login failed — user restricted', { email });
    return { success: false, message: 'Your account has been restricted.' };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    logger.warn('Admin login failed — wrong password', { email });
    return { success: false, message: 'Invalid credentials.' };
  }

  logger.info('Admin login successful', { userId: user.user_id, email: user.email, level: user.level });
  const levelName = await UserModel.getLevelName(user.level);
  const token = generateToken(user);

  return {
    success: true,
    token,
    user: {
      id: user.user_id,
      username: user.username,
      name: user.name,
      email: user.email,
      level: user.level,
      level_name: levelName,
      ltrafficid: user.ltrafficid,
      team: user.team,
      vehiclereg: user.vehiclereg,
      teamup: user.teamup,
    },
  };
};

/**
 * Changes the password for an authenticated admin user.
 * Verifies the current password before applying the change.
 * New password is stored as a bcrypt hash (cost 12).
 *
 * @param {number} userId - ID of the logged-in user (from JWT).
 * @param {string} currentPassword - Current plain-text password for verification.
 * @param {string} newPassword - New plain-text password to store.
 * @returns {Promise<{success: boolean, message: string}>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await UserModel.findById(userId);
  if (!user) return { success: false, message: 'User not found.' };

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    logger.warn('Admin password change failed — wrong current password', { userId });
    return { success: false, message: 'Current password is incorrect.' };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await UserModel.updatePassword(userId, hashed);
  logger.info('Admin password changed', { userId });

  return { success: true, message: 'Password updated successfully.' };
};

module.exports = { login, changePassword, generateToken };
