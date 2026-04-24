const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/incidents', require('./incident.routes'));
router.use('/vehicles', require('./vehicle.routes'));
router.use('/timesheets', require('./timesheet.routes'));
router.use('/bulletins', require('./bulletin.routes'));
router.use('/hr', require('./hr.routes'));
router.use('/equipment', require('./equipment.routes'));
router.use('/users', require('./user.routes'));
router.use('/documents', require('./document.routes'));

module.exports = router;
