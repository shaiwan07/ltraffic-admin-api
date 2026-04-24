/**
 * @fileoverview Dashboard service for the LTraffic Admin API.
 * Aggregates summary statistics and recent activity across all modules
 * so the admin dashboard screen can be populated with a single API call.
 *
 * @module services/dashboard.service
 */

const db = require('../config/db');

/**
 * Queries all module tables in parallel and returns a summary counts object.
 * Each query runs independently via Promise chaining — no joins needed.
 *
 * Returned shape:
 * {
 *   incidents:     { total, open, closed }
 *   vehicle_checks:{ total }              ← no status column on vehicle table
 *   timesheets:    { total, submitted, approved, rejected }
 *   bulletins:     { total, active }      ← active = new=1
 *   users:         { total, active, restricted }
 *   hr_records:    number
 *   equipment:     number
 * }
 *
 * @returns {Promise<object>}
 */
const getStats = async () => {
  const [[incidents]] = await db.query(
    "SELECT COUNT(*) AS total, SUM(status='Open') AS open, SUM(status='Closed') AS closed FROM healthsafety"
  );
  const [[vehicles]] = await db.query(
    "SELECT COUNT(*) AS total FROM vehicle"
  );
  const [[timesheets]] = await db.query(
    "SELECT COUNT(*) AS total, SUM(status='Submitted') AS submitted, SUM(status='Approved') AS approved, SUM(status='Rejected') AS rejected FROM timesheet"
  );
  // `new` is a reserved word — must be backtick-quoted
  const [[bulletins]] = await db.query(
    "SELECT COUNT(*) AS total, SUM(`new`=1) AS active FROM bulletinnew"
  );
  const [[users]] = await db.query(
    "SELECT COUNT(*) AS total, SUM(restricted=0) AS active, SUM(restricted=1) AS restricted FROM login_users"
  );
  const [[hr]] = await db.query("SELECT COUNT(*) AS total FROM hr");
  const [[equipment]] = await db.query("SELECT COUNT(*) AS total FROM er");

  return {
    incidents: {
      total: incidents.total || 0,
      open: incidents.open || 0,
      closed: incidents.closed || 0,
    },
    vehicle_checks: {
      total: vehicles.total || 0,
    },
    timesheets: {
      total: timesheets.total || 0,
      submitted: timesheets.submitted || 0,
      approved: timesheets.approved || 0,
      rejected: timesheets.rejected || 0,
    },
    bulletins: {
      total: bulletins.total || 0,
      active: bulletins.active || 0,
    },
    users: {
      total: users.total || 0,
      active: users.active || 0,
      restricted: users.restricted || 0,
    },
    hr_records: hr.total || 0,
    equipment: equipment.total || 0,
  };
};

/**
 * Returns the 5 most recent records from incidents, vehicle checks,
 * and timesheets for the "Recent Activity" section of the dashboard.
 *
 * @returns {Promise<{recent_incidents: object[], recent_vehicle_checks: object[], recent_timesheets: object[]}>}
 */
const getRecentActivity = async () => {
  const [recentIncidents] = await db.query(
    "SELECT id, operativesname, status, arrival_datetime FROM healthsafety ORDER BY id DESC LIMIT 5"
  );
  const [recentVehicles] = await db.query(
    "SELECT id, drivername, vehiclereg, arrival_datetime FROM vehicle ORDER BY id DESC LIMIT 5"
  );
  const [recentTimesheets] = await db.query(
    "SELECT id, name, ltrafficid, week, status FROM timesheet ORDER BY id DESC LIMIT 5"
  );

  return {
    recent_incidents: recentIncidents,
    recent_vehicle_checks: recentVehicles,
    recent_timesheets: recentTimesheets,
  };
};

module.exports = { getStats, getRecentActivity };
