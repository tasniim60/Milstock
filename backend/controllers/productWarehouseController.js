const { body } = require('express-validator');
const ProductWarehouse = require('../models/productWarehouseModel');
const { getAll, getOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const { syncProductQuantity } = require('../services/inventoryService');
const AppError = require('../utils/AppError');

const productWarehouseRules = [
  body('warehouse_id').optional().isMongoId().withMessage('Valid warehouse_id is required'),
  body('product_id').optional().isMongoId().withMessage('Valid product_id is required'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be 0 or greater'),
];

const createProductWarehouse = asyncHandler(async (req, res) => {
  const row = await ProductWarehouse.create(req.body);
  await syncProductQuantity(row.product_id);
  res.status(201).json({ success: true, data: row });
});

const updateProductWarehouse = asyncHandler(async (req, res) => {
  const row = await ProductWarehouse.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!row) throw new AppError('Resource not found', 404);

  await syncProductQuantity(row.product_id);
  res.json({ success: true, data: row });
});

const deleteProductWarehouse = asyncHandler(async (req, res) => {
  const row = await ProductWarehouse.findByIdAndDelete(req.params.id);
  if (!row) throw new AppError('Resource not found', 404);

  await syncProductQuantity(row.product_id);
  res.status(204).send();
});

module.exports = {
  productWarehouseRules,
  getProductWarehouses: getAll(ProductWarehouse, ['warehouse_id', 'product_id']),
  getProductWarehouse: getOne(ProductWarehouse, ['warehouse_id', 'product_id']),
  createProductWarehouse,
  updateProductWarehouse,
  deleteProductWarehouse,
};
