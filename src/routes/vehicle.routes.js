const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/vehicle.controller');
const { authenticate, adminOnly, adminAll } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Vehicle Checks
 *   description: Admin management of vehicle checks
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     tags: [Vehicle Checks]
 *     summary: List vehicle checks
 *     description: Accessible by Admin, Admin1, Admin2.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by driver name
 *       - in: query
 *         name: searchDate
 *         schema:
 *           type: string
 *         description: Filter by date prefix
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
 *         description: Paginated vehicle checks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VehicleCheck'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get('/', authenticate, adminAll, ctrl.getAll);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     tags: [Vehicle Checks]
 *     summary: Get vehicle check by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle check details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/VehicleCheck'
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminAll, ctrl.getById);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     tags: [Vehicle Checks]
 *     summary: Create vehicle check (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drivername, vehiclereg, mileage, arrival_datetime, vehiclecondition, safe]
 *             properties:
 *               drivername: { type: string }
 *               vehiclereg: { type: string }
 *               mileage: { type: integer }
 *               arrival_datetime: { type: string, example: "2024-05-01 09:00:00" }
 *               vehiclecondition: { type: string }
 *               safe: { type: string }
 *               inspection_date: { type: string }
 *               confirmed: { type: integer, enum: [0, 1], default: 0 }
 *               routeplanned: { type: string }
 *               roadconditions: { type: string }
 *               dressedforweather: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/',
  authenticate,
  adminOnly,
  [
    body('drivername').notEmpty().withMessage('Driver name is required.'),
    body('vehiclereg').notEmpty().withMessage('Vehicle registration is required.'),
    body('mileage').isInt({ min: 0 }).withMessage('Mileage must be a positive integer.'),
    body('arrival_datetime').notEmpty().withMessage('Date/time is required.'),
    body('vehiclecondition').notEmpty().withMessage('Vehicle condition is required.'),
    body('safe').notEmpty().withMessage('Safety condition is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /vehicles/{id}/update:
 *   post:
 *     tags: [Vehicle Checks]
 *     summary: Update vehicle check (Admin + Admin1)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               drivername: { type: string }
 *               vehiclereg: { type: string }
 *               mileage: { type: integer }
 *               arrival_datetime: { type: string }
 *               vehiclecondition: { type: string }
 *               safe: { type: string }
 *               inspection_date: { type: string }
 *               confirmed: { type: integer, enum: [0, 1] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post('/:id/update', authenticate, adminOnly, ctrl.update);

/**
 * @swagger
 * /vehicles/{id}/delete:
 *   post:
 *     tags: [Vehicle Checks]
 *     summary: Delete vehicle check (Admin only)
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
