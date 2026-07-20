const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ['pending', 'accepted', 'rejected', 'approved', 'in_transfer', 'cancelled', 'in_delivery', 'delivered', 'completed'],
      default: 'pending',
    },
    request_type: {
      type: String,
      enum: ['warehouse_request', 'supplier_request', 'warehouse_transfer', 'provider'],
      default: 'warehouse_request',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source_warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    destination_warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    expected_delivery_date: {
      type: Date,
      default: null,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
