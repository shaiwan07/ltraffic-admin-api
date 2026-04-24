/**
 * @fileoverview HTTP controller for the Document Control module.
 * Manages two document areas:
 *   - COSHH sheets (read from /downloads/coshh/ — not uploaded through this API)
 *   - Equipment documents (uploaded PDF/images linked to equipment register entries)
 *
 * @module controllers/document.controller
 */

const DocumentService = require('../services/document.service');

// ─── COSHH ───────────────────────────────────────────────────────────────────

/**
 * GET /api/documents/coshh
 * Returns a paginated list of COSHH documents with file_url for each.
 * Query params: search (reference), searchLink (description), page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const coshhGetAll = async (req, res, next) => {
  try {
    const { search, searchLink, page, limit } = req.query;
    const result = await DocumentService.coshhGetAll({
      search,
      searchLink,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 40,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/coshh/:id
 * Returns a single COSHH document by ID.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const coshhGetById = async (req, res, next) => {
  try {
    const doc = await DocumentService.coshhGetById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'COSHH document not found.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/documents/coshh
 * Creates a new COSHH document entry.
 *
 * @param {import('express').Request} req - Body: { cos1, cos2, cos3 }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const coshhCreate = async (req, res, next) => {
  try {
    const doc = await DocumentService.coshhCreate(req.body);
    res.status(201).json({ success: true, message: 'COSHH document created.', data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/documents/coshh/:id
 * Updates an existing COSHH document entry.
 *
 * @param {import('express').Request} req - Params: id, Body: partial COSHH fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const coshhUpdate = async (req, res, next) => {
  try {
    const doc = await DocumentService.coshhUpdate(req.params.id, req.body);
    res.json({ success: true, message: 'COSHH document updated.', data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/documents/coshh/:id
 * Permanently deletes a COSHH document entry.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const coshhRemove = async (req, res, next) => {
  try {
    const deleted = await DocumentService.coshhRemove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'COSHH document not found.' });
    res.json({ success: true, message: 'COSHH document deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── Equipment Documents ──────────────────────────────────────────────────────

/**
 * GET /api/equipment/:equipmentId/documents
 * Returns all documents attached to a specific equipment record.
 *
 * @param {import('express').Request} req - Params: equipmentId
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const erDocGetAll = async (req, res, next) => {
  try {
    const docs = await DocumentService.erDocGetAll(req.params.equipmentId);
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/equipment/:equipmentId/documents
 * Uploads and attaches a new document to an equipment record.
 * Accepts multipart/form-data; the uploaded file is available on req.file.
 *
 * @param {import('express').Request} req - Params: equipmentId, Body: docname + file
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const erDocCreate = async (req, res, next) => {
  try {
    const fields = { ...req.body, erid: req.params.equipmentId };
    // Store without the 'admin/' prefix to match the PHP convention: erfiles/filename.pdf
    if (req.file) fields.docfile = `erfiles/${req.file.filename}`;
    const doc = await DocumentService.erDocCreate(fields);
    res.status(201).json({ success: true, message: 'Equipment document uploaded.', data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/equipment/documents/:id
 * Permanently deletes an equipment document record.
 * Note: the physical file on disk is not deleted — only the database entry is removed.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const erDocRemove = async (req, res, next) => {
  try {
    const deleted = await DocumentService.erDocRemove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Document not found.' });
    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  coshhGetAll, coshhGetById, coshhCreate, coshhUpdate, coshhRemove,
  erDocGetAll, erDocCreate, erDocRemove,
};
