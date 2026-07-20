const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createAuditLog } = require('../services/auditLogService');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => {
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  return plain;
};

const userPopulate = { path: 'assigned_warehouse', select: '_id name location' };

const registerRules = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('military_number').notEmpty().withMessage('Employee code is required'),
  body('role').optional().isIn(['admin', 'unit', 'supplier']).withMessage('Role must be admin, unit, or supplier'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const register = asyncHandler(async (req, res) => {
  const payload = { ...req.body, role: req.body.role || 'unit' };
  payload.password = await bcrypt.hash(payload.password, 12);

  const user = await User.create(payload);
  const populatedUser = await User.findById(user._id).populate(userPopulate);
  const token = signToken(user);
  const safeUser = sanitizeUser(populatedUser);

  await createAuditLog({
    req: { ...req, user },
    action: 'register',
    module: 'security',
    entityId: user._id,
    entityType: 'User',
    description: `Registered user ${user.email}`,
    newData: safeUser,
  });

  res.status(201).json({ success: true, token, user: safeUser, data: safeUser });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password').populate(userPopulate);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await createAuditLog({
      req,
      action: 'failed_login',
      module: 'security',
      entityType: 'User',
      description: `Failed login attempt for ${email}`,
      newData: { email },
    });
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user);
  const safeUser = sanitizeUser(user);
  await createAuditLog({
    req: { ...req, user },
    action: 'login',
    module: 'security',
    entityId: user._id,
    entityType: 'User',
    description: `Login for ${user.email}`,
  });
  res.json({ success: true, token, user: safeUser, data: safeUser });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(userPopulate);
  const safeUser = sanitizeUser(user || req.user);
  res.json({ success: true, user: safeUser, data: safeUser });
});

module.exports = { register, login, me, registerRules, loginRules };
