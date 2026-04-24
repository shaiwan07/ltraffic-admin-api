/**
 * @fileoverview Data-access layer for the bulletinnew table (LTraffic Bulletins).
 *
 * The `new` column is a reserved SQL word and must always be backtick-quoted.
 * It acts as an active/inactive flag: 1 = Active, 0 = Inactive.
 *
 * The list query embeds a GROUP_CONCAT subquery to return the names of all
 * users who have acknowledged the bulletin (read_confirm), avoiding N+1 queries
 * on the Flutter client side.
 *
 * @module models/bulletin.model
 */

const db = require('../config/db');

/**
 * Returns a paginated list of bulletins. Each row includes a read_confirm field
 * containing a comma-separated list of names of users who have read it.
 *
 * @param {object} [options]
 * @param {string} [options.search] - Partial match on bulletin title.
 * @param {string} [options.searchRef] - Partial match on bulletin reference code.
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const findAll = async ({ search, searchRef, page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('b.title LIKE ?');
    params.push(`%${search}%`);
  }
  if (searchRef) {
    conditions.push('b.ref LIKE ?');
    params.push(`${searchRef}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  // GROUP_CONCAT subquery retrieves reader names in a single query instead of
  // making a separate request per bulletin
  const [rows] = await db.query(
    `SELECT b.*,
       (SELECT GROUP_CONCAT(lu.name ORDER BY lu.name SEPARATOR ', ')
        FROM bulletinread br
        JOIN login_users lu ON lu.user_id = br.user_id
        WHERE br.bulletin = b.id) AS read_confirm
     FROM bulletinnew b ${where} ORDER BY b.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM bulletinnew b ${where}`,
    params
  );

  return { data: rows, total: countRows[0].total, page, limit };
};

/**
 * Finds a single bulletin by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM bulletinnew WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

/**
 * Creates a new bulletin. arrival_datetime is set to NOW() by the database.
 *
 * @param {object} fields
 * @param {string} fields.title
 * @param {string} fields.ref - Reference code (e.g. LTBULLETIN17).
 * @param {string} fields.description
 * @param {string|null} [fields.image] - Image filename stored in uploads/bulletin/.
 * @param {string|null} [fields.download] - Download file path stored in uploads/bulletin/.
 * @param {number} [fields.new=1] - 1 = Active, 0 = Inactive.
 * @returns {Promise<number>} New bulletin ID.
 */
const create = async (fields) => {
  const { title, ref, description, image, download, new: isNew } = fields;
  const [result] = await db.query(
    'INSERT INTO bulletinnew (title, ref, description, image, download, `new`, arrival_datetime) VALUES (?, ?, ?, ?, ?, ?, NOW())',
    [title, ref, description, image || null, download || null, isNew ?? 1]
  );
  return result.insertId;
};

/**
 * Updates allowed fields on an existing bulletin.
 * `new` is backtick-quoted because it is a reserved SQL keyword.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<boolean>}
 */
const update = async (id, fields) => {
  const allowed = ['title', 'ref', 'description', 'image', 'download', 'new'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`\`${key}\` = ?`);
      params.push(fields[key]);
    }
  }
  if (!sets.length) return false;

  params.push(id);
  const [result] = await db.query(`UPDATE bulletinnew SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

/**
 * Permanently deletes a bulletin.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM bulletinnew WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Returns the list of users who have acknowledged (read) a specific bulletin.
 * Joins bulletinread with login_users to return user_id, name, and email.
 *
 * @param {number} bulletinId
 * @returns {Promise<Array<{user_id: number, name: string, email: string}>>}
 */
const getReaders = async (bulletinId) => {
  const [rows] = await db.query(
    `SELECT lu.user_id, lu.name, lu.email
     FROM bulletinread br
     JOIN login_users lu ON lu.user_id = br.user_id
     WHERE br.bulletin = ?`,
    [bulletinId]
  );
  return rows;
};

module.exports = { findAll, findById, create, update, remove, getReaders };
