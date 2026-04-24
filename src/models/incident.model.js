/**
 * @fileoverview Data-access layer for the healthsafety table (H&S incidents).
 * Provides paginated listing with status/name/date filters, single-record
 * lookup, create, update, delete, and status-change operations.
 *
 * @module models/incident.model
 */

const db = require('../config/db');

/**
 * Returns a paginated list of incidents with optional filters.
 *
 * @param {object} [options]
 * @param {string} [options.status] - 'open' or 'closed' to filter by status.
 * @param {string} [options.search] - Partial match on operativesname.
 * @param {string} [options.searchDate] - Partial match on arrival_datetime (e.g. "2024-05").
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ status, search, searchDate, page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (status === 'open') { conditions.push("status = 'Open'"); }
  else if (status === 'closed') { conditions.push("status = 'Closed'"); }

  if (search) {
    conditions.push('operativesname LIKE ?');
    params.push(`${search}%`);
  }
  if (searchDate) {
    conditions.push('arrival_datetime LIKE ?');
    params.push(`${searchDate}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [rows] = await db.query(
    `SELECT * FROM healthsafety ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM healthsafety ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Finds a single incident by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM healthsafety WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new incident record.
 * arrival_datetime must be provided as a formatted datetime string.
 *
 * @param {object} fields
 * @param {string} fields.operativesname
 * @param {string} fields.type
 * @param {string} fields.location
 * @param {string} fields.reportedby
 * @param {string} fields.report
 * @param {string} fields.arrival_datetime
 * @param {string} [fields.status='Open']
 * @param {string|null} [fields.image]
 * @returns {Promise<number>} New record ID.
 */
const create = async (fields) => {
  const {
    operativesname, type, location, reportedby, report,
    arrival_datetime, status, image,
  } = fields;
  const [result] = await db.query(
    `INSERT INTO healthsafety
     (operativesname, type, location, reportedby, report, arrival_datetime, status, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [operativesname, type, location, reportedby, report, arrival_datetime, status || 'Open', image || null]
  );
  return result.insertId;
};

/**
 * Updates allowed fields on an existing incident record.
 * Only keys present in the allowed list are written to the database.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<boolean>} True if at least one row was affected.
 */
const update = async (id, fields) => {
  const allowed = ['operativesname', 'type', 'location', 'reportedby', 'report', 'arrival_datetime', 'status', 'image'];
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
  const [result] = await db.query(`UPDATE healthsafety SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

/**
 * Deletes an incident record permanently.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM healthsafety WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Updates only the status field of an incident (Open / Closed).
 * Used by the admin open/close actions without requiring a full update payload.
 *
 * @param {number} id
 * @param {string} status - 'Open' or 'Closed'.
 * @returns {Promise<boolean>}
 */
const updateStatus = async (id, status) => {
  const [result] = await db.query('UPDATE healthsafety SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove, updateStatus };
