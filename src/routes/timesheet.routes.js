const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/timesheet.controller');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Timesheets
 *   description: Admin management of employee timesheets
 */

/**
 * @swagger
 * /timesheets:
 *   get:
 *     tags: [Timesheets]
 *     summary: List timesheets
 *     description: Accessible by Admin and Admin1. Default view shows submitted/rejected timesheets.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, approved, all]
 *           default: submitted
 *         description: "submitted = Submitted+Rejected, approved = Approved only, all = everything"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by operative name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated timesheets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Timesheet'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get('/', authenticate, adminOnly, ctrl.getAll);

/**
 * @swagger
 * /timesheets:
 *   post:
 *     tags: [Timesheets]
 *     summary: Create timesheet on behalf of employee (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, week]
 *             properties:
 *               name: { type: string, description: Operative name }
 *               ltrafficid: { type: string, description: Employee ID }
 *               week: { type: string, example: "Monday - 09/02/2026" }
 *               date1: { type: string }
 *               hours1: { type: number }
 *               location1: { type: string }
 *               activity1: { type: string }
 *               contract1: { type: string }
 *               date2: { type: string }
 *               hours2: { type: number }
 *               location2: { type: string }
 *               activity2: { type: string }
 *               contract2: { type: string }
 *               date3: { type: string }
 *               hours3: { type: number }
 *               location3: { type: string }
 *               activity3: { type: string }
 *               contract3: { type: string }
 *               date4: { type: string }
 *               hours4: { type: number }
 *               location4: { type: string }
 *               activity4: { type: string }
 *               contract4: { type: string }
 *               date5: { type: string }
 *               hours5: { type: number }
 *               location5: { type: string }
 *               activity5: { type: string }
 *               contract5: { type: string }
 *               date6: { type: string }
 *               hours6: { type: number }
 *               location6: { type: string }
 *               activity6: { type: string }
 *               contract6: { type: string }
 *               date7: { type: string }
 *               hours7: { type: number }
 *               location7: { type: string }
 *               activity7: { type: string }
 *               contract7: { type: string }
 *     responses:
 *       201:
 *         description: Timesheet created
 */
router.post('/',
  authenticate,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Operative name is required.'),
    body('week').notEmpty().withMessage('Week commencing is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /timesheets/{id}:
 *   get:
 *     tags: [Timesheets]
 *     summary: Get timesheet by ID (full detail with all 7 days)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Full timesheet
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminOnly, ctrl.getById);

/**
 * @swagger
 * /timesheets/{id}/approve:
 *   post:
 *     tags: [Timesheets]
 *     summary: Approve a timesheet
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Timesheet approved
 */
router.post('/:id/approve', authenticate, adminOnly, ctrl.approve);

/**
 * @swagger
 * /timesheets/{id}/reject:
 *   post:
 *     tags: [Timesheets]
 *     summary: Reject a timesheet
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Timesheet rejected
 */
router.post('/:id/reject', authenticate, adminOnly, ctrl.reject);

/**
 * @swagger
 * /timesheets/{id}/delete:
 *   post:
 *     tags: [Timesheets]
 *     summary: Delete timesheet (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.post('/:id/delete', authenticate, adminOnly, ctrl.remove);

module.exports = router;
