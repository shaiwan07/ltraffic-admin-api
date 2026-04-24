/**
 * @fileoverview Data-access layer for the document control tables.
 *
 * Two document areas are managed here:
 *
 * 1. COSHH (Control of Substances Hazardous to Health) — coshh table.
 *    cos1 = reference/filename, cos2 = document link/description, cos3 = version.
 *    PDF files are served from /downloads/coshh/<cos1>.pdf.
 *
 * 2. Equipment Documents — erdocuments table.
 *    Uploaded PDF/image files attached to a specific equipment record (er table).
 *    Linked via erid = equipment primary key.
 *
 * @module models/document.model
 */

const db = require('../config/db');

// ─── COSHH ───────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of COSHH documents.
 * Default limit is 40 as COSHH lists tend to be viewed all at once.
 *
 * @param {object} [options]
 * @param {string} [options.search] - Partial match on cos1 (reference/filename).
 * @param {string} [options.searchLink] - Partial match on cos2 (description/link).
 * @param {number} [options.page=1]
 * @param {number} [options.limit=40]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const coshhFindAll = async ({ search, searchLink, page = 1, limit = 40 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('cos1 LIKE ?');
    params.push(`${search}%`);
  }
  if (searchLink) {
    conditions.push('cos2 LIKE ?');
    params.push(`${searchLink}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [rows] = await db.query(
    `SELECT * FROM coshh ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM coshh ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Finds a single COSHH document by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const coshhFindById = async (id) => {
  const [rows] = await db.query('SELECT * FROM coshh WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new COSHH document entry.
 *
 * @param {object} fields
 * @param {string} fields.cos1 - Reference or base filename (used to build the PDF URL).
 * @param {string} fields.cos2 - Document description or link.
 * @param {string} fields.cos3 - Version identifier.
 * @returns {Promise<number>} New record ID.
 */
const coshhCreate = async (fields) => {
  const { cos1, cos2, cos3 } = fields;
  const [result] = await db.query(
    'INSERT INTO coshh (cos1, cos2, cos3) VALUES (?, ?, ?)',
    [cos1, cos2, cos3]
  );
  return result.insertId;
};

/**
 * Updates allowed COSHH fields.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload (cos1, cos2, cos3).
 * @returns {Promise<boolean>}
 */
const coshhUpdate = async (id, fields) => {
  const sets = [];
  const params = [];
  for (const key of ['cos1', 'cos2', 'cos3']) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }
  if (!sets.length) return false;
  params.push(id);
  const [result] = await db.query(`UPDATE coshh SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

/**
 * Permanently deletes a COSHH record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const coshhRemove = async (id) => {
  const [result] = await db.query('DELETE FROM coshh WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ─── Equipment Documents ──────────────────────────────────────────────────────

/**
 * Returns all documents attached to a specific equipment record.
 *
 * @param {number} equipmentId - er.id of the parent equipment record.
 * @returns {Promise<object[]>}
 */
const erDocFindAll = async (equipmentId) => {
  const [rows] = await db.query(
    'SELECT * FROM erdocuments WHERE erid = ? ORDER BY id ASC',
    [equipmentId]
  );
  return rows;
};

/**
 * Attaches a new document to an equipment record.
 *
 * @param {object} fields
 * @param {number} fields.erid - Parent equipment record ID.
 * @param {string} fields.docname - Display name for the document.
 * @param {string} fields.docfile - Uploaded filename stored in uploads/equipment/.
 * @returns {Promise<number>} New document record ID.
 */
const erDocCreate = async (fields) => {
  const { erid, docname, docfile } = fields;
  const [result] = await db.query(
    'INSERT INTO erdocuments (erid, docname, docfile) VALUES (?, ?, ?)',
    [erid, docname, docfile]
  );
  return result.insertId;
};

/**
 * Permanently deletes an equipment document record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const erDocRemove = async (id) => {
  const [result] = await db.query('DELETE FROM erdocuments WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  coshhFindAll, coshhFindById, coshhCreate, coshhUpdate, coshhRemove,
  erDocFindAll, erDocCreate, erDocRemove,
};
