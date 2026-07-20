const mongoose = require('mongoose');
const { body } = require('express-validator');
const Consumption = require('../models/consumptionModel');
const Product = require('../models/productModel');
const ProductWarehouse = require('../models/productWarehouseModel');
const Warehouse = require('../models/warehouseModel');
const User = require('../models/userModel');
const InventoryMovement = require('../models/inventoryMovementModel');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { syncProductQuantity } = require('../services/inventoryService');
const { createNotification } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditLogService');
const { assertWarehouseAccess, enforcePayloadWarehouse, getAssignedWarehouseId } = require('../utils/warehouseScope');
const { assertDateRange, assertValidDate } = require('../utils/dateValidation');

const consumptionPopulate = ['user_id', 'consumed_by', 'product_id', 'warehouse_id', 'movement_id', 'cancelled_by'];

const consumptionRules = [
  body('product_id').isMongoId().withMessage('Valid product_id is required'),
  body('warehouse_id').optional().isMongoId().withMessage('Valid warehouse_id is required'),
  body('consumed_quantity').optional().isFloat({ min: 0.000001 }).withMessage('Consumed quantity must be greater than zero'),
  body('quantity').optional().isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than zero'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('department').optional().trim(),
  body('notes').optional().trim(),
];

const cancelRules = [
  body('reason').optional().trim(),
  body('note').optional().trim(),
];

const updateRules = [
  body('consumed_quantity').optional().isFloat({ min: 0.000001 }).withMessage('Consumed quantity must be greater than zero'),
  body('quantity').optional().isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than zero'),
  body('reason').optional().trim().notEmpty().withMessage('Reason cannot be empty'),
  body('department').optional().trim(),
  body('notes').optional().trim(),
];

const getConsumptionQuantity = (payload) => Number(payload.consumed_quantity ?? payload.quantity ?? 0);

const buildConsumptionFilter = (req) => {
  if (req.user?.role === 'supplier') {
    throw new AppError('Suppliers cannot access consumption records', 403);
  }

  const filter = {};
  const {
    warehouse_id,
    product_id,
    consumed_by,
    status,
    reason,
    dateFrom,
    dateTo,
  } = req.query;

  if (warehouse_id) filter.warehouse_id = warehouse_id;
  if (product_id) filter.product_id = product_id;
  if (consumed_by) filter.consumed_by = consumed_by;
  if (status) filter.status = status;
  if (reason) filter.reason = reason;
  if (dateFrom || dateTo) {
    try {
      assertDateRange(dateFrom, dateTo, 'Date From cannot be after Date To');
    } catch (error) {
      throw new AppError(error.message, 400);
    }
    filter.consumption_date = {};
    if (dateFrom) filter.consumption_date.$gte = new Date(dateFrom);
    if (dateTo) filter.consumption_date.$lte = new Date(dateTo);
  }

  if (req.user?.role === 'unit') {
    const assignedWarehouse = getAssignedWarehouseId(req);
    if (!assignedWarehouse) {
      throw new AppError('No warehouse assigned to this user. Please contact admin.', 403);
    }
    if (warehouse_id && String(warehouse_id) !== String(assignedWarehouse)) {
      throw new AppError('You do not have permission to access consumption records for another warehouse', 403);
    }
    filter.warehouse_id = assignedWarehouse;
  }

  return filter;
};

const notifyLowStockAfterConsumption = async ({
  req,
  product,
  warehouse,
  oldQuantity,
  newQuantity,
  consumedQuantity,
}) => {
  const settings = product.alert_settings || {};
  const lowStockThreshold = Number(settings.low_stock_threshold ?? product.min_quantity ?? 0);
  const criticalStockThreshold = Number(settings.critical_stock_threshold ?? 0);
  if (!lowStockThreshold || newQuantity > lowStockThreshold) return;

  const severity = criticalStockThreshold && newQuantity <= criticalStockThreshold ? 'critical' : 'warning';
  const admins = await User.find({ role: 'admin', status: { $ne: 'inactive' } }).select('_id');
  const recipients = new Map();
  admins.forEach((admin) => recipients.set(String(admin._id), admin._id));
  if (req.user?._id) recipients.set(String(req.user._id), req.user._id);

  await Promise.all(Array.from(recipients.values()).map((userId) => createNotification({
    title: severity === 'critical' ? 'Critical Stock After Consumption' : 'Low Stock After Consumption',
    titleAr: severity === 'critical' ? 'مخزون حرج بعد الاستهلاك' : 'انخفاض في المخزون بعد الاستهلاك',
    titleKey: 'LOW_STOCK_TITLE',
    type: 'low_stock',
    severity,
    message: `${product.name} stock in ${warehouse.name} is now ${newQuantity} ${product.unit}.`,
    messageAr: product.nameAr
      ? `مخزون ${product.nameAr} في ${warehouse.nameAr || warehouse.name} أصبح ${newQuantity} ${product.unit}.`
      : '',
    messageKey: 'LOW_STOCK_MESSAGE',
    user_id: userId,
    item_id: product._id,
    entity_id: String(product._id),
    entity_type: 'item',
    status: 'unread',
    is_read: false,
    notification_key: `consumption_low_stock:${product._id}:${warehouse._id}:${Date.now()}:${userId}`,
    metadata: {
      product_id: String(product._id),
      warehouse_id: String(warehouse._id),
      item_name: product.name,
      item_name_ar: product.nameAr || '',
      warehouse_name: warehouse.name,
      warehouse_name_ar: warehouse.nameAr || '',
      old_quantity: oldQuantity,
      new_quantity: newQuantity,
      consumed_quantity: consumedQuantity,
      unit: product.unit,
    },
    params: {
      itemName: product.name,
      itemNameAr: product.nameAr || '',
      warehouseName: warehouse.name,
      warehouseNameAr: warehouse.nameAr || '',
      currentStock: newQuantity,
      unit: product.unit,
    },
  })));
};

const getConsumptions = asyncHandler(async (req, res) => {
  const filter = buildConsumptionFilter(req);
  const consumptions = await Consumption.find(filter)
    .populate(consumptionPopulate)
    .sort('-consumption_date -createdAt');

  res.json({ success: true, count: consumptions.length, data: consumptions });
});

const getMyConsumptions = asyncHandler(async (req, res) => {
  if (req.user?.role === 'supplier') {
    throw new AppError('Suppliers cannot access consumption records', 403);
  }
  const warehouseId = getAssignedWarehouseId(req);
  const filter = req.user?.role === 'unit'
    ? { warehouse_id: warehouseId }
    : { consumed_by: req.user._id };
  if (req.user?.role === 'unit' && !warehouseId) {
    throw new AppError('No warehouse assigned to this user. Please contact admin.', 403);
  }

  const consumptions = await Consumption.find(filter)
    .populate(consumptionPopulate)
    .sort('-consumption_date -createdAt');

  res.json({ success: true, count: consumptions.length, data: consumptions });
});

const getConsumption = asyncHandler(async (req, res) => {
  if (req.user?.role === 'supplier') {
    throw new AppError('Suppliers cannot access consumption records', 403);
  }
  const consumption = await Consumption.findById(req.params.id).populate(consumptionPopulate);
  if (!consumption) {
    throw new AppError('Consumption record not found', 404);
  }
  await assertWarehouseAccess(req, Consumption, consumption);
  res.json({ success: true, data: consumption });
});

const createConsumption = asyncHandler(async (req, res) => {
  if (req.user?.role === 'supplier') {
    throw new AppError('Suppliers cannot consume stock', 403);
  }

  const payload = { ...req.body };
  enforcePayloadWarehouse(req, payload);
  try {
    assertValidDate(payload.consumption_date, 'Consumption date must be a valid date');
  } catch (error) {
    throw new AppError(error.message, 400);
  }
  const consumedQuantity = getConsumptionQuantity(payload);
  if (!consumedQuantity || consumedQuantity <= 0) {
    throw new AppError('Consumed quantity must be greater than zero', 400);
  }

  const session = await mongoose.startSession();
  let createdConsumption;
  let updatedStock;
  let product;
  let warehouse;
  let oldQuantity = 0;

  try {
    await session.withTransaction(async () => {
      product = await Product.findById(payload.product_id).session(session);
      if (!product) throw new AppError('Product not found', 404);

      warehouse = await Warehouse.findById(payload.warehouse_id).session(session);
      if (!warehouse) throw new AppError('Warehouse not found', 404);

      const stockRow = await ProductWarehouse.findOne({
        product_id: product._id,
        warehouse_id: warehouse._id,
      }).session(session);

      if (!stockRow) {
        throw new AppError('Product is not available in this warehouse', 400);
      }
      if (Number(stockRow.quantity) < consumedQuantity) {
        throw new AppError('Insufficient stock', 400);
      }

      oldQuantity = Number(stockRow.quantity);
      stockRow.quantity = oldQuantity - consumedQuantity;
      await stockRow.save({ session });
      updatedStock = stockRow;

      await syncProductQuantity(product._id, session);

      const [movement] = await InventoryMovement.create([{
        user_id: req.user._id,
        performed_by: req.user._id,
        product_id: product._id,
        change_type: 'out',
        stock: consumedQuantity,
        reference_id: warehouse._id,
        reference_type: 'consumption',
        from_warehouse: warehouse._id,
        to_warehouse: null,
        requested_quantity: consumedQuantity,
        moved_quantity: consumedQuantity,
        status: 'completed',
        movement_type: 'consumption',
        completed_by: req.user._id,
        completed_at: new Date(),
        note: payload.reason || payload.notes || '',
      }], { session });

      const [consumption] = await Consumption.create([{
        user_id: req.user._id,
        consumed_by: req.user._id,
        product_id: product._id,
        warehouse_id: warehouse._id,
        quantity: consumedQuantity,
        consumed_quantity: consumedQuantity,
        unit: product.unit,
        reason: payload.reason,
        department: payload.department || '',
        notes: payload.notes || '',
        consumption_date: payload.consumption_date || new Date(),
        status: 'completed',
        movement_id: movement._id,
      }], { session });

      createdConsumption = consumption;
    });
  } finally {
    await session.endSession();
  }

  await createAuditLog({
    req,
    action: 'record_consumption',
    module: 'consumption',
    entityId: createdConsumption._id,
    entityType: 'Consumption',
    description: `Recorded consumption for ${product.name}`,
    newData: createdConsumption,
  });
  await createAuditLog({
    req,
    action: 'stock_decreased_due_to_consumption',
    module: 'inventory',
    entityId: product._id,
    entityType: 'Product',
    description: `Decreased ${product.name} stock in ${warehouse.name} due to consumption`,
    newData: {
      product_id: product._id,
      warehouse_id: warehouse._id,
      old_quantity: oldQuantity,
      new_quantity: updatedStock.quantity,
      consumed_quantity: consumedQuantity,
      unit: product.unit,
    },
  });
  await notifyLowStockAfterConsumption({
    req,
    product,
    warehouse,
    oldQuantity,
    newQuantity: updatedStock.quantity,
    consumedQuantity,
  });

  const populated = await Consumption.findById(createdConsumption._id).populate(consumptionPopulate);
  res.status(201).json({
    success: true,
    data: populated,
    stock: updatedStock,
  });
});

const cancelConsumption = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'admin') {
    throw new AppError('Only admin can cancel consumption records', 403);
  }

  const session = await mongoose.startSession();
  let consumption;
  let stockRow;
  let product;
  let warehouse;

  try {
    await session.withTransaction(async () => {
      consumption = await Consumption.findById(req.params.id).session(session);
      if (!consumption) throw new AppError('Consumption record not found', 404);
      if (consumption.status === 'cancelled') {
        throw new AppError('Consumption already cancelled', 400);
      }

      product = await Product.findById(consumption.product_id).session(session);
      warehouse = await Warehouse.findById(consumption.warehouse_id).session(session);
      if (!product || !warehouse) {
        throw new AppError('Related product or warehouse was not found', 404);
      }

      stockRow = await ProductWarehouse.findOne({
        product_id: consumption.product_id,
        warehouse_id: consumption.warehouse_id,
      }).session(session);
      if (!stockRow) {
        [stockRow] = await ProductWarehouse.create([{
          product_id: consumption.product_id,
          warehouse_id: consumption.warehouse_id,
          quantity: 0,
        }], { session });
      }

      stockRow.quantity += Number(consumption.consumed_quantity || consumption.quantity || 0);
      await stockRow.save({ session });
      await syncProductQuantity(consumption.product_id, session);

      const [movement] = await InventoryMovement.create([{
        user_id: req.user._id,
        performed_by: req.user._id,
        product_id: consumption.product_id,
        change_type: 'in',
        stock: Number(consumption.consumed_quantity || consumption.quantity || 0),
        reference_id: consumption.warehouse_id,
        reference_type: 'consumption_cancelled',
        from_warehouse: null,
        to_warehouse: consumption.warehouse_id,
        requested_quantity: Number(consumption.consumed_quantity || consumption.quantity || 0),
        moved_quantity: Number(consumption.consumed_quantity || consumption.quantity || 0),
        status: 'completed',
        movement_type: 'consumption_cancelled',
        completed_by: req.user._id,
        completed_at: new Date(),
        note: req.body.reason || req.body.note || '',
      }], { session });

      consumption.status = 'cancelled';
      consumption.cancelled_by = req.user._id;
      consumption.cancelled_at = new Date();
      consumption.cancel_reason = req.body.reason || req.body.note || '';
      consumption.movement_id = consumption.movement_id || movement._id;
      await consumption.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await createAuditLog({
    req,
    action: 'cancel_consumption',
    module: 'consumption',
    entityId: consumption._id,
    entityType: 'Consumption',
    description: `Cancelled consumption for ${product.name}`,
    newData: consumption,
  });
  await createAuditLog({
    req,
    action: 'stock_restored_due_to_consumption_cancellation',
    module: 'inventory',
    entityId: product._id,
    entityType: 'Product',
    description: `Restored ${product.name} stock in ${warehouse.name} after consumption cancellation`,
    newData: {
      product_id: product._id,
      warehouse_id: warehouse._id,
      restored_quantity: consumption.consumed_quantity || consumption.quantity,
      new_quantity: stockRow.quantity,
      unit: product.unit,
    },
  });

  const populated = await Consumption.findById(consumption._id).populate(consumptionPopulate);
  res.json({ success: true, data: populated, stock: stockRow });
});

const updateConsumption = asyncHandler(async (req, res) => {
  if (req.user?.role === 'supplier') {
    throw new AppError('Suppliers cannot update consumption records', 403);
  }

  const session = await mongoose.startSession();
  let consumption;
  let stockRow;
  let product;
  let warehouse;
  let oldQuantity = 0;
  let newQuantity = 0;
  let delta = 0;

  try {
    await session.withTransaction(async () => {
      consumption = await Consumption.findById(req.params.id).session(session);
      if (!consumption) throw new AppError('Consumption record not found', 404);
      if (consumption.status === 'cancelled') {
        throw new AppError('Cancelled consumption records cannot be edited', 400);
      }

      await assertWarehouseAccess(req, Consumption, consumption);

      product = await Product.findById(consumption.product_id).session(session);
      warehouse = await Warehouse.findById(consumption.warehouse_id).session(session);
      if (!product || !warehouse) {
        throw new AppError('Related product or warehouse was not found', 404);
      }

      stockRow = await ProductWarehouse.findOne({
        product_id: consumption.product_id,
        warehouse_id: consumption.warehouse_id,
      }).session(session);
      if (!stockRow) {
        throw new AppError('Product is not available in this warehouse', 400);
      }

      oldQuantity = Number(consumption.consumed_quantity || consumption.quantity || 0);
      newQuantity = getConsumptionQuantity(req.body) || oldQuantity;
      if (!newQuantity || newQuantity <= 0) {
        throw new AppError('Consumed quantity must be greater than zero', 400);
      }

      const availableIncludingOriginal = Number(stockRow.quantity || 0) + oldQuantity;
      if (newQuantity > availableIncludingOriginal) {
        throw new AppError('Insufficient stock for updated consumption quantity', 400);
      }

      delta = newQuantity - oldQuantity;
      if (delta !== 0) {
        stockRow.quantity = Number(stockRow.quantity || 0) - delta;
        await stockRow.save({ session });
        await syncProductQuantity(consumption.product_id, session);

        const [movement] = await InventoryMovement.create([{
          user_id: req.user._id,
          performed_by: req.user._id,
          product_id: consumption.product_id,
          change_type: delta > 0 ? 'out' : 'in',
          stock: Math.abs(delta),
          reference_id: consumption.warehouse_id,
          reference_type: 'consumption_update',
          from_warehouse: delta > 0 ? consumption.warehouse_id : null,
          to_warehouse: delta > 0 ? null : consumption.warehouse_id,
          requested_quantity: Math.abs(delta),
          moved_quantity: Math.abs(delta),
          status: 'completed',
          movement_type: 'consumption',
          completed_by: req.user._id,
          completed_at: new Date(),
          note: req.body.reason || req.body.notes || 'Consumption record updated',
        }], { session });
        consumption.movement_id = movement._id;
      }

      consumption.quantity = newQuantity;
      consumption.consumed_quantity = newQuantity;
      if (req.body.reason !== undefined) consumption.reason = req.body.reason;
      if (req.body.department !== undefined) consumption.department = req.body.department;
      if (req.body.notes !== undefined) consumption.notes = req.body.notes;
      await consumption.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await createAuditLog({
    req,
    action: 'edit_consumption',
    module: 'consumption',
    entityId: consumption._id,
    entityType: 'Consumption',
    description: `Edited consumption for ${product.name}`,
    newData: {
      consumption,
      old_quantity: oldQuantity,
      new_quantity: newQuantity,
      stock_delta: delta,
    },
  });

  if (delta !== 0) {
    await notifyLowStockAfterConsumption({
      req,
      product,
      warehouse,
      oldQuantity: Number(stockRow.quantity || 0) + delta,
      newQuantity: stockRow.quantity,
      consumedQuantity: Math.abs(delta),
    });
  }

  const populated = await Consumption.findById(consumption._id).populate(consumptionPopulate);
  res.json({ success: true, data: populated, stock: stockRow });
});

module.exports = {
  consumptionRules,
  cancelRules,
  updateRules,
  getConsumptions,
  getMyConsumptions,
  getConsumption,
  createConsumption,
  cancelConsumption,
  updateConsumption,
  deleteConsumption: asyncHandler(async (_req, res) => {
    res.status(405).json({ success: false, message: 'Consumption records cannot be deleted. Use cancel instead.' });
  }),
};
