const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/userModel');
const Warehouse = require('../models/warehouseModel');
const { getAll, getOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../services/auditLogService');

const userRules = [
  body('name').optional().trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('nameAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('military_number').optional().notEmpty().withMessage('Employee code cannot be empty'),
  body('role').optional().isIn(['admin', 'unit', 'supplier']).withMessage('Role must be admin, unit, or supplier'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('assigned_warehouse').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid assigned_warehouse is required'),
];

const createUserRules = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('nameAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').notEmpty().withMessage('Phone cannot be empty'),
  body('military_number').notEmpty().withMessage('Employee code cannot be empty'),
  body('role').isIn(['admin', 'unit', 'supplier']).withMessage('Role must be admin, unit, or supplier'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('assigned_warehouse').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid assigned_warehouse is required'),
];

const statusRules = [
  body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

const passwordRules = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const normalizeWarehouseAssignment = async (payload, existingUser = null) => {
  const role = payload.role || existingUser?.role || 'unit';
  if (payload.assigned_warehouse === '') {
    payload.assigned_warehouse = null;
  }

  if (role === 'admin') {
    if (!payload.assigned_warehouse) {
      payload.assigned_warehouse = null;
      payload.assigned_warehouse_name = '';
      return;
    }

    const warehouse = await Warehouse.findById(payload.assigned_warehouse);
    if (!warehouse) {
      throw new AppError('Assigned warehouse was not found', 404);
    }
    payload.assigned_warehouse = warehouse._id;
    payload.assigned_warehouse_name = warehouse.name;
    return;
  }

  const assignedWarehouse = payload.assigned_warehouse ?? existingUser?.assigned_warehouse;
  if (!assignedWarehouse) {
    throw new AppError('Assigned warehouse is required for unit users', 400);
  }

  const warehouse = await Warehouse.findById(assignedWarehouse);
  if (!warehouse) {
    throw new AppError('Assigned warehouse was not found', 404);
  }

  payload.assigned_warehouse = warehouse._id;
  payload.assigned_warehouse_name = warehouse.name;
};

const createUser = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const existingUser = await User.findOne({
    $or: [{ email: payload.email }, { military_number: payload.military_number }],
  });

  if (existingUser) {
    throw new AppError('A user with this email or employee code already exists', 409);
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }

  await normalizeWarehouseAssignment(payload);
  const user = await User.create(payload);
  const populated = await User.findById(user._id).populate('assigned_warehouse', '_id name location');
  const plain = populated.toObject();
  delete plain.password;

  await createAuditLog({
    req,
    action: 'create_user',
    module: 'users',
    entityId: user._id,
    entityType: 'User',
    description: `Created user ${user.name}`,
    newData: plain,
  });

  res.status(201).json({ success: true, data: plain });
});

const updateUser = asyncHandler(async (req, res) => {
  const previous = await User.findById(req.params.id);
  if (!previous) {
    throw new AppError('User not found', 404);
  }
  const payload = { ...req.body };
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }
  await normalizeWarehouseAssignment(payload, previous);

  const user = await User.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  }).populate('assigned_warehouse', '_id name location');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await createAuditLog({
    req,
    action: 'update_user',
    module: 'users',
    entityId: user._id,
    entityType: 'User',
    description: `Updated user ${user.name}`,
    previousData: previous,
    newData: user,
  });

  res.json({ success: true, data: user });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const previous = await User.findById(req.params.id);
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await createAuditLog({
    req,
    action: req.body.status === 'active' ? 'activate_user' : 'deactivate_user',
    module: 'users',
    entityId: user._id,
    entityType: 'User',
    description: `${req.body.status === 'active' ? 'Activated' : 'Deactivated'} user ${user.name}`,
    previousData: previous,
    newData: user,
  });

  res.json({ success: true, data: user });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { password: hashedPassword },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await createAuditLog({
    req,
    action: 'reset_password',
    module: 'users',
    entityId: user._id,
    entityType: 'User',
    description: `Password reset for ${user.name}`,
  });

  res.json({ success: true, message: 'Password reset successfully' });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await createAuditLog({
    req,
    action: 'delete_user',
    module: 'users',
    entityId: user._id,
    entityType: 'User',
    description: `Deleted user ${user.name}`,
    previousData: user,
  });

  res.status(204).send();
});

const nonFoodSupplierPattern = /(medical|equipment|hardware|device|supplies|medical|equipment)/i;
const getSupplierUsers = asyncHandler(async (_req, res) => {
  const suppliers = await User.find({
    role: 'supplier',
    status: { $ne: 'inactive' },
    name: { $not: nonFoodSupplierPattern },
    email: { $not: nonFoodSupplierPattern },
  })
    .select('_id name nameAr email phone status role')
    .sort('name');
  res.json({ success: true, count: suppliers.length, data: suppliers });
});

module.exports = {
  userRules,
  createUserRules,
  statusRules,
  passwordRules,
  getUsers: getAll(User, ['assigned_warehouse']),
  getUser: getOne(User, ['assigned_warehouse']),
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  getSupplierUsers,
};
