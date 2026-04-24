/**
 * @fileoverview Business logic for the Incidents module (admin side).
 * Wraps the IncidentModel and adds the image_url computed field
 * so the Flutter client receives a ready-to-use URL instead of a bare filename.
 *
 * @module services/incident.service
 */

const IncidentModel = require('../models/incident.model');
const { fullUrl } = require('../utils/url.helper');

/**
 * Appends image_url to an incident object.
 * The DB stores the full relative path from the employeesarea root
 * (e.g. admin/hsupload/1234567photo.jpg), so no prefix is needed —
 * fullUrl() prepends FILES_BASE_URL directly.
 *
 * @param {object|null} incident
 * @returns {object|null}
 */
const addImageUrl = (incident) => {
  if (!incident) return null;
  return {
    ...incident,
    image_url: incident.image ? fullUrl(incident.image) : null,
  };
};

/**
 * Returns a paginated, optionally filtered list of incidents.
 * Each record includes image_url.
 *
 * @param {object} query - Filters: status, search, searchDate, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => {
  const result = await IncidentModel.findAll(query);
  result.data = result.data.map(addImageUrl);
  return result;
};

/**
 * Returns a single incident by ID, with image_url appended.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => {
  const incident = await IncidentModel.findById(id);
  return addImageUrl(incident);
};

/**
 * Creates a new incident and returns the full saved record with image_url.
 *
 * @param {object} fields - Incident data including optional image filename.
 * @returns {Promise<object>}
 */
const create = async (fields) => {
  const id = await IncidentModel.create(fields);
  return IncidentModel.findById(id).then(addImageUrl);
};

/**
 * Updates an existing incident and returns the refreshed record.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const update = async (id, fields) => {
  await IncidentModel.update(id, fields);
  return IncidentModel.findById(id).then(addImageUrl);
};

/**
 * Permanently deletes an incident.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  return IncidentModel.remove(id);
};

/**
 * Updates only the status field (Open / Closed) and returns the refreshed record.
 * Used by the admin open/close action buttons.
 *
 * @param {number} id
 * @param {string} status - 'Open' or 'Closed'.
 * @returns {Promise<object>}
 */
const updateStatus = async (id, status) => {
  await IncidentModel.updateStatus(id, status);
  return IncidentModel.findById(id).then(addImageUrl);
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
