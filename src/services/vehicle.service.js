/**
 * @fileoverview Business logic for the Vehicle Checks module (admin side).
 * Thin wrapper around VehicleModel — no computed fields are needed
 * because vehicle checks do not have associated image uploads.
 *
 * @module services/vehicle.service
 */

const VehicleModel = require('../models/vehicle.model');

/**
 * Returns a paginated list of vehicle checks.
 *
 * @param {object} query - Filters: search, searchDate, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => VehicleModel.findAll(query);

/**
 * Returns a single vehicle check by ID.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => VehicleModel.findById(id);

/**
 * Creates a new vehicle check and returns the full saved record.
 *
 * @param {object} fields - Vehicle check data.
 * @returns {Promise<object>}
 */
const create = async (fields) => {
  const id = await VehicleModel.create(fields);
  return VehicleModel.findById(id);
};

/**
 * Updates an existing vehicle check and returns the refreshed record.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const update = async (id, fields) => {
  await VehicleModel.update(id, fields);
  return VehicleModel.findById(id);
};

/**
 * Permanently deletes a vehicle check.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => VehicleModel.remove(id);

module.exports = { getAll, getById, create, update, remove };
