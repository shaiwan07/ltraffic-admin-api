const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/user.controller');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Admin user management (login_users table)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     description: Returns all users (employees and admins). Accessible by Admin and Admin1.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, name, email, or ltrafficid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total: { type: integer }
 */
router.get('/', authenticate, adminOnly, ctrl.getAll);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminOnly, ctrl.getById);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create user (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, name, password, user_level]
 *             properties:
 *               user_level:
 *                 type: string
 *                 description: PHP serialized level string e.g. 'a:1:{i:0;s:1:"2";}'
 *               username: { type: string }
 *               name: { type: string }
 *               email: { type: string }
 *               password:
 *                 type: string
 *                 minLength: 8
 *               teamup: { type: string }
 *               vehiclereg: { type: string }
 *               ltrafficid: { type: string }
 *               team: { type: string }
 *               name1: { type: string }
 *               onboarding: { type: string }
 *               restricted:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 0
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/',
  authenticate,
  adminOnly,
  [
    body('username').notEmpty().withMessage('Username is required.'),
    body('name').notEmpty().withMessage('Name is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('user_level').notEmpty().withMessage('User level is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /users/{id}/update:
 *   post:
 *     tags: [Users]
 *     summary: Update user details (Admin + Admin1)
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
 *               name: { type: string }
 *               email: { type: string }
 *               teamup: { type: string }
 *               vehiclereg: { type: string }
 *               ltrafficid: { type: string }
 *               team: { type: string }
 *               name1: { type: string }
 *               onboarding: { type: string }
 *               user_level: { type: string }
 *               restricted: { type: integer, enum: [0, 1] }
 *     responses:
 *       200:
 *         description: User updated
 */
router.post('/:id/update', authenticate, adminOnly, ctrl.update);

/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     tags: [Users]
 *     summary: Reset user password (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_password]
 *             properties:
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset
 */
router.post('/:id/reset-password',
  authenticate,
  adminOnly,
  [body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')],
  validate,
  ctrl.resetPassword
);

/**
 * @swagger
 * /users/{id}/restrict:
 *   post:
 *     tags: [Users]
 *     summary: Restrict or unrestrict user (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restricted]
 *             properties:
 *               restricted:
 *                 type: boolean
 *                 description: true to restrict, false to unrestrict
 *     responses:
 *       200:
 *         description: User restriction updated
 */
router.post('/:id/restrict',
  authenticate,
  adminOnly,
  [body('restricted').isBoolean().withMessage('restricted must be a boolean.')],
  validate,
  ctrl.toggleRestrict
);

/**
 * @swagger
 * /users/{id}/delete:
 *   post:
 *     tags: [Users]
 *     summary: Delete user (Admin only — irreversible)
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
