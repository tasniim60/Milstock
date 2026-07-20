const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    reason: {
      type: String,
      required: true,
      enum: ['expired', 'damaged'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

wasteSchema.index({ product: 1 });
wasteSchema.index({ reason: 1 });
wasteSchema.index({ createdBy: 1 });
wasteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Waste', wasteSchema);
