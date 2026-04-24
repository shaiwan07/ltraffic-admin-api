/**
 * @fileoverview Data-access layer for the er table (Equipment Register).
 * Each row represents a piece of equipment assigned to an operative.
 *
 * @module models/equipment.model
 */

const db = require('../config/db');

/**
 * Returns a paginated list of equipment items with optional filters.
 * Ordered by ident (equipment identifier) ascending.
 *
 * @param {object} [options]
 * @param {string} [options.search] - Partial match on item name.
 * @param {string} [options.searchIdent] - Partial match on equipment identifier code.
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ search, searchIdent, page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('item LIKE ?');
    params.push(`${search}%`);
  }
  if (searchIdent) {
    conditions.push('ident LIKE ?');
    params.push(`${searchIdent}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [rows] = await db.query(
    `SELECT * FROM er ${where} ORDER BY ident ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM er ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Finds a single equipment record by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM er WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new equipment record.
 *
 * @param {object} fields
 * @param {string} fields.item - Item name/type.
 * @param {string} fields.description
 * @param {string} fields.ident - Unique identifier code for the equipment.
 * @param {string} fields.allocatedto - Name of operative it is assigned to.
 * @param {string} fields.date - Allocation/issue date.
 * @param {string} fields.cond - Condition (e.g. Good, Fair, Poor).
 * @param {string} fields.expiry - Expiry or next inspection date.
 * @returns {Promise<number>} New record ID.
 */
const create = async (fields) => {
  const { item, description, ident, allocatedto, date, cond, expiry } = fields;
  const [result] = await db.query(
    `INSERT INTO er (item, description, ident, allocatedto, date, cond, expiry)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item, description, ident, allocatedto, date, cond, expiry]
  );
  return result.insertId;
};

/**
 * Updates allowed fields on an existing equipment record.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<boolean>}
 */
const update = async (id, fields) => {
  const allowed = ['item', 'description', 'ident', 'allocatedto', 'date', 'cond', 'expiry'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }
  if (!sets.length) return false;

  params.push(id);
  const [result] = await db.query(`UPDATE er SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

/**
 * Permanently deletes an equipment record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM er WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };
