const { body } = require('express-validator');
const OrderItem = require('../models/orderItemModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { getAll, getOne, deleteOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { assertWarehouseAccess, requireAssignedWarehouse } = require('../utils/warehouseScope');

const orderItemRules = [
  body('order_id').optional().isMongoId().withMessage('Valid order_id is required'),
  body('product_id').optional().isMongoId().withMessage('Valid product_id is required'),
  body('quantity').optional().isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
  body('total_price').optional().isFloat({ min: 0 }).withMessage('Total price must be 0 or greater'),
];

const recalculateOrderTotal = async (orderId) => {
  const items = await OrderItem.find({ order_id: orderId });
  const total_price = items.reduce((sum, item) => sum + item.total_price, 0);
  await Order.findByIdAndUpdate(orderId, { total_price }, { runValidators: true });
};

const getProductUnitPrice = (product) =>
  Number(product?.price ?? product?.unit_price ?? product?.cost ?? product?.purchase_price ?? product?.supplier_price ?? 0);

const createOrderItem = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
  };
  const selectedProduct = await Product.findById(payload.product_id);
  payload.unit_price = getProductUnitPrice(selectedProduct);
  payload.total_price = Number(payload.quantity) * payload.unit_price;
  if (req.user?.role === 'unit') {
    const warehouseId = requireAssignedWarehouse(req);
    const product = await Product.findById(payload.product_id);
    const order = await Order.findById(payload.order_id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    await assertWarehouseAccess(req, Order, order);
    if (!product || String(product.warehouse_id) !== warehouseId) {
      throw new AppError('Unit users can only add products from their assigned warehouse', 403);
    }
  }
  const item = await OrderItem.create(payload);
  await recalculateOrderTotal(item.order_id);
  res.status(201).json({ success: true, data: item });
});

const updateOrderItem = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const existing = await OrderItem.findById(req.params.id);
  if (!existing) {
    throw new AppError('Order item not found', 404);
  }
  await assertWarehouseAccess(req, OrderItem, existing);
  if (payload.quantity !== undefined || payload.unit_price !== undefined) {
    const quantity = payload.quantity ?? existing.quantity;
    const product = await Product.findById(payload.product_id || existing.product_id);
    payload.unit_price = getProductUnitPrice(product);
    payload.total_price = Number(quantity) * payload.unit_price;
  }
  if (req.user?.role === 'unit' && payload.product_id) {
    const warehouseId = requireAssignedWarehouse(req);
    const product = await Product.findById(payload.product_id);
    if (!product || String(product.warehouse_id) !== warehouseId) {
      throw new AppError('Unit users can only add products from their assigned warehouse', 403);
    }
  }

  const item = await OrderItem.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  await recalculateOrderTotal(item.order_id);
  res.json({ success: true, data: item });
});

module.exports = {
  orderItemRules,
  getOrderItems: getAll(OrderItem, ['order_id', 'product_id']),
  getOrderItem: getOne(OrderItem, ['order_id', 'product_id']),
  createOrderItem,
  updateOrderItem,
  deleteOrderItem: deleteOne(OrderItem),
};
