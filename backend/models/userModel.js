const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    nameAr: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
      select: false,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    military_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      enum: ['admin', 'unit', 'supplier'],
      default: 'unit',
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    assigned_warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      required() {
        return this.role === 'unit';
      },
    },
    assigned_warehouse_name: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('validate', function normalizeAssignedWarehouse(next) {
  if (this.role === 'admin' && this.assigned_warehouse === '') {
    this.assigned_warehouse = null;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
