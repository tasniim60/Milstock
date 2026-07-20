const mongoose = require('mongoose');

const consumptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    consumed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    consumed_quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      trim: true,
      default: '',
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    consumption_date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      default: 'completed',
    },
    movement_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryMovement',
      default: null,
    },
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelled_at: {
      type: Date,
      default: null,
    },
    cancel_reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

consumptionSchema.pre('validate', function normalizeQuantity(next) {
  if (this.consumed_quantity === undefined && this.quantity !== undefined) {
    this.consumed_quantity = this.quantity;
  }
  if (this.quantity === undefined && this.consumed_quantity !== undefined) {
    this.quantity = this.consumed_quantity;
  }
  if (!this.consumed_by && this.user_id) {
    this.consumed_by = this.user_id;
  }
  next();
});

consumptionSchema.index({ product_id: 1 });
consumptionSchema.index({ warehouse_id: 1 });
consumptionSchema.index({ consumed_by: 1 });
consumptionSchema.index({ consumption_date: -1 });
consumptionSchema.index({ status: 1 });

module.exports = mongoose.model('Consumption', consumptionSchema);
