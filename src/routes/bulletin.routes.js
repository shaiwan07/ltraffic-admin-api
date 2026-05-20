const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/bulletin.controller');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// Bulletin images are stored in the bulletin/ directory at the employeesarea root.
// The employee web displays them from httpdocs/employeesarea/bulletin/ and the DB stores
// just the filename (e.g. PPERules1.jpeg) — no path prefix in the database.
const bulletinDir = path.join(process.env.UPLOADS_ROOT || path.join(__dirname, '..', '..', 'dev-files'), 'bulletin');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(bulletinDir, { recursive: true });
    cb(null, bulletinDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
});

/**
 * @swagger
 * tags:
 *   name: Bulletins
 *   description: Admin bulletin management
 */

/**
 * @swagger
 * /bulletins:
 *   get:
 *     tags: [Bulletins]
 *     summary: List bulletins
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by bulletin title
 *       - in: query
 *         name: searchRef
 *         schema:
 *           type: string
 *         description: Search by bulletin reference
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
 *         description: Paginated bulletins with image_url and download_url
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bulletin'
 *                 total: { type: integer }
 */
router.get('/', authenticate, adminOnly, ctrl.getAll);

/**
 * @swagger
 * /bulletins/{id}:
 *   get:
 *     tags: [Bulletins]
 *     summary: Get bulletin by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bulletin detail
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminOnly, ctrl.getById);

/**
 * @swagger
 * /bulletins/{id}/readers:
 *   get:
 *     tags: [Bulletins]
 *     summary: Get list of users who have read this bulletin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of readers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id: { type: integer }
 *                       name: { type: string }
 *                       email: { type: string }
 */
router.get('/:id/readers', authenticate, adminOnly, ctrl.getReaders);

/**
 * @swagger
 * /bulletins:
 *   post:
 *     tags: [Bulletins]
 *     summary: Create bulletin (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, ref, description]
 *             properties:
 *               title: { type: string }
 *               ref: { type: string }
 *               description: { type: string }
 *               new:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: 1=Active, 0=Inactive
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Bulletin image
 *               download:
 *                 type: string
 *                 format: binary
 *                 description: Downloadable PDF or file
 *     responses:
 *       201:
 *         description: Bulletin created
 */
router.post('/',
  authenticate,
  adminOnly,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'download', maxCount: 1 }]),
  [
    body('title').notEmpty().withMessage('Title is required.'),
    body('ref').notEmpty().withMessage('Reference is required.'),
    body('description').notEmpty().withMessage('Description is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /bulletins/{id}/update:
 *   post:
 *     tags: [Bulletins]
 *     summary: Update bulletin (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               ref: { type: string }
 *               description: { type: string }
 *               new: { type: integer, enum: [0, 1] }
 *               image: { type: string, format: binary }
 *               download: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post('/:id/update',
  authenticate,
  adminOnly,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'download', maxCount: 1 }]),
  ctrl.update
);

/**
 * @swagger
 * /bulletins/{id}/delete:
 *   post:
 *     tags: [Bulletins]
 *     summary: Delete bulletin (Admin only)
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
