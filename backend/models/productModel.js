const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    nameAr: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      enum: ['kg', 'g', 'liter', 'Tons', 'piece', 'box'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryAr: {
      type: String,
      trim: true,
      default: '',
    },
    min_quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    alert_settings: {
      low_stock_threshold: {
        type: Number,
        min: 0,
        default: 0,
      },
      critical_stock_threshold: {
        type: Number,
        min: 0,
        default: 0,
      },
      expiration_warning_days: {
        type: Number,
        min: 0,
        default: 30,
      },
      critical_expiration_days: {
        type: Number,
        min: 0,
        default: 7,
      },
    },
    unit_price: {
      type: Number,
      min: 0,
      default: 0,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    warehouse_name: {
      type: String,
      trim: true,
      default: '',
    },
    storage_section: {
      type: String,
      trim: true,
      default: '',
    },
    expiry_date: {
      type: Date,
    },
    expiration_date: {
      type: Date,
      default: null,
    },
    manufacturing_date: {
      type: Date,
      default: null,
    },
    batch_number: {
      type: String,
      trim: true,
      default: '',
    },
    serial_number: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    descriptionAr: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
