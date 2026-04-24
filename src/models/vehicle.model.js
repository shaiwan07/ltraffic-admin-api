/**
 * @fileoverview Data-access layer for the vehicle table (vehicle safety checks).
 *
 * Note: the vehicle table does NOT have a confirmed or status column.
 * All records are treated equally — there is no open/closed distinction
 * for vehicle checks in the admin panel.
 *
 * @module models/vehicle.model
 */

const db = require('../config/db');

/**
 * Returns a paginated list of vehicle checks with optional filters.
 *
 * @param {object} [options]
 * @param {string} [options.search] - Partial match on drivername.
 * @param {string} [options.searchDate] - Partial match on arrival_datetime (e.g. "2024-05").
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ search, searchDate, page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('drivername LIKE ?');
    params.push(`${search}%`);
  }
  if (searchDate) {
    conditions.push('arrival_datetime LIKE ?');
    params.push(`${searchDate}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [rows] = await db.query(
    `SELECT * FROM vehicle ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM vehicle ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Finds a single vehicle check by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM vehicle WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new vehicle check record.
 *
 * @param {object} fields
 * @param {string} fields.drivername
 * @param {string} fields.vehiclereg
 * @param {number} fields.mileage
 * @param {string} fields.arrival_datetime
 * @param {string} fields.vehiclecondition
 * @param {string} fields.safe - Overall safety assessment.
 * @param {string} [fields.routeplanned]
 * @param {string} [fields.roadconditions]
 * @param {string} [fields.dressedforweather]
 * @returns {Promise<number>} New record ID.
 */
const create = async (fields) => {
  const {
    drivername, vehiclereg, mileage, arrival_datetime,
    vehiclecondition, safe, routeplanned, roadconditions, dressedforweather,
  } = fields;
  const [result] = await db.query(
    `INSERT INTO vehicle
     (drivername, vehiclereg, mileage, arrival_datetime, vehiclecondition, safe,
      routeplanned, roadconditions, dressedforweather)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [drivername, vehiclereg, mileage, arrival_datetime, vehiclecondition, safe,
     routeplanned || null, roadconditions || null, dressedforweather || null]
  );
  return result.insertId;
};

/**
 * Updates allowed fields on an existing vehicle check.
 * Only keys present in the allowed list are written to the database.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<boolean>}
 */
const update = async (id, fields) => {
  const allowed = [
    'drivername', 'vehiclereg', 'mileage', 'arrival_datetime',
    'vehiclecondition', 'safe', 'routeplanned', 'roadconditions', 'dressedforweather',
  ];
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
  const [result] = await db.query(`UPDATE vehicle SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

/**
 * Permanently deletes a vehicle check record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM vehicle WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };
