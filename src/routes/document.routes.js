const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/document.controller');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// PHP admin stores equipment register documents in admin/erfiles/ (ajaxupload4.php: $path='erfiles/').
// DB stores the path without the 'admin/' prefix: erfiles/filename.pdf
const equipmentDir = path.join(process.env.UPLOADS_ROOT || './dev-files', 'admin', 'erfiles');
if (!fs.existsSync(equipmentDir)) fs.mkdirSync(equipmentDir, { recursive: true });

const storage = multer.diskStorage({
  destination: equipmentDir,
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
 *   name: Documents
 *   description: Document control — COSHH documents and equipment documents
 */

/**
 * @swagger
 * /documents/coshh:
 *   get:
 *     tags: [Documents]
 *     summary: List COSHH documents
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by document reference (cos1)
 *       - in: query
 *         name: searchLink
 *         schema:
 *           type: string
 *         description: Search by COSHH link (cos2)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 40
 *     responses:
 *       200:
 *         description: Paginated COSHH documents with file_url
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
 *                       cos1: { type: string, description: Document reference }
 *                       cos2: { type: string, description: COSHH link/title }
 *                       cos3: { type: string, description: Document issue }
 *                       file_url: { type: string }
 */
router.get('/coshh', authenticate, adminOnly, ctrl.coshhGetAll);

/**
 * @swagger
 * /documents/coshh/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Get COSHH document by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: COSHH document
 *       404:
 *         description: Not found
 */
router.get('/coshh/:id', authenticate, adminOnly, ctrl.coshhGetById);

/**
 * @swagger
 * /documents/coshh:
 *   post:
 *     tags: [Documents]
 *     summary: Add COSHH document (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cos1, cos2]
 *             properties:
 *               cos1:
 *                 type: string
 *                 description: Document reference (also used as filename)
 *               cos2:
 *                 type: string
 *                 description: COSHH link/title
 *               cos3:
 *                 type: string
 *                 description: Document issue
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/coshh',
  authenticate,
  adminOnly,
  [
    body('cos1').notEmpty().withMessage('Document reference is required.'),
    body('cos2').notEmpty().withMessage('COSHH link is required.'),
  ],
  validate,
  ctrl.coshhCreate
);

/**
 * @swagger
 * /documents/coshh/{id}:
 *   put:
 *     tags: [Documents]
 *     summary: Update COSHH document (Admin only)
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
 *               cos1: { type: string }
 *               cos2: { type: string }
 *               cos3: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/coshh/:id', authenticate, adminOnly, ctrl.coshhUpdate);

/**
 * @swagger
 * /documents/coshh/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete COSHH document (Admin only)
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
router.delete('/coshh/:id', authenticate, adminOnly, ctrl.coshhRemove);

/**
 * @swagger
 * /documents/equipment/{equipmentId}/docs:
 *   get:
 *     tags: [Documents]
 *     summary: List documents attached to an equipment item
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Equipment documents list with file_url
 */
router.get('/equipment/:equipmentId/docs', authenticate, adminOnly, ctrl.erDocGetAll);

/**
 * @swagger
 * /documents/equipment/{equipmentId}/docs:
 *   post:
 *     tags: [Documents]
 *     summary: Upload document for equipment item (Admin only)
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [docname, docfile]
 *             properties:
 *               docname: { type: string }
 *               docfile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post('/equipment/:equipmentId/docs',
  authenticate,
  adminOnly,
  upload.single('docfile'),
  [body('docname').notEmpty().withMessage('Document name is required.')],
  validate,
  ctrl.erDocCreate
);

/**
 * @swagger
 * /documents/equipment/docs/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete equipment document (Admin only)
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
router.delete('/equipment/docs/:id', authenticate, adminOnly, ctrl.erDocRemove);

module.exports = router;
