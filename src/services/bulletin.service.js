/**
 * @fileoverview Business logic for the Bulletins module (admin side).
 * Wraps BulletinModel and adds three computed fields to every bulletin object:
 *   - status:       derived from the `new` column (1 = Active, 0 = Inactive)
 *   - image_url:    full URL to the bulletin image
 *   - download_url: full URL to the downloadable file
 *
 * read_confirm is returned directly from the model's GROUP_CONCAT subquery.
 *
 * @module services/bulletin.service
 */

const BulletinModel = require('../models/bulletin.model');
const { fullUrl } = require('../utils/url.helper');

/**
 * Transforms a raw bulletin database row into the API response shape.
 *
 * @param {object|null} b - Raw bulletin row from the database.
 * @returns {object|null}
 */
const formatBulletin = (b) => {
  if (!b) return null;
  return {
    ...b,
    // Map the `new` column integer to a human-readable status string
    status: b.new === 1 ? 'Active' : 'Inactive',
    // PHP stores just the filename in the DB; files physically live in employeesarea/bulletin/.
    // Employee web displays from bulletin/ and so does the mobile app.
    image_url: b.image ? fullUrl(b.image, 'bulletin') : null,
    download_url: b.download ? fullUrl(b.download, 'bulletin') : null,
  };
};

/**
 * Returns a paginated list of bulletins, each with computed status,
 * image_url, download_url, and read_confirm (reader names).
 *
 * @param {object} query - Filters: search, searchRef, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => {
  const result = await BulletinModel.findAll(query);
  result.data = result.data.map(formatBulletin);
  return result;
};

/**
 * Returns a single bulletin by ID with all computed fields.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => {
  const bulletin = await BulletinModel.findById(id);
  return formatBulletin(bulletin);
};

/**
 * Returns the list of users who have acknowledged a bulletin.
 * Used by the /bulletins/:id/readers endpoint.
 *
 * @param {number} id - Bulletin ID.
 * @returns {Promise<Array<{user_id: number, name: string, email: string}>>}
 */
const getReaders = async (id) => BulletinModel.getReaders(id);

/**
 * Creates a new bulletin and returns the saved record with computed fields.
 *
 * @param {object} fields - Bulletin data including optional image and download filenames.
 * @returns {Promise<object>}
 */
const create = async (fields) => {
  const id = await BulletinModel.create(fields);
  return BulletinModel.findById(id).then(formatBulletin);
};

/**
 * Updates an existing bulletin and returns the refreshed record.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const update = async (id, fields) => {
  await BulletinModel.update(id, fields);
  return BulletinModel.findById(id).then(formatBulletin);
};

/**
 * Permanently deletes a bulletin.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => BulletinModel.remove(id);

module.exports = { getAll, getById, getReaders, create, update, remove };
