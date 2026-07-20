const { body } = require('express-validator');
const mongoose = require('mongoose');
const InventoryMovement = require('../models/inventoryMovementModel');
const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const OrderStatusLog = require('../models/OrderStatusLog');
const ProductWarehouse = require('../models/productWarehouseModel');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { syncProductQuantity } = require('../services/inventoryService');
const { createNotification } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditLogService');

const inventoryMovementRules = [
  body('user_id').optional().isMongoId().withMessage('Valid user_id is required'),
  body('product_id').optional().isMongoId().withMessage('Valid product_id is required'),
  body('change_type').optional().isIn(['in', 'out', 'transfer']).withMessage('Change type must be in, out, or transfer'),
  body('stock').optional().isFloat({ min: 0 }).withMessage('Stock must be 0 or greater'),
  body('reference_id').optional().isMongoId().withMessage('Valid reference_id is required'),
  body('reference_type').optional().trim(),
  body('order_id').optional().isMongoId().withMessage('Valid order_id is required'),
  body('from_warehouse').optional().isMongoId().withMessage('Valid from_warehouse is required'),
  body('to_warehouse').optional().isMongoId().withMessage('Valid to_warehouse is required'),
  body('status').optional().isIn(['pending', 'completed', 'cancelled', 'failed']).withMessage('Invalid movement status'),
  body('movement_type').optional().isIn(['stock_adjustment', 'warehouse_transfer', 'consumption', 'consumption_cancelled']).withMessage('Invalid movement type'),
];

const completeTransfer = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  const { note } = req.body;

  try {
    let completedOrder;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.orderId).session(session);
      if (!order) throw new AppError('Order not found', 404);
      if (!['warehouse_request', 'warehouse_transfer'].includes(order.request_type)) {
        throw new AppError('Only warehouse requests can be completed from Movement Logs', 400);
      }
      if (order.status === 'completed') {
        throw new AppError('Movement already completed', 400);
      }
      if (!['approved', 'in_transfer'].includes(order.status)) {
        throw new AppError('Only approved warehouse requests can be completed', 400);
      }

      const pendingMovements = await InventoryMovement.find({
        order_id: order._id,
        movement_type: 'warehouse_transfer',
        status: 'pending',
      }).session(session);

      if (!pendingMovements.length) {
        const completedMovement = await InventoryMovement.findOne({
          order_id: order._id,
          movement_type: 'warehouse_transfer',
          status: 'completed',
        }).session(session);
        if (completedMovement) throw new AppError('Movement already completed', 400);
        throw new AppError('No pending movement found for this request', 404);
      }

      const items = await OrderItem.find({ order_id: order._id }).populate('product_id').session(session);
      for (const item of items) {
        const sourceRow = await ProductWarehouse.findOne({
          product_id: item.product_id?._id || item.product_id,
          warehouse_id: order.source_warehouse,
        }).session(session);

        if (!sourceRow || sourceRow.quantity < item.quantity) {
          const productName = item.product_id?.name || 'requested product';
          const available = Number(sourceRow?.quantity || 0);
          throw new AppError(`Insufficient stock for ${productName}. Required ${item.quantity}, available ${available}.`, 400);
        }

        let destinationRow = await ProductWarehouse.findOne({
          product_id: item.product_id?._id || item.product_id,
          warehouse_id: order.destination_warehouse,
        }).session(session);

        if (!destinationRow) {
          [destinationRow] = await ProductWarehouse.create([{
            product_id: item.product_id?._id || item.product_id,
            warehouse_id: order.destination_warehouse,
            quantity: 0,
          }], { session });
        }

        sourceRow.quantity -= item.quantity;
        destinationRow.quantity += item.quantity;
        await sourceRow.save({ session });
        await destinationRow.save({ session });
        await syncProductQuantity(item.product_id?._id || item.product_id, session);

        await createAuditLog({
          req,
          action: 'decrease_source_stock',
          module: 'inventory',
          entityId: item.product_id?._id || item.product_id,
          entityType: 'Product',
          description: `Decreased source stock for transfer ${order._id}`,
          newData: { quantity: item.quantity, warehouse_id: order.source_warehouse },
        });
        await createAuditLog({
          req,
          action: 'increase_destination_stock',
          module: 'inventory',
          entityId: item.product_id?._id || item.product_id,
          entityType: 'Product',
          description: `Increased destination stock for transfer ${order._id}`,
          newData: { quantity: item.quantity, warehouse_id: order.destination_warehouse },
        });
      }

      await InventoryMovement.updateMany(
        { order_id: order._id, movement_type: 'warehouse_transfer', status: 'pending' },
        {
          $set: {
            status: 'completed',
            completed_by: req.user._id,
            completed_at: new Date(),
            note: note || '',
            reference_type: 'warehouse_transfer_completed',
          },
        },
        { session }
      );

      const movementRows = await InventoryMovement.find({
        order_id: order._id,
        movement_type: 'warehouse_transfer',
      }).session(session);

      for (const movement of movementRows) {
        movement.moved_quantity = movement.requested_quantity;
        await movement.save({ session });
      }

      const previousStatus = order.status;
      order.status = 'completed';
      await order.save({ session });

      await OrderStatusLog.create([{
        order_id: order._id,
        previous_status: previousStatus,
        new_status: 'completed',
        action: 'complete_movement_from_movement_logs',
        changed_by: req.user._id,
        note,
      }], { session });

      completedOrder = order;
    });

    await createNotification({
      title: 'Warehouse transfer completed',
      type: 'warehouse_request',
      message: 'Your warehouse transfer has been completed.',
      user_id: completedOrder.requested_by || completedOrder.user_id,
      metadata: {
        order_id: String(completedOrder._id),
        request_type: completedOrder.request_type,
        status: completedOrder.status,
      },
    });

    await createAuditLog({
      req,
      action: 'complete_movement_from_movement_logs',
      module: 'inventory',
      entityId: completedOrder._id,
      entityType: 'Order',
      description: `Completed warehouse transfer ${completedOrder._id} from Movement Logs`,
      newData: { status: 'completed' },
    });

    const populated = await Order.findById(completedOrder._id)
      .populate('user_id requested_by source_warehouse destination_warehouse supplier_id');
    res.json({ success: true, data: populated, order: populated });
  } finally {
    await session.endSession();
  }
});

module.exports = {
  inventoryMovementRules,
  getInventoryMovements: getAll(InventoryMovement, ['user_id', 'product_id', 'reference_id', 'order_id', 'from_warehouse', 'to_warehouse', 'requested_by', 'approved_by', 'completed_by']),
  getInventoryMovement: getOne(InventoryMovement, ['user_id', 'product_id', 'reference_id', 'order_id', 'from_warehouse', 'to_warehouse', 'requested_by', 'approved_by', 'completed_by']),
  createInventoryMovement: createOne(InventoryMovement),
  updateInventoryMovement: updateOne(InventoryMovement),
  completeTransfer,
  deleteInventoryMovement: deleteOne(InventoryMovement),
};
