const AuditLog = require('../models/auditLogModel');
const asyncHandler = require('../utils/asyncHandler');
const { createAuditLog } = require('../services/auditLogService');
const { assertDateRange } = require('../utils/dateValidation');

const getAuditLogs = asyncHandler(async (req, res) => {
  const { module, action, user, dateFrom, dateTo } = req.query;
  const filter = {};

  if (module) filter.module = module;
  if (action) filter.action = action;
  if (user) filter.$or = [{ user_name: new RegExp(user, 'i') }, { user_id: user }];
  if (dateFrom || dateTo) {
    assertDateRange(dateFrom, dateTo, 'Invalid audit log date range');
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const logs = await AuditLog.find(filter).populate('user_id').sort('-createdAt').limit(500);
  res.json({ success: true, count: logs.length, data: logs, logs });
});

const createFrontendAuditLog = asyncHandler(async (req, res) => {
  const log = await createAuditLog({
    req,
    action: req.body.action,
    module: req.body.module,
    entityId: req.body.entity_id,
    entityType: req.body.entity_type,
    description: req.body.description,
    previousData: req.body.previous_data,
    newData: req.body.new_data,
  });

  res.status(201).json({ success: true, data: log });
});

module.exports = {
  getAuditLogs,
  createFrontendAuditLog,
};
