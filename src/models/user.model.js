/**
 * @fileoverview Data-access layer for the login_users table.
 * Used by both the Auth service (login) and the User management module.
 *
 * Important: user_level in login_users is stored as a PHP-serialised string
 * (e.g. a:1:{i:0;s:1:"4";}) — parseUserLevel extracts the integer from it.
 *
 * @module models/user.model
 */

const db = require('../config/db');

/**
 * Parses a PHP-serialised user_level value into an integer.
 * The legacy PHP app stored user levels as serialised arrays.
 *
 * Example input:  'a:1:{i:0;s:1:"4";}'
 * Example output: 4
 *
 * @param {string|null} serialized - PHP-serialised string from the database.
 * @returns {number|null} Integer level, or null if parsing fails.
 */
const parseUserLevel = (serialized) => {
  if (!serialized) return null;
  const match = serialized.match(/s:\d+:"(\d+)"/);
  return match ? parseInt(match[1]) : null;
};

/**
 * Finds a user by email address.
 * Admin login does NOT filter by restricted=0 here — that check is done
 * in the auth service so admins can still log in even if restricted is set.
 *
 * @param {string} email
 * @returns {Promise<object|null>} User row with parsed level, or null if not found.
 */
const findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM login_users WHERE email = ? LIMIT 1',
    [email]
  );
  if (!rows.length) return null;
  const user = rows[0];
  user.level = parseUserLevel(user.user_level);
  return user;
};

/**
 * Finds a user by username. Used as a fallback when login input
 * does not match any email address.
 *
 * @param {string} username
 * @returns {Promise<object|null>} User row with parsed level, or null if not found.
 */
const findByUsername = async (username) => {
  const [rows] = await db.query(
    'SELECT * FROM login_users WHERE username = ? LIMIT 1',
    [username]
  );
  if (!rows.length) return null;
  const user = rows[0];
  user.level = parseUserLevel(user.user_level);
  return user;
};

/**
 * Finds a user by their primary key.
 *
 * @param {number} id - login_users.user_id
 * @returns {Promise<object|null>} User row with parsed level, or null.
 */
const findById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM login_users WHERE user_id = ? LIMIT 1',
    [id]
  );
  if (!rows.length) return null;
  const user = rows[0];
  user.level = parseUserLevel(user.user_level);
  return user;
};

/**
 * Returns a paginated, optionally filtered list of all users.
 * Search matches against username, name, email, or ltrafficid.
 * Sensitive fields (password) are excluded from the SELECT.
 *
 * @param {object} [options]
 * @param {string} [options.search] - Partial match string.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Records per page.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ search, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  let where = '';
  const params = [];

  if (search) {
    where = 'WHERE (username LIKE ? OR name LIKE ? OR email LIKE ? OR ltrafficid LIKE ?)';
    const s = `${search}%`;
    params.push(s, s, s, s);
  }

  const [rows] = await db.query(
    `SELECT user_id, username, name, email, user_level, ltrafficid, team, vehiclereg, teamup, restricted, onboarding
     FROM login_users ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM login_users ${where}`,
    params
  );

  // Parse serialised level for every row in the result set
  rows.forEach(r => { r.level = parseUserLevel(r.user_level); });

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Creates a new user account.
 * The caller is responsible for hashing the password before passing it in.
 *
 * @param {object} fields - User fields including pre-hashed password.
 * @returns {Promise<number>} New user_id.
 */
const create = async (fields) => {
  const {
    user_level, restricted, username, name, email, password,
    teamup, vehiclereg, ltrafficid, team, name1, onboarding,
  } = fields;
  const [result] = await db.query(
    `INSERT INTO login_users
     (user_level, restricted, username, name, email, password, teamup, vehiclereg, ltrafficid, team, name1, onboarding)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_level, restricted ?? 0, username, name, email, password, teamup, vehiclereg, ltrafficid, team, name1, onboarding]
  );
  return result.insertId;
};

/**
 * Updates allowed fields for a user. Only fields present in the
 * allowed list are applied — unknown keys are silently ignored.
 *
 * @param {number} userId
 * @param {object} fields - Partial user data to update.
 * @returns {Promise<boolean>} True if at least one row was updated.
 */
const update = async (userId, fields) => {
  const allowed = ['name', 'email', 'teamup', 'vehiclereg', 'ltrafficid', 'team', 'name1', 'onboarding', 'restricted', 'user_level'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }
  if (!sets.length) return false;

  params.push(userId);
  const [result] = await db.query(
    `UPDATE login_users SET ${sets.join(', ')} WHERE user_id = ?`,
    params
  );
  return result.affectedRows > 0;
};

/**
 * Updates the stored password hash for a user.
 *
 * @param {number} userId
 * @param {string} hashedPassword - bcrypt hash of the new password.
 * @returns {Promise<boolean>}
 */
const updatePassword = async (userId, hashedPassword) => {
  const [result] = await db.query(
    'UPDATE login_users SET password = ? WHERE user_id = ?',
    [hashedPassword, userId]
  );
  return result.affectedRows > 0;
};

/**
 * Permanently deletes a user record.
 *
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
const remove = async (userId) => {
  const [result] = await db.query('DELETE FROM login_users WHERE user_id = ?', [userId]);
  return result.affectedRows > 0;
};

/**
 * Looks up the human-readable name for a user level from the login_levels table.
 *
 * @param {number} levelId
 * @returns {Promise<string>} Level name (e.g. "Admin", "Admin1"), or "Unknown" if not found.
 */
const getLevelName = async (levelId) => {
  const [rows] = await db.query('SELECT level_name FROM login_levels WHERE id = ? LIMIT 1', [levelId]);
  return rows.length ? rows[0].level_name : 'Unknown';
};

module.exports = { findByEmail, findByUsername, findById, findAll, create, update, updatePassword, remove, getLevelName, parseUserLevel };
