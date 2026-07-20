const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getAuditLogs, createFrontendAuditLog } = require('../controllers/auditLogController');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin'), getAuditLogs)
  .post(
    body('action').trim().notEmpty().withMessage('Action is required'),
    body('module').trim().notEmpty().withMessage('Module is required'),
    validate,
    createFrontendAuditLog
  );

module.exports = router;
