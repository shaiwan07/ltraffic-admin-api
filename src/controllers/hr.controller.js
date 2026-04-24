/**
 * @fileoverview HTTP controller for the HR Manager module.
 * Handles listing, retrieval, creation, update, and deletion of HR records.
 * Employee photo uploads are handled by multer defined in the route file —
 * req.file.filename holds the saved photo filename when a file is uploaded.
 *
 * @module controllers/hr.controller
 */

const HrService = require('../services/hr.service');

/**
 * GET /api/hr
 * Returns a paginated list of HR records.
 * Each record includes full_name, contact_number, email_address, and photo_url.
 *
 * Query params: search (firstname), searchSurname, page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { search, searchSurname, page, limit } = req.query;
    const result = await HrService.getAll({
      search,
      searchSurname,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/hr/:id
 * Returns a single HR record by its internal database ID.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const record = await HrService.getById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'HR record not found.' });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/hr
 * Creates a new HR record. Accepts multipart/form-data for optional photo upload.
 *
 * @param {import('express').Request} req - Body: HR fields + optional photoimage file
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    // Store without the 'admin/' prefix to match the PHP convention: employeephoto/filename.jpg
    if (req.file) fields.photoimage = `employeephoto/${req.file.filename}`;
    const record = await HrService.create(fields);
    res.status(201).json({ success: true, message: 'HR record created.', data: record });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/hr/:id
 * Updates an existing HR record. Accepts multipart/form-data for optional photo replacement.
 *
 * @param {import('express').Request} req - Params: id, Body: partial HR fields + optional photo
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const update = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    // Store without the 'admin/' prefix to match the PHP convention: employeephoto/filename.jpg
    if (req.file) fields.photoimage = `employeephoto/${req.file.filename}`;
    const record = await HrService.update(req.params.id, fields);
    res.json({ success: true, message: 'HR record updated.', data: record });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/hr/:id
 * Permanently deletes an HR record.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await HrService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'HR record not found.' });
    res.json({ success: true, message: 'HR record deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
