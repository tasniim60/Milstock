const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../services/auditLogService');
const { assertWarehouseAccess, buildWarehouseScopeFilter } = require('../utils/warehouseScope');

const moduleForModel = (modelName = '') => {
  const map = {
    Warehouse: 'warehouses',
    Supplier: 'suppliers',
    OrderItem: 'requests',
    ProductWarehouse: 'inventory',
    InventoryMovement: 'inventory',
    Consumption: 'consumption',
    Notification: 'notifications',
  };
  return map[modelName] || modelName.toLowerCase();
};

const getAll = (Model, populate = []) =>
  asyncHandler(async (req, res) => {
    const scopeFilter = await buildWarehouseScopeFilter(req, Model);
    const queryFilter = { ...req.query };
    delete queryFilter.sort;
    delete queryFilter.limit;
    delete queryFilter.page;
    delete queryFilter.fields;
    let query = Model.find({ ...queryFilter, ...scopeFilter });
    populate.forEach((field) => {
      query = query.populate(field);
    });

    const docs = await query.sort('-createdAt');
    res.json({ success: true, count: docs.length, data: docs });
  });

const getOne = (Model, populate = []) =>
  asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    populate.forEach((field) => {
      query = query.populate(field);
    });

    const doc = await query;
    if (!doc) throw new AppError('Resource not found', 404);
    await assertWarehouseAccess(req, Model, doc);

    res.json({ success: true, data: doc });
  });

const createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.create(req.body);
    await createAuditLog({
      req,
      action: `create_${Model.modelName.toLowerCase()}`,
      module: moduleForModel(Model.modelName),
      entityId: doc._id,
      entityType: Model.modelName,
      description: `Created ${Model.modelName}`,
      newData: doc,
    });
    res.status(201).json({ success: true, data: doc });
  });

const updateOne = (Model) =>
  asyncHandler(async (req, res) => {
    const previous = await Model.findById(req.params.id);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) throw new AppError('Resource not found', 404);

    await createAuditLog({
      req,
      action: `update_${Model.modelName.toLowerCase()}`,
      module: moduleForModel(Model.modelName),
      entityId: doc._id,
      entityType: Model.modelName,
      description: `Updated ${Model.modelName}`,
      previousData: previous,
      newData: doc,
    });

    res.json({ success: true, data: doc });
  });

const deleteOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw new AppError('Resource not found', 404);

    await createAuditLog({
      req,
      action: `delete_${Model.modelName.toLowerCase()}`,
      module: moduleForModel(Model.modelName),
      entityId: doc._id,
      entityType: Model.modelName,
      description: `Deleted ${Model.modelName}`,
      previousData: doc,
    });

    res.status(204).send();
  });

module.exports = { getAll, getOne, createOne, updateOne, deleteOne };
