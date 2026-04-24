/**
 * @fileoverview Business logic for the Timesheets module (admin side).
 * Admins can view, approve, reject, delete, and create timesheets on
 * behalf of employees.
 *
 * @module services/timesheet.service
 */

const TimesheetModel = require('../models/timesheet.model');

/**
 * Returns a paginated list of timesheets.
 * Default status filter is 'submitted' (shows Submitted + Rejected).
 *
 * @param {object} query - Filters: status, search, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const getAll = async (query) => TimesheetModel.findAll(query);

/**
 * Returns a single timesheet by ID including all 7-day fields.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const getById = async (id) => TimesheetModel.findById(id);

/**
 * Creates a new timesheet on behalf of an employee (admin-initiated).
 * Status is automatically set to 'Submitted' by the model.
 *
 * @param {object} fields - Flat timesheet data (name, ltrafficid, week, date1..date7, etc.)
 * @returns {Promise<object>} Saved timesheet record.
 */
const create = async (fields) => {
  const id = await TimesheetModel.create(fields);
  return TimesheetModel.findById(id);
};

/**
 * Approves a timesheet and returns the updated record.
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
const approve = async (id) => {
  await TimesheetModel.updateStatus(id, 'Approved');
  return TimesheetModel.findById(id);
};

/**
 * Rejects a timesheet and returns the updated record.
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
const reject = async (id) => {
  await TimesheetModel.updateStatus(id, 'Rejected');
  return TimesheetModel.findById(id);
};

/**
 * Permanently deletes a timesheet record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => TimesheetModel.remove(id);

module.exports = { getAll, getById, create, approve, reject, remove };
