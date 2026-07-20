const Notification = require('../models/notificationModel');

const createNotification = (payload) => Notification.create(payload);

const createLowStockNotification = async (product, userId) => {
  const settings = product.alert_settings || {};
  const lowStockThreshold = Number(settings.low_stock_threshold ?? product.min_quantity ?? 0);
  const criticalStockThreshold = Number(settings.critical_stock_threshold ?? 0);
  if (!lowStockThreshold || product.quantity > lowStockThreshold) return null;
  const notificationKey = `low_stock:${product._id}`;

  const existing = await Notification.findOne({
    notification_key: notificationKey,
    status: 'unread',
  });

  if (existing) return existing;

  return createNotification({
    title: 'Low Stock Alert',
    titleAr: 'انخفاض في المخزون',
    titleKey: 'LOW_STOCK_TITLE',
    type: 'low_stock',
    severity: criticalStockThreshold && product.quantity <= criticalStockThreshold ? 'critical' : 'warning',
    message: `The stock level for ${product.name} is below the configured minimum threshold.`,
    messageAr: product.nameAr
      ? `مخزون ${product.nameAr} منخفض عن الحد المحدد.`
      : '',
    messageKey: 'LOW_STOCK_MESSAGE',
    user_id: userId,
    item_id: product._id,
    entity_id: String(product._id),
    entity_type: 'item',
    status: 'unread',
    is_read: false,
    notification_key: notificationKey,
    metadata: {
      item_id: product._id,
      item_name: product.name,
      item_name_ar: product.nameAr || '',
      current_stock: product.quantity,
      minimum_stock: lowStockThreshold,
      critical_stock_threshold: criticalStockThreshold,
      unit: product.unit,
    },
    params: {
      itemName: product.name,
      itemNameAr: product.nameAr || '',
      currentStock: product.quantity,
      minimumStock: lowStockThreshold,
      unit: product.unit,
    },
  });
};

module.exports = { createNotification, createLowStockNotification };
