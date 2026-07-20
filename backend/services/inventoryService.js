const Product = require('../models/productModel');
const ProductWarehouse = require('../models/productWarehouseModel');
const InventoryMovement = require('../models/inventoryMovementModel');
const AppError = require('../utils/AppError');
const { createLowStockNotification } = require('./notificationService');

const syncProductQuantity = async (productId, session) => {
  const rows = await ProductWarehouse.find({ product_id: productId }).session(session);
  const total = rows.reduce((sum, row) => sum + row.quantity, 0);
  const product = await Product.findByIdAndUpdate(
    productId,
    { quantity: total },
    { new: true, runValidators: true, session }
  );

  return product;
};

const findOrCreateStockRow = async ({ product_id, warehouse_id, session }) => {
  let row = await ProductWarehouse.findOne({ product_id, warehouse_id }).session(session);

  if (!row) {
    row = await ProductWarehouse.create([{ product_id, warehouse_id, quantity: 0 }], { session });
    return row[0];
  }

  return row;
};

const adjustStock = async ({
  product_id,
  warehouse_id,
  quantity,
  change_type,
  user_id,
  reference_type,
  session,
}) => {
  const stockRow = await findOrCreateStockRow({ product_id, warehouse_id, session });
  const nextQuantity =
    change_type === 'in' ? stockRow.quantity + quantity : stockRow.quantity - quantity;

  if (nextQuantity < 0) {
    throw new AppError('Insufficient stock for this operation', 400);
  }

  stockRow.quantity = nextQuantity;
  await stockRow.save({ session });

  const product = await syncProductQuantity(product_id, session);

  await InventoryMovement.create(
    [
      {
        user_id,
        product_id,
        change_type,
        stock: quantity,
        reference_id: warehouse_id,
        reference_type,
      },
    ],
    { session }
  );

  if (product && user_id) {
    const productForWarehouseStock = product.toObject ? product.toObject() : product;
    await createLowStockNotification({
      ...productForWarehouseStock,
      quantity: stockRow.quantity,
      warehouse_id,
    }, user_id);
  }

  return product;
};

module.exports = { adjustStock, syncProductQuantity };
