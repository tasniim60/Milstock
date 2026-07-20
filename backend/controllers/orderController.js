const { body } = require('express-validator');
const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const OrderStatusLog = require('../models/OrderStatusLog');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const InventoryMovement = require('../models/inventoryMovementModel');
const { getAll, getOne, deleteOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { adjustStock } = require('../services/inventoryService');
const { createNotification } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditLogService');
const { assertWarehouseAccess, requireAssignedWarehouse } = require('../utils/warehouseScope');
const { assertValidDate } = require('../utils/dateValidation');
const { getEffectiveProductUnitPrice } = require('../utils/productPricing');

const orderRules = [
  body('total_price').optional().isFloat({ min: 0 }).withMessage('Total price must be 0 or greater'),
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'approved', 'in_transfer', 'completed', 'cancelled', 'in_delivery', 'delivered']).withMessage('Invalid order status'),
  body('request_type').optional().isIn(['warehouse_request', 'supplier_request', 'warehouse_transfer', 'provider']).withMessage('Invalid request type'),
  body('user_id').optional().isMongoId().withMessage('Valid user_id is required'),
  body('supplier_id').optional().isMongoId().withMessage('Valid supplier_id is required'),
  body('source_warehouse').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid source_warehouse is required'),
  body('destination_warehouse').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid destination_warehouse is required'),
  body('expected_delivery_date').optional({ nullable: true, checkFalsy: true }).custom((value) => assertValidDate(value, 'Expected delivery date must be between 2000 and 2100')),
  body('items').optional().isArray().withMessage('Items must be an array'),
];

const orderPopulate = ['user_id', 'requested_by', 'provider_id', 'supplier_id', 'source_warehouse', 'destination_warehouse'];
const allowedStatuses = ['pending', 'accepted', 'rejected', 'approved', 'in_transfer', 'completed', 'cancelled', 'in_delivery', 'delivered'];
const allowedTransitions = {
  pending: ['approved', 'cancelled', 'rejected'],
  approved: ['in_transfer', 'completed', 'cancelled'],
  in_transfer: ['completed', 'cancelled'],
  accepted: ['in_delivery'],
  in_delivery: ['delivered'],
  delivered: [],
  completed: [],
  rejected: [],
  cancelled: [],
};

const statusAction = {
  approved: 'approved',
  cancelled: 'rejected',
  completed: 'delivered',
  accepted: 'accepted',
  rejected: 'rejected',
  in_transfer: 'in_transfer',
  in_delivery: 'in_delivery',
  delivered: 'delivered',
};

const isWarehouseRequest = (order) => ['warehouse_request', 'warehouse_transfer'].includes(order?.request_type);

const applyCompletedOrderInventory = async ({ order, userId }) => {
  const items = await OrderItem.find({ order_id: order._id }).populate('product_id');

  for (const item of items) {
    const product = await Product.findById(item.product_id);
    if (product) {
      await adjustStock({
        product_id: product._id,
        warehouse_id: product.warehouse_id,
        quantity: item.quantity,
        change_type: 'in',
        user_id: userId,
        reference_type: 'order_completed',
      });
    }
  }
};

const normalizeRequestType = (type) => {
  if (type === 'provider') return 'supplier_request';
  if (type === 'warehouse_transfer') return 'warehouse_request';
  return type || 'warehouse_request';
};

const createOrder = asyncHandler(async (req, res) => {
  const items = req.body.items || [];
  const requestType = normalizeRequestType(req.body.request_type);
  if (!items.length) {
    throw new AppError('At least one item is required', 400);
  }
  if (items.some((item) => Number(item.quantity) <= 0 || !item.product_id)) {
    throw new AppError('Each item must have a valid product and quantity greater than zero', 400);
  }

  const assignedWarehouseId = req.user?.role === 'unit' ? requireAssignedWarehouse(req) : null;
  const destinationWarehouse = assignedWarehouseId || req.body.destination_warehouse || null;

  if (req.user?.role === 'unit') {
    req.body.destination_warehouse = assignedWarehouseId;
  }
  const productsById = new Map(
    (await Product.find({ _id: { $in: items.map((item) => item.product_id).filter(Boolean) } }))
      .map((product) => [String(product._id), product])
  );
  if (productsById.size !== items.length) {
    throw new AppError('All requested products must exist', 400);
  }
  const total_price = items.reduce((sum, item) => {
    const product = productsById.get(String(item.product_id));
    return sum + Number(item.quantity) * getEffectiveProductUnitPrice(product);
  }, 0);

  if (requestType === 'supplier_request') {
    const supplier = await User.findById(req.body.supplier_id || req.body.provider_id);
    if (!supplier || supplier.role !== 'supplier' || supplier.status === 'inactive') {
      throw new AppError('A valid active supplier is required', 400);
    }
  }
  if (requestType === 'warehouse_request' && !req.body.source_warehouse) {
    throw new AppError('Source warehouse is required for warehouse requests', 400);
  }
  if (requestType === 'warehouse_request' && String(req.body.source_warehouse) === String(destinationWarehouse)) {
    throw new AppError('Source warehouse cannot match destination warehouse', 400);
  }
  if ((requestType === 'warehouse_request' || requestType === 'supplier_request') && !destinationWarehouse) {
    throw new AppError('Destination warehouse is required', 400);
  }

  const order = await Order.create({
    date: req.body.date,
    total_price,
    status: req.body.status || 'pending',
    request_type: requestType,
    user_id: req.user?.role === 'unit' ? req.user._id : req.body.user_id || req.user._id,
    requested_by: req.user?._id,
    provider_id: null,
    source_warehouse: req.body.source_warehouse || null,
    destination_warehouse: destinationWarehouse,
    notes: req.body.notes || '',
    expected_delivery_date: req.body.expected_delivery_date || null,
    supplier_id: requestType === 'supplier_request' ? req.body.supplier_id || req.body.provider_id : null,
  });

  if (items.length) {
    await OrderItem.insertMany(
      items.map((item) => {
        const product = productsById.get(String(item.product_id));
        const unitPrice = getEffectiveProductUnitPrice(product);
        return {
        order_id: order._id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: Number(item.quantity) * unitPrice,
      };
      })
    );
  }

  const notificationMetadata = {
    order_id: String(order._id),
    request_type: requestType,
    supplier_id: order.supplier_id ? String(order.supplier_id) : '',
    requested_by: order.requested_by ? String(order.requested_by) : '',
    status: order.status,
  };
  if (requestType === 'warehouse_request') {
    const admins = await User.find({ role: 'admin', status: { $ne: 'inactive' } }).select('_id');
    await Promise.all(admins.map((admin) => createNotification({
      title: 'New warehouse transfer request pending approval',
      type: 'warehouse_request',
      message: `Warehouse transfer request ${order._id} is pending approval.`,
      user_id: admin._id,
      metadata: notificationMetadata,
    })));
  } else {
    await createNotification({
      title: 'New supplier request assigned',
      type: 'supplier_order',
      message: `New supplier request ${order._id} is pending.`,
      user_id: order.supplier_id,
      metadata: notificationMetadata,
    });
  }

  await createAuditLog({
    req,
    action: requestType === 'supplier_request' ? 'create_supplier_request' : 'create_warehouse_request',
    module: 'requests',
    entityId: order._id,
    entityType: 'Order',
    description: `Created request ${order._id}`,
    newData: order,
  });

  const populated = await Order.findById(order._id).populate(orderPopulate);
  res.status(201).json({ success: true, data: populated });
});

const updateOrder = asyncHandler(async (req, res) => {
  const before = await Order.findById(req.params.id);
  if (!before) {
    throw new AppError('Order not found', 404);
  }
  await assertWarehouseAccess(req, Order, before);
  if (isWarehouseRequest(before) && req.body.status === 'completed') {
    throw new AppError('Complete warehouse transfers from Movement Logs', 400);
  }
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (before && order && before.status !== 'completed' && order.status === 'completed') {
    await applyCompletedOrderInventory({ order, userId: req.user._id });
  }

  if (before && order && before.status !== order.status) {
    await OrderStatusLog.create({
      order_id: order._id,
      previous_status: before.status,
      new_status: order.status,
      action: statusAction[order.status] || `status_changed_to_${order.status}`,
      changed_by: req.user?._id,
      note: req.body.note,
    });
  }

  await createAuditLog({
    req,
    action: before?.status !== order?.status ? 'status_transition' : 'update_request',
    module: 'requests',
    entityId: order?._id,
    entityType: 'Order',
    description: `Updated request ${order?._id}`,
    previousData: before,
    newData: order,
  });

  res.json({ success: true, data: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!allowedStatuses.includes(status)) {
    throw new AppError(`Invalid order status. Allowed statuses: ${allowedStatuses.join(', ')}`, 400);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  await assertWarehouseAccess(req, Order, order);

  const previousStatus = order.status;

  if (previousStatus === status) {
    const populated = await Order.findById(order._id).populate(orderPopulate);
    return res.json({
      success: true,
      data: populated,
      order: populated,
      log: null,
      message: `Order is already ${status}`,
    });
  }

  if (!allowedTransitions[previousStatus]?.includes(status)) {
    throw new AppError(`Cannot change order status from ${previousStatus} to ${status}`, 400);
  }
  if (isWarehouseRequest(order) && status === 'completed') {
    throw new AppError('Complete warehouse transfers from Movement Logs', 400);
  }

  order.status = status;
  await order.save();

  if (isWarehouseRequest(order) && previousStatus === 'pending' && status === 'approved') {
    await createPendingTransferMovements({ order, req, note });
  }

  if (isWarehouseRequest(order) && status === 'cancelled') {
    await InventoryMovement.updateMany(
      { order_id: order._id, movement_type: 'warehouse_transfer', status: 'pending' },
      {
        $set: {
          status: 'cancelled',
          note: note || 'Warehouse transfer cancelled',
        },
      }
    );
  }

  if (previousStatus !== 'completed' && status === 'completed') {
    await applyCompletedOrderInventory({ order, userId: req.user._id });
  }

  const log = await OrderStatusLog.create({
    order_id: order._id,
    previous_status: previousStatus,
    new_status: status,
    action: statusAction[status] || `status_changed_to_${status}`,
    changed_by: req.user?._id,
    note,
  });

  await createNotification({
    title: 'Order status updated',
    type: 'order',
    message: `Order ${order._id} changed from ${previousStatus} to ${status}.`,
    user_id: order.user_id,
    metadata: {
      order_id: String(order._id),
      request_type: order.request_type,
      status,
    },
  });

  await createAuditLog({
    req,
    action: statusAction[status] || `status_changed_to_${status}`,
    module: 'requests',
    entityId: order._id,
    entityType: 'Order',
    description: `Request ${order._id} changed from ${previousStatus} to ${status}`,
    previousData: { status: previousStatus },
    newData: { status },
  });

  const populated = await Order.findById(order._id).populate(orderPopulate);
  const populatedLog = await OrderStatusLog.findById(log._id).populate('changed_by');

  res.json({
    success: true,
    data: populated,
    order: populated,
    log: populatedLog,
  });
});

const createPendingTransferMovements = async ({ order, req, note }) => {
  const existing = await InventoryMovement.findOne({
    order_id: order._id,
    movement_type: 'warehouse_transfer',
  });
  if (existing) {
    return InventoryMovement.find({
      order_id: order._id,
      movement_type: 'warehouse_transfer',
    }).populate('product_id from_warehouse to_warehouse requested_by approved_by');
  }

  const items = await OrderItem.find({ order_id: order._id });
  const movements = await InventoryMovement.insertMany(items.map((item) => ({
    user_id: req.user._id,
    product_id: item.product_id,
    change_type: 'transfer',
    stock: item.quantity,
    reference_id: order.source_warehouse,
    reference_type: 'warehouse_transfer_pending',
    order_id: order._id,
    from_warehouse: order.source_warehouse,
    to_warehouse: order.destination_warehouse,
    requested_quantity: item.quantity,
    moved_quantity: 0,
    status: 'pending',
    movement_type: 'warehouse_transfer',
    requested_by: order.requested_by || order.user_id,
    approved_by: req.user._id,
    approved_at: new Date(),
    note: note || '',
  })));

  await createAuditLog({
    req,
    action: 'create_pending_movement',
    module: 'inventory',
    entityId: order._id,
    entityType: 'Order',
    description: `Created pending movement records for warehouse request ${order._id}`,
  });

  return InventoryMovement.find({
    _id: { $in: movements.map((movement) => movement._id) },
  }).populate('product_id from_warehouse to_warehouse requested_by approved_by');
};

const adminDecision = asyncHandler(async (req, res) => {
  const { decision, note } = req.body;
  if (!['approve', 'reject'].includes(decision)) {
    throw new AppError('Decision must be approve or reject', 400);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (!isWarehouseRequest(order)) {
    throw new AppError('Admin decision is only available for warehouse requests', 400);
  }
  if (order.status !== 'pending') {
    throw new AppError('Only pending warehouse requests can be approved or rejected', 400);
  }

  const previousStatus = order.status;
  order.status = decision === 'approve' ? 'approved' : 'rejected';
  await order.save();

  await OrderStatusLog.create({
    order_id: order._id,
    previous_status: previousStatus,
    new_status: order.status,
    action: decision === 'approve' ? 'approve_warehouse_request' : 'reject_warehouse_request',
    changed_by: req.user._id,
    note,
  });

  const movements = decision === 'approve'
    ? await createPendingTransferMovements({ order, req, note })
    : [];

  await createNotification({
    title: decision === 'approve' ? 'Warehouse request approved' : 'Warehouse request rejected',
    type: 'warehouse_request',
    message: decision === 'approve'
      ? 'Your warehouse request was approved and is waiting for movement completion.'
      : 'Your warehouse request was rejected.',
    user_id: order.requested_by || order.user_id,
    metadata: {
      order_id: String(order._id),
      request_type: order.request_type,
      status: order.status,
    },
  });

  await createAuditLog({
    req,
    action: decision === 'approve' ? 'approve_warehouse_request' : 'reject_warehouse_request',
    module: 'requests',
    entityId: order._id,
    entityType: 'Order',
    description: `${decision === 'approve' ? 'Approved' : 'Rejected'} warehouse request ${order._id}`,
    previousData: { status: previousStatus },
    newData: { status: order.status },
  });

  const populated = await Order.findById(order._id).populate(orderPopulate);
  res.json({ success: true, data: populated, order: populated, movements });
});

const getOrderStatusLogs = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  await assertWarehouseAccess(req, Order, order);

  const logs = await OrderStatusLog.find({ order_id: req.params.id })
    .populate('changed_by')
    .sort('-createdAt');

  res.json({ success: true, count: logs.length, data: logs, logs });
});

const supplierTransitions = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_delivery'],
  in_delivery: ['delivered'],
  rejected: [],
  delivered: [],
};

const getSupplierOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    request_type: { $in: ['supplier_request', 'provider'] },
    $or: [{ supplier_id: req.user._id }, { provider_id: req.user._id }],
  })
    .populate(orderPopulate)
    .sort('-createdAt');
  res.json({ success: true, count: orders.length, data: orders });
});

const getSupplierOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    request_type: { $in: ['supplier_request', 'provider'] },
    $or: [{ supplier_id: req.user._id }, { provider_id: req.user._id }],
  }).populate(orderPopulate);

  if (!order) {
    throw new AppError('Supplier order not found', 404);
  }

  res.json({ success: true, data: order });
});

const updateSupplierOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['accepted', 'rejected', 'in_delivery', 'delivered'].includes(status)) {
    throw new AppError('Invalid supplier status', 400);
  }

  const order = await Order.findOne({
    _id: req.params.id,
    request_type: { $in: ['supplier_request', 'provider'] },
    $or: [{ supplier_id: req.user._id }, { provider_id: req.user._id }],
  });

  if (!order) {
    throw new AppError('Supplier order not found', 404);
  }

  const previousStatus = order.status;
  if (!supplierTransitions[previousStatus]?.includes(status)) {
    throw new AppError(`Cannot change supplier order status from ${previousStatus} to ${status}`, 400);
  }

  order.status = status;
  await order.save();

  const action = `supplier_mark_${status}`;
  await OrderStatusLog.create({
    order_id: order._id,
    previous_status: previousStatus,
    new_status: status,
    action,
    changed_by: req.user._id,
    note,
  });

  await createNotification({
    title: 'Supplier request updated',
    type: 'supplier_order',
    message: `Supplier ${status.replace('_', ' ')} your request ${order._id}.`,
    user_id: order.requested_by || order.user_id,
    metadata: {
      order_id: String(order._id),
      request_type: order.request_type,
      supplier_id: String(order.supplier_id || order.provider_id),
      requested_by: String(order.requested_by || order.user_id),
      status,
    },
  });

  await createAuditLog({
    req,
    action,
    module: 'requests',
    entityId: order._id,
    entityType: 'Order',
    description: `Supplier changed request ${order._id} from ${previousStatus} to ${status}`,
    previousData: { status: previousStatus },
    newData: { status },
  });

  const populated = await Order.findById(order._id).populate(orderPopulate);
  res.json({ success: true, data: populated, order: populated });
});

module.exports = {
  orderRules,
  getOrders: getAll(Order, orderPopulate),
  getOrder: getOne(Order, orderPopulate),
  createOrder,
  updateOrder,
  updateOrderStatus,
  adminDecision,
  getOrderStatusLogs,
  getSupplierOrders,
  getSupplierOrder,
  updateSupplierOrderStatus,
  deleteOrder: deleteOne(Order),
};
