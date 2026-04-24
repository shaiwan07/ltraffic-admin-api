const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin login
 *     description: Authenticates an admin user (levels 1=Admin, 4=Admin1, 7=Admin2, 8=Essex Supervisor). Supports both email and username.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ltraffic.co.uk
 *                 description: Admin email address or username
 *               password:
 *                 type: string
 *                 example: MyPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/AdminUser'
 *       401:
 *         description: Invalid credentials or not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login',
  [
    body('email').notEmpty().withMessage('Email or username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  ctrl.login
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current admin user
 *     description: Returns the decoded JWT payload for the authenticated admin.
 *     responses:
 *       200:
 *         description: Current admin user info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, ctrl.me);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change admin password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Current password incorrect
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Current password is required.'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
