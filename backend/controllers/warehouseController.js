const { body } = require('express-validator');
const Warehouse = require('../models/warehouseModel');
const ProductWarehouse = require('../models/productWarehouseModel');
const InventoryMovement = require('../models/inventoryMovementModel');
const Order = require('../models/orderModel');
const { getAll, getOne, updateOne, deleteOne } = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../services/auditLogService');
const { getAssignedWarehouseId } = require('../utils/warehouseScope');

const warehouseRules = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Warehouse name is required'),
  body('nameAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('code').optional().trim(),
  body('location').optional().trim().notEmpty().withMessage('Location is required'),
  body('locationAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('capacity').optional().isFloat({ min: 0 }).withMessage('Capacity must be 0 or greater'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('user_id').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid user_id is required'),
];

const getWarehouses = asyncHandler(async (req, res) => {
  const queryFilter = { ...req.query };
  delete queryFilter.sort;
  delete queryFilter.limit;
  delete queryFilter.page;
  delete queryFilter.fields;

  const statusFilter = queryFilter.status || { $ne: 'inactive' };
  delete queryFilter.status;

  const docs = await Warehouse.find({ ...queryFilter, status: statusFilter })
    .populate('user_id')
    .sort('name');

  res.json({ success: true, count: docs.length, data: docs });
});

const createWarehouse = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    user_id: req.body.user_id || req.user?._id,
  };

  const doc = await Warehouse.create(payload);
  await createAuditLog({
    req,
    action: 'create_warehouse',
    module: 'warehouses',
    entityId: doc._id,
    entityType: 'Warehouse',
    description: 'Created Warehouse',
    newData: doc,
  });
  res.status(201).json({ success: true, data: doc });
});

const getWarehouseDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assignedWarehouseId = getAssignedWarehouseId(req);

  if (req.user?.role === 'supplier') {
    throw new AppError('Suppliers cannot access warehouse dashboards', 403);
  }
  if (req.user?.role === 'unit' && String(assignedWarehouseId || '') !== String(id)) {
    throw new AppError('You do not have permission to access this warehouse dashboard', 403);
  }

  const warehouse = await Warehouse.findById(id).populate('user_id', '_id name email phone');
  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  const now = new Date();
  const inventoryRows = await ProductWarehouse.find({ warehouse_id: id })
    .populate('product_id')
    .sort('-updatedAt');

  const inventory = inventoryRows
    .filter((row) => row.product_id)
    .map((row) => {
      const product = row.product_id;
      const expiresAt = product.expiration_date || product.expiry_date || null;
      const settings = product.alert_settings || {};
      const lowStockThreshold = Number(settings.low_stock_threshold ?? product.min_quantity ?? 0);
      const criticalStockThreshold = Number(settings.critical_stock_threshold ?? 0);
      const expirationWarningDays = Number(settings.expiration_warning_days ?? 30);
      const criticalExpirationDays = Number(settings.critical_expiration_days ?? 7);
      const warningDate = new Date(now.getTime() + Math.max(expirationWarningDays, criticalExpirationDays) * 24 * 60 * 60 * 1000);
      const lowStock = lowStockThreshold > 0 && Number(row.quantity || 0) <= lowStockThreshold;
      const criticalStock = criticalStockThreshold > 0 && Number(row.quantity || 0) <= criticalStockThreshold;
      const expiringSoon = expiresAt && new Date(expiresAt) <= warningDate && new Date(expiresAt) >= now;
      return {
        _id: row._id,
        product_id: product._id,
        name: product.name,
        nameAr: product.nameAr,
        category: product.category || 'Uncategorized',
        categoryAr: product.categoryAr || '',
        quantity: row.quantity,
        unit: product.unit,
        min_quantity: product.min_quantity,
        status: criticalStock ? 'critical' : lowStock ? 'low_stock' : 'in_stock',
        expiration_date: expiresAt,
        expiring_soon: Boolean(expiringSoon),
        alert_settings: settings,
      };
    });

  const totalQuantityForDistribution = inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const stockDistribution = Object.values(inventory.reduce((totals, item) => {
    const category = item.category || 'Uncategorized';
    if (!totals[category]) totals[category] = { category, categoryAr: item.categoryAr || '', quantity: 0, items: 0 };
    totals[category].quantity += Number(item.quantity || 0);
    totals[category].items += 1;
    return totals;
  }, {})).map((row) => ({
    ...row,
    percentage: totalQuantityForDistribution ? Math.round((row.quantity / totalQuantityForDistribution) * 100) : 0,
  }));

  const movements = await InventoryMovement.find({
    $or: [
      { from_warehouse: id },
      { to_warehouse: id },
      { reference_id: id },
    ],
  })
    .populate('product_id', '_id name nameAr category categoryAr unit')
    .populate('from_warehouse', '_id name nameAr')
    .populate('to_warehouse', '_id name nameAr')
    .populate('user_id completed_by', '_id name')
    .sort('-createdAt')
    .limit(50);

  const requests = await Order.find({
    $or: [
      { source_warehouse: id },
      { destination_warehouse: id },
    ],
  })
    .populate('requested_by user_id supplier_id', '_id name email role')
    .populate('source_warehouse destination_warehouse', '_id name nameAr')
    .sort('-createdAt')
    .limit(50);

  const totalQuantity = inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const capacity = Number(warehouse.capacity || 0);
  const stats = {
    totalItems: inventory.length,
    totalQuantity,
    lowStockCount: inventory.filter((item) => ['low_stock', 'critical'].includes(item.status)).length,
    lowStockItems: inventory.filter((item) => ['low_stock', 'critical'].includes(item.status)).length,
    expiringSoonCount: inventory.filter((item) => item.expiring_soon).length,
    expiringSoonItems: inventory.filter((item) => item.expiring_soon).length,
    pendingRequestsCount: requests.filter((request) => ['pending', 'approved', 'in_transfer'].includes(request.status)).length,
    pendingRequests: requests.filter((request) => ['pending', 'approved', 'in_transfer'].includes(request.status)).length,
    completedMovementsCount: movements.filter((movement) => movement.status === 'completed').length,
    completedMovements: movements.filter((movement) => movement.status === 'completed').length,
    capacityUtilization: capacity ? Math.round((totalQuantity / capacity) * 100) : 0,
  };
  const expiringItems = inventory.filter((item) => item.expiring_soon);
  const lowStockItems = inventory.filter((item) => ['low_stock', 'critical'].includes(item.status));

  res.json({
    success: true,
    data: {
      warehouse: {
        ...warehouse.toObject(),
        manager: warehouse.user_id?.name || 'Unassigned',
      },
      stats,
      stockDistribution,
      inventory,
      movements,
      recentMovements: movements.slice(0, 10),
      requests,
      recentRequests: requests.slice(0, 10),
      expiringItems,
      lowStockItems,
    },
  });
});

module.exports = {
  warehouseRules,
  getWarehouses,
  getWarehouseDashboard,
  getWarehouse: getOne(Warehouse, ['user_id']),
  createWarehouse,
  updateWarehouse: updateOne(Warehouse),
  deleteWarehouse: deleteOne(Warehouse),
};
