const mongoose = require('mongoose');
const AppError = require('./AppError');

const Product = require('../models/productModel');
const User = require('../models/userModel');

const getAssignedWarehouseId = (req) => {
  const assigned = req.user?.assigned_warehouse;
  if (!assigned) return null;
  return String(assigned._id || assigned);
};

const getId = (value) => value?._id || value;

const requireAssignedWarehouse = (req) => {
  const warehouseId = getAssignedWarehouseId(req);
  if (req.user?.role === 'unit' && !warehouseId) {
    throw new AppError('No warehouse assigned to this user. Please contact admin.', 403);
  }
  return warehouseId;
};

const buildWarehouseScopeFilter = async (req, Model) => {
  if (!['unit', 'supplier'].includes(req.user?.role)) return {};

  if (req.user.role === 'supplier') {
    if (Model.modelName === 'Order') {
      return {
        request_type: { $in: ['supplier_request', 'provider'] },
        $or: [{ supplier_id: req.user._id }, { provider_id: req.user._id }],
      };
    }
    if (Model.modelName === 'OrderItem') {
      const Order = require('../models/orderModel');
      const orderIds = await Order.find({
        request_type: { $in: ['supplier_request', 'provider'] },
        $or: [{ supplier_id: req.user._id }, { provider_id: req.user._id }],
      }).distinct('_id');
      return { order_id: { $in: orderIds } };
    }
    if (['InventoryMovement', 'Consumption', 'Product', 'ProductWarehouse', 'Warehouse'].includes(Model.modelName)) {
      return { _id: null };
    }
    return {};
  }

  const warehouseId = requireAssignedWarehouse(req);
  const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);

  if (['Warehouse'].includes(Model.modelName)) {
    return {};
  }

  if (['Product', 'ProductWarehouse', 'Consumption'].includes(Model.modelName)) {
    return { warehouse_id: warehouseObjectId };
  }

  if (Model.modelName === 'InventoryMovement') {
    const productIds = await Product.find({ warehouse_id: warehouseObjectId }).distinct('_id');
    return {
      $or: [
        { reference_id: warehouseObjectId },
        { product_id: { $in: productIds } },
      ],
    };
  }

  if (Model.modelName === 'Order') {
    const userIds = await User.find({ assigned_warehouse: warehouseObjectId }).distinct('_id');
    return {
      $or: [
        { user_id: req.user._id },
        { requested_by: req.user._id },
        { user_id: { $in: userIds } },
      ],
    };
  }

  if (Model.modelName === 'OrderItem') {
    const productIds = await Product.find({ warehouse_id: warehouseObjectId }).distinct('_id');
    return { product_id: { $in: productIds } };
  }

  if (Model.modelName === 'Notification') {
    const productIds = await Product.find({ warehouse_id: warehouseObjectId }).distinct('_id');
    return {
      $and: [
        { $or: [{ user_id: req.user._id }, { user_id: null }] },
        { $or: [{ item_id: null }, { item_id: { $in: productIds } }] },
      ],
    };
  }

  return {};
};

const assertWarehouseAccess = async (req, Model, doc) => {
  if (!['unit', 'supplier'].includes(req.user?.role) || !doc) return;

  if (req.user.role === 'supplier') {
    if (Model.modelName === 'Order') {
      const isSupplierRequest = ['supplier_request', 'provider'].includes(doc.request_type);
      const isAssigned = [getId(doc.supplier_id), getId(doc.provider_id)].some((id) => String(id || '') === String(req.user._id));
      if (!isSupplierRequest || !isAssigned) {
        throw new AppError('You do not have permission to access this supplier order', 403);
      }
    }
    if (['InventoryMovement', 'Consumption', 'Product', 'ProductWarehouse', 'Warehouse'].includes(Model.modelName)) {
      throw new AppError('You do not have permission to access this warehouse data', 403);
    }
    return;
  }
  const warehouseId = requireAssignedWarehouse(req);

  if (Model.modelName === 'Warehouse' && String(doc._id) !== warehouseId) {
    throw new AppError('You do not have permission to access this warehouse data', 403);
  }

  if (['Product', 'ProductWarehouse', 'Consumption'].includes(Model.modelName) && String(doc.warehouse_id?._id || doc.warehouse_id) !== warehouseId) {
    throw new AppError('You do not have permission to access this warehouse data', 403);
  }

  if (Model.modelName === 'InventoryMovement') {
    const product = await Product.findById(getId(doc.product_id));
    const matchesProduct = product && String(product.warehouse_id) === warehouseId;
    const matchesReference = String(doc.reference_id?._id || doc.reference_id || '') === warehouseId;
    if (!matchesProduct && !matchesReference) {
      throw new AppError('You do not have permission to access this warehouse data', 403);
    }
  }

  if (Model.modelName === 'Order') {
    const owner = await User.findById(getId(doc.user_id));
    if (String(owner?.assigned_warehouse || '') !== warehouseId) {
      throw new AppError('You do not have permission to access this warehouse data', 403);
    }
  }

  if (Model.modelName === 'OrderItem') {
    const product = await Product.findById(getId(doc.product_id));
    if (String(product?.warehouse_id || '') !== warehouseId) {
      throw new AppError('You do not have permission to access this warehouse data', 403);
    }
  }

  if (Model.modelName === 'Notification') {
    const userId = String(getId(doc.user_id) || '');
    if (userId && userId !== String(req.user._id)) {
      throw new AppError('You do not have permission to access this notification', 403);
    }
    if (doc.item_id) {
      const product = await Product.findById(getId(doc.item_id));
      if (String(product?.warehouse_id || '') !== warehouseId) {
        throw new AppError('You do not have permission to access this warehouse data', 403);
      }
    }
  }
};

const enforcePayloadWarehouse = (req, payload, field = 'warehouse_id') => {
  if (req.user?.role !== 'unit') return;
  const warehouseId = requireAssignedWarehouse(req);
  if (payload[field] && String(payload[field]) !== warehouseId) {
    throw new AppError('You do not have permission to write data for another warehouse', 403);
  }
  payload[field] = warehouseId;
};

module.exports = {
  assertWarehouseAccess,
  buildWarehouseScopeFilter,
  enforcePayloadWarehouse,
  getAssignedWarehouseId,
  requireAssignedWarehouse,
};
