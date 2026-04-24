/**
 * @fileoverview HTTP controller for the Vehicle Checks module.
 * Handles listing, retrieval, creation, update, and deletion of vehicle safety checks.
 *
 * @module controllers/vehicle.controller
 */

const VehicleService = require('../services/vehicle.service');

/**
 * GET /api/vehicles
 * Returns a paginated list of vehicle checks.
 * Query params: search (driver name), searchDate (date prefix), page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { search, searchDate, page, limit } = req.query;
    const result = await VehicleService.getAll({
      search,
      searchDate,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehicles/:id
 * Returns a single vehicle check record with all safety check fields.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const check = await VehicleService.getById(req.params.id);
    if (!check) return res.status(404).json({ success: false, message: 'Vehicle check not found.' });
    res.json({ success: true, data: check });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/vehicles
 * Creates a new vehicle check record.
 *
 * @param {import('express').Request} req - Body: vehicle check fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const check = await VehicleService.create(req.body);
    res.status(201).json({ success: true, message: 'Vehicle check created.', data: check });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/vehicles/:id
 * Updates an existing vehicle check record.
 *
 * @param {import('express').Request} req - Params: id, Body: partial vehicle check fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const update = async (req, res, next) => {
  try {
    const check = await VehicleService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Vehicle check updated.', data: check });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/vehicles/:id
 * Permanently deletes a vehicle check record.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await VehicleService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Vehicle check not found.' });
    res.json({ success: true, message: 'Vehicle check deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
