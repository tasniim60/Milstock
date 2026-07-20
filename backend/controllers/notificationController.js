const { body } = require('express-validator');
const Notification = require('../models/notificationModel');
const { getOne, createOne, updateOne, deleteOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const { generateExpirationNotifications } = require('../services/expirationNotificationService');
const { createAuditLog } = require('../services/auditLogService');
const Product = require('../models/productModel');
const { requireAssignedWarehouse } = require('../utils/warehouseScope');

const notificationRules = [
  body('title').optional().trim().notEmpty().withMessage('Title is required'),
  body('titleAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('type').optional().trim().notEmpty().withMessage('Type is required'),
  body('message').optional().trim().notEmpty().withMessage('Message is required'),
  body('messageAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('titleKey').optional({ nullable: true, checkFalsy: true }).trim(),
  body('messageKey').optional({ nullable: true, checkFalsy: true }).trim(),
  body('is_read').optional().isBoolean().withMessage('is_read must be boolean'),
  body('user_id').optional().isMongoId().withMessage('Valid user_id is required'),
];

const getExpirationNotifications = asyncHandler(async (req, res) => {
  const result = await generateExpirationNotifications(req);
  res.json({
    success: true,
    scanned: result.scanned,
    generated: result.created,
    count: result.notifications.length,
    data: result.notifications,
    notifications: result.notifications,
  });
});

const getNotifications = asyncHandler(async (req, res) => {
  await generateExpirationNotifications(req);
  const filter = req.user?._id ? { $or: [{ user_id: req.user._id }, { user_id: null }] } : {};
  if (req.user?.role === 'unit') {
    const warehouseId = requireAssignedWarehouse(req);
    const productIds = await Product.find({ warehouse_id: warehouseId }).distinct('_id');
    filter.$and = [
      {
        $or: [
          { item_id: null },
          { item_id: { $in: productIds } },
          { entity_type: { $nin: ['Product', 'product', 'inventory'] } },
        ],
      },
    ];
  }
  const notifications = await Notification.find(filter)
    .populate('user_id')
    .populate('item_id')
    .sort('-createdAt');

  res.json({ success: true, count: notifications.length, data: notifications, notifications });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { is_read: true, status: 'read' },
    { new: true, runValidators: true }
  ).populate('user_id').populate('item_id');

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await createAuditLog({
    req,
    action: 'mark_notification_read',
    module: 'notifications',
    entityId: notification._id,
    entityType: 'Notification',
    description: `Marked notification "${notification.title}" as read`,
    newData: notification,
  });

  res.json({ success: true, data: notification, notification });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const filter = req.user?._id
    ? {
      $and: [
        { $or: [{ user_id: req.user._id }, { user_id: null }] },
        { $or: [{ is_read: false }, { status: 'unread' }] },
      ],
    }
    : { $or: [{ is_read: false }, { status: 'unread' }] };
  const result = await Notification.updateMany(
    filter,
    { $set: { is_read: true, status: 'read' } }
  );

  await createAuditLog({
    req,
    action: 'mark_all_notifications_read',
    module: 'notifications',
    description: `Marked ${result.modifiedCount || 0} notifications as read`,
    newData: { modifiedCount: result.modifiedCount || 0 },
  });

  res.json({ success: true, unreadCount: 0, modifiedCount: result.modifiedCount || 0 });
});

const updateNotification = asyncHandler(async (req, res) => {
  const previous = await Notification.findById(req.params.id);
  const payload = { ...req.body };
  if (payload.is_read === true) payload.status = 'read';
  if (payload.status === 'read') payload.is_read = true;

  const notification = await Notification.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  }).populate('user_id');

  if (notification) {
    await createAuditLog({
      req,
      action: payload.is_read || payload.status === 'read' ? 'mark_notification_read' : 'update_notification',
      module: 'notifications',
      entityId: notification._id,
      entityType: 'Notification',
      description: payload.is_read || payload.status === 'read'
        ? `Marked notification "${notification.title}" as read`
        : `Updated notification "${notification.title}"`,
      previousData: previous,
      newData: notification,
    });
  }

  res.json({ success: true, data: notification });
});

module.exports = {
  notificationRules,
  getExpirationNotifications,
  getNotifications,
  getNotification: getOne(Notification, ['user_id']),
  createNotification: createOne(Notification),
  updateNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification: deleteOne(Notification),
};
