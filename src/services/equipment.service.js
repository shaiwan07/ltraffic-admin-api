/**
 * @fileoverview Business logic for the Equipment Register module (admin side).
 * Thin wrapper around EquipmentModel — no computed URL fields needed
 * as equipment records do not have direct file attachments on the main record
 * (documents are handled separately via the document module).
 *
 * @module services/equipment.service
 */

const EquipmentModel = require('../models/equipment.model');

/**
 * Returns a paginated list of equipment items.
 *
 * @param {object} query - Filters: search, searchIdent, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => EquipmentModel.findAll(query);

/**
 * Returns a single equipment item by ID.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => EquipmentModel.findById(id);

/**
 * Creates a new equipment record and returns the saved item.
 *
 * @param {object} fields - Equipment data.
 * @returns {Promise<object>}
 */
const create = async (fields) => {
  const id = await EquipmentModel.create(fields);
  return EquipmentModel.findById(id);
};

/**
 * Updates an existing equipment record and returns the refreshed item.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const update = async (id, fields) => {
  await EquipmentModel.update(id, fields);
  return EquipmentModel.findById(id);
};

/**
 * Permanently deletes an equipment record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => EquipmentModel.remove(id);

module.exports = { getAll, getById, create, update, remove };
