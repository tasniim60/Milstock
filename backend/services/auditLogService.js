const AuditLog = require('../models/auditLogModel');

const sanitize = (value) => {
  if (!value || typeof value !== 'object') return value;
  const data = typeof value.toObject === 'function' ? value.toObject() : { ...value };
  delete data.password;
  delete data.token;
  return data;
};

const createAuditLog = async ({
  req,
  action,
  module,
  entityId,
  entityType,
  description,
  previousData,
  newData,
}) => {
  try {
    return await AuditLog.create({
      user_id: req?.user?._id || null,
      user_name: req?.user?.name || '',
      user_role: req?.user?.role || '',
      action,
      module,
      entity_id: entityId ? String(entityId) : '',
      entity_type: entityType || '',
      description: description || '',
      previous_data: sanitize(previousData),
      new_data: sanitize(newData),
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || '',
      user_agent: req?.get?.('user-agent') || '',
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
    return null;
  }
};

module.exports = {
  createAuditLog,
};
