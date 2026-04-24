/**
 * @fileoverview Data-access layer for the hr table (employee HR records).
 * Each HR record corresponds to an employee and is linked to login_users
 * via ltrafficid = employeeid.
 *
 * @module models/hr.model
 */

const db = require('../config/db');

/**
 * Returns a paginated list of HR records with optional first name / surname filters.
 * Ordered by employeeid ascending to match the HR area display order.
 *
 * @param {object} [options]
 * @param {string} [options.search] - Partial match on firstname.
 * @param {string} [options.searchSurname] - Partial match on surname.
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ search, searchSurname, page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('firstname LIKE ?');
    params.push(`${search}%`);
  }
  if (searchSurname) {
    conditions.push('surname LIKE ?');
    params.push(`${searchSurname}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [rows] = await db.query(
    `SELECT * FROM hr ${where} ORDER BY employeeid ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM hr ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Finds a single HR record by its primary key (internal auto-increment id).
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM hr WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new HR record.
 * All 26 standard HR fields are required or optional as indicated.
 *
 * @param {object} fields - HR record data.
 * @returns {Promise<number>} New record ID.
 */
const create = async (fields) => {
  const {
    employeeid, firstname, middlename, surname, ltrafficphone, ltrafficemail,
    jobtitle, linemanager, location, date_signed, photoimage,
    startdate, dob, address, nationality, telephone, email,
    contactname1, contacttelephone1, relation1,
    contactname2, contacttelephone2, relation2,
    ninumber, salary, notes,
  } = fields;
  const [result] = await db.query(
    `INSERT INTO hr
     (employeeid, firstname, middlename, surname, ltrafficphone, ltrafficemail, jobtitle, linemanager, location,
      date_signed, photoimage, startdate, dob, address, nationality, telephone, email,
      contactname1, contacttelephone1, relation1, contactname2, contacttelephone2, relation2,
      ninumber, salary, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [employeeid, firstname, middlename, surname, ltrafficphone, ltrafficemail, jobtitle, linemanager, location,
     date_signed, photoimage, startdate, dob, address, nationality, telephone, email,
     contactname1, contacttelephone1, relation1, contactname2, contacttelephone2, relation2,
     ninumber, salary, notes]
  );
  return result.insertId;
};

/**
 * Updates allowed fields on an existing HR record.
 * Only keys present in the allowed list are applied — unknown keys are ignored.
 *
 * @param {number} id
 * @param {object} fields - Partial HR data to update.
 * @returns {Promise<boolean>}
 */
const update = async (id, fields) => {
  const allowed = [
    'employeeid', 'firstname', 'middlename', 'surname', 'ltrafficphone', 'ltrafficemail',
    'jobtitle', 'linemanager', 'location', 'date_signed', 'photoimage',
    'startdate', 'dob', 'address', 'nationality', 'telephone', 'email',
    'contactname1', 'contacttelephone1', 'relation1',
    'contactname2', 'contacttelephone2', 'relation2',
    'ninumber', 'salary', 'notes',
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
  const [result] = await db.query(`UPDATE hr SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

/**
 * Permanently deletes an HR record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM hr WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };
