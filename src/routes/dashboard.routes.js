const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard statistics
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: Returns counts for incidents, vehicle checks, timesheets, bulletins, users, HR records, and equipment.
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     incidents:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         open: { type: integer }
 *                         closed: { type: integer }
 *                     vehicle_checks:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         open: { type: integer }
 *                         closed: { type: integer }
 *                     timesheets:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         submitted: { type: integer }
 *                         approved: { type: integer }
 *                         rejected: { type: integer }
 *                     bulletins:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *                     users:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *                         restricted: { type: integer }
 *                     hr_records: { type: integer }
 *                     equipment: { type: integer }
 */
router.get('/stats', authenticate, ctrl.getStats);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activity
 *     description: Returns the 5 most recent incidents, vehicle checks, and timesheets.
 *     responses:
 *       200:
 *         description: Recent activity
 */
router.get('/recent', authenticate, ctrl.getRecentActivity);

module.exports = router;
