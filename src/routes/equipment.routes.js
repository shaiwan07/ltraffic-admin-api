const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/equipment.controller');
const { authenticate, adminOnly, adminAll } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Equipment
 *   description: Equipment allocation register (er table)
 */

/**
 * @swagger
 * /equipment:
 *   get:
 *     tags: [Equipment]
 *     summary: List equipment
 *     description: Accessible by all admin levels. Ordered by identification number.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by item name
 *       - in: query
 *         name: searchIdent
 *         schema:
 *           type: string
 *         description: Search by identification number
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
 *         description: Paginated equipment list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Equipment'
 *                 total: { type: integer }
 */
router.get('/', authenticate, adminAll, ctrl.getAll);

/**
 * @swagger
 * /equipment/{id}:
 *   get:
 *     tags: [Equipment]
 *     summary: Get equipment item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Equipment detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Equipment'
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminAll, ctrl.getById);

/**
 * @swagger
 * /equipment:
 *   post:
 *     tags: [Equipment]
 *     summary: Add equipment item (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item, ident]
 *             properties:
 *               item: { type: string }
 *               description: { type: string }
 *               ident: { type: string }
 *               allocatedto: { type: string }
 *               date: { type: string }
 *               cond: { type: string, description: Equipment condition }
 *               expiry: { type: string, description: Service/calibration expiry date }
 *     responses:
 *       201:
 *         description: Equipment added
 */
router.post('/',
  authenticate,
  adminOnly,
  [
    body('item').notEmpty().withMessage('Item name is required.'),
    body('ident').notEmpty().withMessage('Identification number is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /equipment/{id}/update:
 *   post:
 *     tags: [Equipment]
 *     summary: Update equipment item (Admin + Admin1)
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
 *               item: { type: string }
 *               description: { type: string }
 *               ident: { type: string }
 *               allocatedto: { type: string }
 *               date: { type: string }
 *               cond: { type: string }
 *               expiry: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post('/:id/update', authenticate, adminOnly, ctrl.update);

/**
 * @swagger
 * /equipment/{id}/delete:
 *   post:
 *     tags: [Equipment]
 *     summary: Delete equipment item (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 */
router.post('/:id/delete', authenticate, adminOnly, ctrl.remove);

module.exports = router;
