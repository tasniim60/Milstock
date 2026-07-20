const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    change_type: {
      type: String,
      required: true,
      trim: true,
      enum: ['in', 'out', 'transfer'],
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    reference_type: {
      type: String,
      trim: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    from_warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    to_warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    requested_quantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    moved_quantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'failed'],
      default: 'completed',
    },
    movement_type: {
      type: String,
      enum: ['stock_adjustment', 'warehouse_transfer', 'consumption', 'consumption_cancelled'],
      default: 'stock_adjustment',
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
    },
    completed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
