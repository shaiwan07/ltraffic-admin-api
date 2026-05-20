const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/hr.controller');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// PHP stores HR photos in admin/employeephoto/ (relative to employeesarea root).
// The DB stores the path without the 'admin/' prefix: employeephoto/filename.jpg
const hrDir = path.join(process.env.UPLOADS_ROOT || path.join(__dirname, '..', '..', 'dev-files'), 'admin', 'employeephoto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(hrDir, { recursive: true });
    cb(null, hrDir);
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
 *   name: HR Manager
 *   description: Admin HR employee records
 */

/**
 * @swagger
 * /hr:
 *   get:
 *     tags: [HR Manager]
 *     summary: List HR records
 *     description: Accessible by Admin and Admin1. Ordered by employee ID.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by first name
 *       - in: query
 *         name: searchSurname
 *         schema:
 *           type: string
 *         description: Search by surname
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
 *         description: Paginated HR records with photo_url
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
 *                       id: { type: integer }
 *                       employeeid: { type: string }
 *                       firstname: { type: string }
 *                       surname: { type: string }
 *                       ltrafficphone: { type: string }
 *                       ltrafficemail: { type: string }
 *                       jobtitle: { type: string }
 *                       linemanager: { type: string }
 *                       location: { type: string }
 *                       date_signed: { type: string }
 *                       photo_url: { type: string }
 *                 total: { type: integer }
 */
router.get('/', authenticate, adminOnly, ctrl.getAll);

/**
 * @swagger
 * /hr/{id}:
 *   get:
 *     tags: [HR Manager]
 *     summary: Get HR record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: HR record detail
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminOnly, ctrl.getById);

/**
 * @swagger
 * /hr:
 *   post:
 *     tags: [HR Manager]
 *     summary: Create HR record (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [employeeid, firstname, surname]
 *             properties:
 *               employeeid: { type: string }
 *               firstname: { type: string }
 *               surname: { type: string }
 *               ltrafficphone: { type: string }
 *               ltrafficemail: { type: string }
 *               jobtitle: { type: string }
 *               linemanager: { type: string }
 *               location: { type: string }
 *               date_signed: { type: string }
 *               startdate: { type: string }
 *               dob: { type: string }
 *               address: { type: string }
 *               emergency_contact: { type: string }
 *               emergency_phone: { type: string }
 *               photoimage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: HR record created
 */
router.post('/',
  authenticate,
  adminOnly,
  upload.single('photoimage'),
  [
    body('employeeid').notEmpty().withMessage('Employee ID is required.'),
    body('firstname').notEmpty().withMessage('First name is required.'),
    body('surname').notEmpty().withMessage('Surname is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /hr/{id}/update:
 *   post:
 *     tags: [HR Manager]
 *     summary: Update HR record (Admin + Admin1)
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
 *               firstname: { type: string }
 *               surname: { type: string }
 *               ltrafficphone: { type: string }
 *               ltrafficemail: { type: string }
 *               jobtitle: { type: string }
 *               linemanager: { type: string }
 *               location: { type: string }
 *               date_signed: { type: string }
 *               photoimage: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post('/:id/update', authenticate, adminOnly, upload.single('photoimage'), ctrl.update);

/**
 * @swagger
 * /hr/{id}/delete:
 *   post:
 *     tags: [HR Manager]
 *     summary: Delete HR record (Admin only)
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
