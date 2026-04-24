/**
 * @fileoverview HTTP controller for the User Management module.
 * Admins can list, view, create, update, reset passwords,
 * restrict/unrestrict, and delete employee user accounts.
 *
 * @module controllers/user.controller
 */

const UserService = require('../services/user.service');

/**
 * GET /api/users
 * Returns a paginated list of all users. Search matches username, name, email, or ltrafficid.
 * Query params: search, page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await UserService.getAll({
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Returns a single user record by user_id.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const user = await UserService.getById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Creates a new user account. Plain-text password is hashed by the service.
 *
 * @param {import('express').Request} req - Body: username, name, email, password, user_level, etc.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const user = await UserService.create(req.body);
    res.status(201).json({ success: true, message: 'User created.', data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Updates allowed profile fields on a user account.
 *
 * @param {import('express').Request} req - Params: id, Body: partial user fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const update = async (req, res, next) => {
  try {
    const user = await UserService.update(req.params.id, req.body);
    res.json({ success: true, message: 'User updated.', data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/reset-password
 * Allows an admin to set a new password for any user account.
 * The new password is stored as a bcrypt hash.
 *
 * @param {import('express').Request} req - Params: id, Body: { new_password }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resetPassword = async (req, res, next) => {
  try {
    const result = await UserService.resetPassword(req.params.id, req.body.new_password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/restrict
 * Sets or clears the restricted flag on a user account.
 * A restricted user cannot log in to the employee app.
 *
 * @param {import('express').Request} req - Params: id, Body: { restricted: true|false }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const toggleRestrict = async (req, res, next) => {
  try {
    const { restricted } = req.body;
    const user = await UserService.toggleRestrict(req.params.id, restricted);
    const msg = restricted ? 'User restricted.' : 'User unrestricted.';
    res.json({ success: true, message: msg, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Permanently deletes a user account.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await UserService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, resetPassword, toggleRestrict, remove };
