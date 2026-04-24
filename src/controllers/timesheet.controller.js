/**
 * @fileoverview HTTP controller for the Timesheets module.
 * Admins can view, approve, reject, create, and delete timesheets.
 *
 * @module controllers/timesheet.controller
 */

const TimesheetService = require('../services/timesheet.service');

/**
 * GET /api/timesheets
 * Returns a paginated list of timesheets.
 * Default status filter is 'submitted' (shows Submitted + Rejected timesheets
 * that are awaiting admin review).
 *
 * Query params: status (submitted|approved|all), search (operative name), page, limit.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await TimesheetService.getAll({
      status: status || 'submitted',
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/timesheets/:id
 * Returns the full timesheet record including all 7 daily entries.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getById = async (req, res, next) => {
  try {
    const ts = await TimesheetService.getById(req.params.id);
    if (!ts) return res.status(404).json({ success: false, message: 'Timesheet not found.' });
    res.json({ success: true, data: ts });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/timesheets
 * Creates a new timesheet on behalf of an employee (admin-initiated).
 * Status is automatically set to Submitted.
 *
 * Body: { name, ltrafficid, week, date1..date7, hours1..hours7,
 *         location1..location7, activity1..activity7, contract1..contract7 }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const create = async (req, res, next) => {
  try {
    const ts = await TimesheetService.create(req.body);
    res.status(201).json({ success: true, message: 'Timesheet created.', data: ts });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/timesheets/:id/approve
 * Sets the timesheet status to Approved.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const approve = async (req, res, next) => {
  try {
    const ts = await TimesheetService.approve(req.params.id);
    res.json({ success: true, message: 'Timesheet approved.', data: ts });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/timesheets/:id/reject
 * Sets the timesheet status to Rejected.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const reject = async (req, res, next) => {
  try {
    const ts = await TimesheetService.reject(req.params.id);
    res.json({ success: true, message: 'Timesheet rejected.', data: ts });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/timesheets/:id
 * Permanently deletes a timesheet record.
 *
 * @param {import('express').Request} req - Params: id
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await TimesheetService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Timesheet not found.' });
    res.json({ success: true, message: 'Timesheet deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, approve, reject, remove };
