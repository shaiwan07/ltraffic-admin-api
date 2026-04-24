/**
 * @fileoverview Data-access layer for the timesheet table.
 * Each timesheet covers a 7-day working week and stores individual day data
 * in flat columns: date1..date7, hours1..hours7, location1..location7,
 * activity1..activity7, contract1..contract7.
 *
 * @module models/timesheet.model
 */

const db = require('../config/db');

/**
 * Returns a paginated list of timesheets with optional status and name filters.
 *
 * Status filter logic:
 *   'submitted' → shows Submitted AND Rejected (pending admin review)
 *   'approved'  → shows Approved only
 *   'all'       → no status filter (everything)
 *   (default)   → same as 'submitted'
 *
 * @param {object} [options]
 * @param {string} [options.status='submitted'] - Filter mode: 'submitted', 'approved', or 'all'.
 * @param {string} [options.search] - Partial match on operative name.
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ status, search, page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  // Default view shows both Submitted and Rejected so admin sees all pending work
  if (status === 'submitted') {
    conditions.push("(status = 'Submitted' OR status = 'Rejected')");
  } else if (status === 'approved') {
    conditions.push("status = 'Approved'");
  }
  // 'all' has no condition — returns everything

  if (search) {
    conditions.push('name LIKE ?');
    params.push(`${search}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  // Select summary columns only for the list view — full day data is fetched via findById
  const [rows] = await db.query(
    `SELECT id, status, name, ltrafficid, week,
            date1, hours1, location1, activity1, contract1,
            date2, hours2, location2, activity2, contract2,
            date3, hours3, location3, activity3, contract3,
            date4, hours4, location4, activity4, contract4,
            date5, hours5, location5, activity5, contract5,
            date6, hours6, location6, activity6, contract6,
            date7, hours7, location7, activity7, contract7
     FROM timesheet ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM timesheet ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Fetches the full timesheet record by ID, including all 7 day columns.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM timesheet WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new timesheet on behalf of an employee (admin-created).
 * Status is automatically set to 'Submitted'.
 * Each of the 7 day slots is optional — unused days default to null.
 *
 * @param {object} fields - Flat timesheet fields (name, ltrafficid, week, date1..date7, etc.)
 * @returns {Promise<number>} New timesheet ID.
 */
const create = async (fields) => {
  const {
    name, ltrafficid, week,
    date1, hours1, location1, activity1, contract1,
    date2, hours2, location2, activity2, contract2,
    date3, hours3, location3, activity3, contract3,
    date4, hours4, location4, activity4, contract4,
    date5, hours5, location5, activity5, contract5,
    date6, hours6, location6, activity6, contract6,
    date7, hours7, location7, activity7, contract7,
  } = fields;
  const [result] = await db.query(
    `INSERT INTO timesheet
     (name, ltrafficid, week, status,
      date1, hours1, location1, activity1, contract1,
      date2, hours2, location2, activity2, contract2,
      date3, hours3, location3, activity3, contract3,
      date4, hours4, location4, activity4, contract4,
      date5, hours5, location5, activity5, contract5,
      date6, hours6, location6, activity6, contract6,
      date7, hours7, location7, activity7, contract7)
     VALUES (?, ?, ?, 'Submitted',
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?)`,
    [
      name, ltrafficid || null, week,
      date1 || null, hours1 || null, location1 || null, activity1 || null, contract1 || null,
      date2 || null, hours2 || null, location2 || null, activity2 || null, contract2 || null,
      date3 || null, hours3 || null, location3 || null, activity3 || null, contract3 || null,
      date4 || null, hours4 || null, location4 || null, activity4 || null, contract4 || null,
      date5 || null, hours5 || null, location5 || null, activity5 || null, contract5 || null,
      date6 || null, hours6 || null, location6 || null, activity6 || null, contract6 || null,
      date7 || null, hours7 || null, location7 || null, activity7 || null, contract7 || null,
    ]
  );
  return result.insertId;
};

/**
 * Updates the status of a timesheet (Approved / Rejected).
 *
 * @param {number} id
 * @param {string} status - 'Approved' or 'Rejected'.
 * @returns {Promise<boolean>}
 */
const updateStatus = async (id, status) => {
  const [result] = await db.query('UPDATE timesheet SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

/**
 * Permanently deletes a timesheet record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM timesheet WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, updateStatus, remove };
