/**
 * @fileoverview HTTP controller for the Dashboard module.
 * Provides summary statistics and recent activity data for the admin home screen.
 *
 * @module controllers/dashboard.controller
 */

const DashboardService = require('../services/dashboard.service');

/**
 * GET /api/dashboard/stats
 * Returns aggregate counts across all modules:
 * incidents, vehicle checks, timesheets, bulletins, users, HR records, equipment.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getStats = async (req, res, next) => {
  try {
    const data = await DashboardService.getStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent
 * Returns the 5 most recent records from incidents, vehicle checks, and timesheets.
 * Used to populate the "Recent Activity" section on the dashboard screen.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const data = await DashboardService.getRecentActivity();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getRecentActivity };
