const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleAr: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    messageAr: {
      type: String,
      trim: true,
      default: '',
    },
    titleKey: {
      type: String,
      trim: true,
      default: '',
    },
    messageKey: {
      type: String,
      trim: true,
      default: '',
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
    },
    notification_key: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical', 'success'],
      default: 'info',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    entity_id: {
      type: String,
      trim: true,
      default: '',
    },
    entity_type: {
      type: String,
      trim: true,
      default: '',
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
