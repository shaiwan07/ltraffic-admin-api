/**
 * @fileoverview HTTP controller for the Equipment Register module.
 * Handles listing, retrieval, creation, update, and deletion of equipment records.
 *
 * @module controllers/equipment.controller
 */

const EquipmentService = require('../services/equipment.service');

/**
 * GET /api/equipment
 * Returns a paginated list of equipment items.
 * Query params: search (item name), searchIdent (identifier code), page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { search, searchIdent, page, limit } = req.query;
    const result = await EquipmentService.getAll({
      search,
      searchIdent,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/equipment/:id
 * Returns a single equipment record by ID.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const item = await EquipmentService.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/equipment
 * Creates a new equipment record.
 *
 * @param {import('express').Request} req - Body: item, description, ident, allocatedto, date, cond, expiry
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const item = await EquipmentService.create(req.body);
    res.status(201).json({ success: true, message: 'Equipment created.', data: item });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/equipment/:id
 * Updates an existing equipment record.
 *
 * @param {import('express').Request} req - Params: id, Body: partial equipment fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const update = async (req, res, next) => {
  try {
    const item = await EquipmentService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Equipment updated.', data: item });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/equipment/:id
 * Permanently deletes an equipment record.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await EquipmentService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    res.json({ success: true, message: 'Equipment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
