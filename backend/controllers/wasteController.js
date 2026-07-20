const { body } = require('express-validator');
const Waste = require('../models/wasteModel');
const Product = require('../models/productModel');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../services/auditLogService');

const populateWaste = ['product', 'createdBy'];

const createWasteRules = [
  body('product').isMongoId().withMessage('Valid product is required'),
  body('quantity').isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than zero'),
  body('reason').isIn(['expired', 'damaged']).withMessage('Reason must be expired or damaged'),
  body('notes').optional().trim(),
];

const ensureWasteViewer = (req) => {
  if (!['admin', 'unit'].includes(req.user?.role)) {
    throw new AppError('You do not have permission to access waste analysis', 403);
  }
};

const createWaste = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'unit') {
    throw new AppError('Only warehouse/unit users can add waste records', 403);
  }

  const product = await Product.findById(req.body.product);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const waste = await Waste.create({
    product: product._id,
    productName: product.name,
    quantity: Number(req.body.quantity),
    reason: req.body.reason,
    notes: req.body.notes || '',
    createdBy: req.user._id,
  });

  await createAuditLog({
    req,
    action: 'create_waste_record',
    module: 'waste',
    entityId: waste._id,
    entityType: 'Waste',
    description: `Created waste record for ${product.name}`,
    newData: waste,
  });

  const populated = await Waste.findById(waste._id).populate(populateWaste);
  res.status(201).json({ success: true, data: populated });
});

const getWaste = asyncHandler(async (req, res) => {
  ensureWasteViewer(req);
  const records = await Waste.find({}).populate(populateWaste).sort('-createdAt');
  res.json({ success: true, count: records.length, data: records });
});

const getWasteProducts = asyncHandler(async (req, res) => {
  ensureWasteViewer(req);
  const products = await Product.find({})
    .populate('warehouse_id')
    .sort({ name: 1 });

  res.json({ success: true, count: products.length, data: products, products });
});

const getWasteAnalytics = asyncHandler(async (req, res) => {
  ensureWasteViewer(req);

  const records = await Waste.find({}).populate(populateWaste).sort('-createdAt');
  const now = new Date();
  const months = [];
  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      month: date.toLocaleString('en', { month: 'short' }),
      monthAr: date.toLocaleString('ar-EG', { month: 'short' }),
      expired: 0,
      damaged: 0,
    });
  }

  const byMonth = new Map(months.map((month) => [month.key, month]));
  let totalWaste = 0;
  let totalExpired = 0;
  let totalDamaged = 0;

  records.forEach((record) => {
    const quantity = Number(record.quantity || 0);
    totalWaste += quantity;
    if (record.reason === 'expired') totalExpired += quantity;
    if (record.reason === 'damaged') totalDamaged += quantity;

    const createdAt = new Date(record.createdAt);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    const bucket = byMonth.get(key);
    if (bucket && record.reason === 'expired') bucket.expired += quantity;
    if (bucket && record.reason === 'damaged') bucket.damaged += quantity;
  });

  res.json({
    success: true,
    data: {
      chartData: months,
      totals: {
        totalWaste,
        expired: totalExpired,
        damaged: totalDamaged,
      },
      recent: records.slice(0, 10),
    },
  });
});

module.exports = {
  createWasteRules,
  createWaste,
  getWaste,
  getWasteProducts,
  getWasteAnalytics,
};
