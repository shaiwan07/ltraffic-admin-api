/**
 * @fileoverview Business logic for the HR Manager module (admin side).
 * Wraps HrModel and adds computed fields to every HR record:
 *   - full_name:      firstname + surname combined
 *   - contact_number: ltrafficphone (work) falling back to personal telephone
 *   - email_address:  ltrafficemail (work) falling back to personal email
 *   - photo_url:      absolute URL to the employee photo
 *
 * @module services/hr.service
 */

const HrModel = require('../models/hr.model');
const { fullUrl } = require('../utils/url.helper');

/**
 * Transforms a raw HR database row into the API response shape,
 * adding convenience fields that match the Figma design labels.
 *
 * @param {object|null} record - Raw hr table row.
 * @returns {object|null}
 */
const formatHr = (record) => {
  if (!record) return null;
  return {
    ...record,
    // Combined display name used as the primary label in the HR list
    full_name: [record.firstname, record.surname].filter(Boolean).join(' '),
    // Figma shows "Contact Number" — prefer LTraffic work phone, fall back to personal
    contact_number: record.ltrafficphone || record.telephone || null,
    // Figma shows "Email Address" — prefer LTraffic work email, fall back to personal
    email_address: record.ltrafficemail || record.email || null,
    // DB stores the path relative to the admin folder, e.g. employeephoto/AnthonyLouch.jpg
    // Files live at httpdocs/employeesarea/admin/employeephoto/ so we add the 'admin' segment.
    photo_url: record.photoimage ? fullUrl(record.photoimage, 'admin') : null,
  };
};

/**
 * Returns a paginated list of HR records with computed fields.
 *
 * @param {object} query - Filters: search (firstname), searchSurname, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => {
  const result = await HrModel.findAll(query);
  result.data = result.data.map(formatHr);
  return result;
};

/**
 * Returns a single HR record by ID with computed fields.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => {
  const record = await HrModel.findById(id);
  return formatHr(record);
};

/**
 * Creates a new HR record and returns it with computed fields.
 *
 * @param {object} fields - HR data including optional photoimage filename.
 * @returns {Promise<object>}
 */
const create = async (fields) => {
  const id = await HrModel.create(fields);
  return HrModel.findById(id).then(formatHr);
};

/**
 * Updates an existing HR record and returns the refreshed record.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const update = async (id, fields) => {
  await HrModel.update(id, fields);
  return HrModel.findById(id).then(formatHr);
};

/**
 * Permanently deletes an HR record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => HrModel.remove(id);

module.exports = { getAll, getById, create, update, remove };
