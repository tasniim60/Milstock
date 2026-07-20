const { body } = require('express-validator');
const Supplier = require('../models/supplierModel');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');

const supplierRules = [
  body('name').optional().trim().isLength({ min: 3 }).withMessage('Supplier name is required'),
  body('code').optional().trim(),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim().notEmpty().withMessage('Phone is required'),
  body('category').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

const getSuppliers = asyncHandler(async (req, res) => {
  const queryFilter = { ...req.query };
  delete queryFilter.sort;
  delete queryFilter.limit;
  delete queryFilter.page;
  delete queryFilter.fields;

  const statusFilter = queryFilter.status || { $ne: 'inactive' };
  delete queryFilter.status;

  const docs = await Supplier.find({ ...queryFilter, status: statusFilter }).sort('name');
  res.json({ success: true, count: docs.length, data: docs });
});

module.exports = {
  supplierRules,
  getSuppliers,
  getSupplier: getOne(Supplier),
  createSupplier: createOne(Supplier),
  updateSupplier: updateOne(Supplier),
  deleteSupplier: deleteOne(Supplier),
};
