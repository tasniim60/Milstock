const Product = require('../models/productModel');
const Notification = require('../models/notificationModel');
const { createAuditLog } = require('./auditLogService');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getExpirationDate = (product) =>
  product.expiration_date || product.expiry_date || product.expirationDate || product.expiryDate || product.expires_at;

const formatDateText = (value) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value));

const getExpirationInfo = (product) => {
  const expirationDate = getExpirationDate(product);
  if (!expirationDate) return null;

  const today = startOfToday();
  const expires = new Date(expirationDate);
  expires.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((expires.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysRemaining < 0) return { status: 'expired', severity: 'critical', daysRemaining, window: 'expired' };
  const settings = product.alert_settings || {};
  const warningDays = Number(settings.expiration_warning_days ?? 30);
  const criticalDays = Number(settings.critical_expiration_days ?? 7);
  if (daysRemaining <= criticalDays) return { status: 'expiring_soon', severity: 'critical', daysRemaining, window: `${criticalDays}_critical_days` };
  if (daysRemaining <= warningDays) return { status: 'expiring_soon', severity: 'warning', daysRemaining, window: `${warningDays}_warning_days` };
  return null;
};

const buildMessage = (product, info) => {
  const expirationDate = getExpirationDate(product);
  const dateText = formatDateText(expirationDate);
  if (info.status === 'expired') {
    return `${product.name} expired on ${dateText}.`;
  }
  return `Reminder: ${product.name} will expire in ${info.daysRemaining} days.`;
};

const generateExpirationNotifications = async (req = null) => {
  const products = await Product.find({ $or: [{ expiration_date: { $ne: null } }, { expiry_date: { $ne: null } }] });
  const notifications = [];
  let scanned = 0;
  let created = 0;

  for (const product of products) {
    scanned += 1;
    const info = getExpirationInfo(product);
    if (!info) continue;
    const expirationDate = getExpirationDate(product);
    const notificationKey = `expiration:${product._id}:${info.window}`;

    const duplicate = await Notification.findOne({
      $or: [
        { notification_key: notificationKey },
        {
          type: 'expiration',
          item_id: product._id,
          'metadata.reminder_window': info.window,
        },
      ],
    });

    if (duplicate) {
      notifications.push(duplicate);
      continue;
    }

    const notification = await Notification.create({
      title: info.status === 'expired' ? 'Expired Item' : 'Expiration Reminder',
      titleAr: info.status === 'expired' ? 'صنف منتهي الصلاحية' : 'تذكير بانتهاء الصلاحية',
      titleKey: info.status === 'expired' ? 'EXPIRED_ITEM_TITLE' : 'EXPIRATION_REMINDER_TITLE',
      type: 'expiration',
      message: buildMessage(product, info),
      messageAr: product.nameAr
        ? (info.status === 'expired'
          ? `انتهت صلاحية ${product.nameAr} في ${formatDateText(expirationDate)}.`
          : `تنبيه: ${product.nameAr} ستنتهي صلاحيته خلال ${info.daysRemaining} يوم.`)
        : '',
      messageKey: info.status === 'expired' ? 'EXPIRED_ITEM_MESSAGE' : 'EXPIRATION_REMINDER_MESSAGE',
      user_id: null,
      item_id: product._id,
      entity_id: String(product._id),
      entity_type: 'item',
      severity: info.severity,
      status: 'unread',
      is_read: false,
      notification_key: notificationKey,
      metadata: {
        item_id: product._id,
        item_name: product.name,
        item_name_ar: product.nameAr || '',
        product_name: product.name,
        product_name_ar: product.nameAr || '',
        expiration_date: expirationDate,
        expiration_status: info.status,
        days_remaining: info.daysRemaining,
        reminder_window: info.window,
      },
      params: {
        itemName: product.name,
        itemNameAr: product.nameAr || '',
        daysRemaining: info.daysRemaining,
        expirationDate,
      },
    });
    created += 1;

    await createAuditLog({
      req,
      action: 'create_notification',
      module: 'notifications',
      entityId: notification._id,
      entityType: 'Notification',
      description: `Generated ${info.window} expiration reminder for ${product.name}`,
      newData: notification,
    });

    notifications.push(notification);
  }

  console.log('Expiration notification scan completed', { scanned, created });

  const data = await Notification.find({
    type: 'expiration',
    _id: { $in: notifications.map((notification) => notification._id) },
  })
    .populate('user_id')
    .populate('item_id')
    .sort('-createdAt');

  return { scanned, created, notifications: data };
};

module.exports = {
  generateExpirationNotifications,
};
