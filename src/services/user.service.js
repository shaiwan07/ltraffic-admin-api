/**
 * @fileoverview Business logic for the User Management module (admin side).
 * Admins can list, view, create, update, reset passwords, restrict/unrestrict,
 * and delete employee user accounts.
 *
 * All passwords are stored as bcrypt hashes (cost 12) through this service.
 *
 * @module services/user.service
 */

const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Returns a paginated list of users.
 *
 * @param {object} query - Filters: search, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => UserModel.findAll(query);

/**
 * Returns a single user by their user_id.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => UserModel.findById(id);

/**
 * Creates a new user account. The plain-text password from the request
 * is hashed with bcrypt before being stored.
 *
 * @param {object} fields - User data including plain-text password.
 * @returns {Promise<object>} The newly created user row.
 */
const create = async (fields) => {
  const hashedPassword = await bcrypt.hash(fields.password, 12);
  const id = await UserModel.create({ ...fields, password: hashedPassword });
  logger.info('Admin created user', { newUserId: id });
  return UserModel.findById(id);
};

/**
 * Updates allowed fields on a user account (no password change here —
 * use resetPassword for that).
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const update = async (id, fields) => {
  await UserModel.update(id, fields);
  return UserModel.findById(id);
};

/**
 * Resets a user's password to a new value supplied by the admin.
 * The new password is stored as a bcrypt hash (cost 12).
 *
 * @param {number} id - user_id of the account to reset.
 * @param {string} newPassword - Plain-text replacement password.
 * @returns {Promise<{success: boolean, message: string}>}
 */
const resetPassword = async (id, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 12);
  await UserModel.updatePassword(id, hashed);
  logger.info('Admin reset user password', { userId: id });
  return { success: true, message: 'Password reset successfully.' };
};

/**
 * Sets or clears the restricted flag on a user account.
 * A restricted user cannot log in to the employee app.
 *
 * @param {number} id - user_id to restrict or unrestrict.
 * @param {boolean} restricted - true to restrict, false to unrestrict.
 * @returns {Promise<object>} Updated user row.
 */
const toggleRestrict = async (id, restricted) => {
  await UserModel.update(id, { restricted: restricted ? 1 : 0 });
  return UserModel.findById(id);
};

/**
 * Permanently deletes a user account.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  logger.info('Admin deleted user', { userId: id });
  return UserModel.remove(id);
};

module.exports = { getAll, getById, create, update, resetPassword, toggleRestrict, remove };
