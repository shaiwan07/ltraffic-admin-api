/**
 * @fileoverview HTTP controller for the Incidents module (H&S incidents).
 * Handles listing, retrieval, creation, update, deletion, and status changes.
 * Image uploads are handled by multer middleware defined in the route file —
 * the filename is available on req.file when a file was uploaded.
 *
 * @module controllers/incident.controller
 */

const IncidentService = require('../services/incident.service');

/**
 * GET /api/incidents
 * Returns a paginated list of incidents with optional filters.
 *
 * Query params: status (open|closed), search (operative name),
 *               searchDate (date prefix), page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { status, search, searchDate, page, limit } = req.query;
    const result = await IncidentService.getAll({
      status,
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
 * GET /api/incidents/:id
 * Returns a single incident record including image_url.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const incident = await IncidentService.getById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/incidents
 * Creates a new incident. Accepts multipart/form-data for optional image upload.
 * If an image file is uploaded, req.file.filename is added to the fields.
 *
 * @param {import('express').Request} req - Body: incident fields + optional file
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    // Store the full relative path to match the PHP format: admin/hsupload/filename.jpg
    if (req.file) fields.image = `admin/hsupload/${req.file.filename}`;
    const incident = await IncidentService.create(fields);
    res.status(201).json({ success: true, message: 'Incident created.', data: incident });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/incidents/:id
 * Updates an existing incident. Accepts multipart/form-data for optional new image.
 *
 * @param {import('express').Request} req - Params: id, Body: partial incident fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const update = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    if (req.file) fields.image = `admin/hsupload/${req.file.filename}`;
    const incident = await IncidentService.update(req.params.id, fields);
    res.json({ success: true, message: 'Incident updated.', data: incident });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/incidents/:id
 * Permanently deletes an incident record.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await IncidentService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Incident not found.' });
    res.json({ success: true, message: 'Incident deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/incidents/:id/status
 * Updates only the status of an incident (Open or Closed).
 * Used by the admin open/close action buttons without a full record update.
 *
 * @param {import('express').Request} req - Params: id, Body: { status }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const incident = await IncidentService.updateStatus(req.params.id, status);
    res.json({ success: true, message: `Incident marked as ${status}.`, data: incident });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
