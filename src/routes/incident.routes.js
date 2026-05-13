const router = require('express').Router();
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/incident.controller');
const { authenticate, adminOnly, adminAll } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// PHP h&s form saves incident images to admin/hsupload/ (relative to employeesarea root).
// DB stores the full relative path: admin/hsupload/filename.jpg — must use the same directory.
const incidentDir = path.join(process.env.UPLOADS_ROOT || path.join(__dirname, '..', '..', 'dev-files'), 'admin', 'hsupload');
try { fs.mkdirSync(incidentDir, { recursive: true }); } catch (_) { /* directory may already exist or be managed by the server */ }

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, incidentDir); },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ['.jpg', '.jpeg', '.png', '.gif', '.pdf'].includes(ext));
  },
});

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Admin management of reported incidents (healthsafety table)
 */

/**
 * @swagger
 * /incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: List incidents
 *     description: Paginated list with optional filters. Accessible by Admin, Admin1, and Essex Supervisor.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Filter by status (omit for all)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by operative name
 *       - in: query
 *         name: searchDate
 *         schema:
 *           type: string
 *         description: Filter by arrival_datetime prefix (e.g. 2024-01)
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
 *         description: Paginated incidents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get('/', authenticate, adminAll, ctrl.getAll);

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     tags: [Incidents]
 *     summary: Get incident by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Incident'
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, adminAll, ctrl.getById);

/**
 * @swagger
 * /incidents:
 *   post:
 *     tags: [Incidents]
 *     summary: Create incident (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [operativesname, type, location, reportedby, report, arrival_datetime]
 *             properties:
 *               operativesname:
 *                 type: string
 *               type:
 *                 type: string
 *               location:
 *                 type: string
 *               reportedby:
 *                 type: string
 *               report:
 *                 type: string
 *               arrival_datetime:
 *                 type: string
 *                 example: "2024-05-01 09:00:00"
 *               status:
 *                 type: string
 *                 enum: [Open, Closed]
 *                 default: Open
 *               confirmed:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 0
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Incident created
 */
router.post('/',
  authenticate,
  adminOnly,
  upload.single('image'),
  [
    body('operativesname').notEmpty().withMessage('Operative name is required.'),
    body('type').notEmpty().withMessage('Type is required.'),
    body('location').notEmpty().withMessage('Location is required.'),
    body('reportedby').notEmpty().withMessage('Reported by is required.'),
    body('report').notEmpty().withMessage('Report is required.'),
    body('arrival_datetime').notEmpty().withMessage('Date/time is required.'),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /incidents/{id}:
 *   put:
 *     tags: [Incidents]
 *     summary: Update incident (Admin + Admin1)
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
 *               operativesname: { type: string }
 *               type: { type: string }
 *               location: { type: string }
 *               reportedby: { type: string }
 *               report: { type: string }
 *               arrival_datetime: { type: string }
 *               status:
 *                 type: string
 *                 enum: [Open, Closed]
 *               confirmed:
 *                 type: integer
 *                 enum: [0, 1]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Incident updated
 */
router.put('/:id', authenticate, adminOnly, upload.single('image'), ctrl.update);

/**
 * @swagger
 * /incidents/{id}/status:
 *   patch:
 *     tags: [Incidents]
 *     summary: Update incident status (open/close)
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Open, Closed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status',
  authenticate,
  adminOnly,
  [body('status').isIn(['Open', 'Closed']).withMessage('Status must be Open or Closed.')],
  validate,
  ctrl.updateStatus
);

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     tags: [Incidents]
 *     summary: Delete incident (Admin only)
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
router.delete('/:id', authenticate, adminOnly, ctrl.remove);

module.exports = router;
