/**
 * @fileoverview HTTP controller for the Bulletins module.
 * Handles listing, retrieval, reader list, creation, update, and deletion.
 * Image and download file uploads are handled by multer defined in the route file.
 *
 * @module controllers/bulletin.controller
 */

const BulletinService = require('../services/bulletin.service');

/**
 * GET /api/bulletins
 * Returns a paginated list of bulletins.
 * Each item includes status (Active/Inactive), image_url, download_url,
 * and read_confirm (comma-separated names of users who acknowledged it).
 *
 * Query params: search (title), searchRef (reference code), page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { search, searchRef, page, limit } = req.query;
    const result = await BulletinService.getAll({
      search,
      searchRef,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bulletins/:id
 * Returns a single bulletin with all computed fields.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const bulletin = await BulletinService.getById(req.params.id);
    if (!bulletin) return res.status(404).json({ success: false, message: 'Bulletin not found.' });
    res.json({ success: true, data: bulletin });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bulletins/:id/readers
 * Returns the list of users (user_id, name, email) who have acknowledged this bulletin.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getReaders = async (req, res, next) => {
  try {
    const readers = await BulletinService.getReaders(req.params.id);
    res.json({ success: true, data: readers });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/bulletins
 * Creates a new bulletin. Accepts multipart/form-data for optional
 * image upload (field: image) and downloadable file (field: download).
 *
 * @param {import('express').Request} req - Body: title, ref, description, new + optional files
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    if (req.files?.image?.[0]) fields.image = req.files.image[0].filename;
    if (req.files?.download?.[0]) fields.download = req.files.download[0].filename;
    const bulletin = await BulletinService.create(fields);
    res.status(201).json({ success: true, message: 'Bulletin created.', data: bulletin });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/bulletins/:id
 * Updates an existing bulletin. Accepts multipart/form-data for optional file replacement.
 *
 * @param {import('express').Request} req - Params: id, Body: partial bulletin fields + optional files
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const update = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    if (req.files?.image?.[0]) fields.image = req.files.image[0].filename;
    if (req.files?.download?.[0]) fields.download = req.files.download[0].filename;
    const bulletin = await BulletinService.update(req.params.id, fields);
    res.json({ success: true, message: 'Bulletin updated.', data: bulletin });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/bulletins/:id
 * Permanently deletes a bulletin record.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await BulletinService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Bulletin not found.' });
    res.json({ success: true, message: 'Bulletin deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, getReaders, create, update, remove };
