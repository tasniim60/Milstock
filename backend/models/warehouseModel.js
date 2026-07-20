const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    nameAr: {
      type: String,
      trim: true,
      default: '',
    },
    code: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    locationAr: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
