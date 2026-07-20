const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Warehouse = require('../models/warehouseModel');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const hasOwn = (doc, field) => Object.prototype.hasOwnProperty.call(doc, field);

const run = async () => {
  if (!uri) {
    throw new Error('MONGO_URI or MONGODB_URI is required');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected for item field migration');

  const products = await Product.collection.find({}).toArray();
  let modified = 0;

  for (const product of products) {
    const updates = {};

    if (!hasOwn(product, 'storage_section')) updates.storage_section = '';
    if (!hasOwn(product, 'expiration_date')) updates.expiration_date = product.expiry_date || null;
    if (!hasOwn(product, 'manufacturing_date')) updates.manufacturing_date = null;
    if (!hasOwn(product, 'batch_number')) updates.batch_number = '';
    if (!hasOwn(product, 'serial_number')) updates.serial_number = '';
    if (!hasOwn(product, 'description')) updates.description = '';
    if (!hasOwn(product, 'notes')) updates.notes = '';
    if (!hasOwn(product, 'warehouse_name')) {
      const warehouse = product.warehouse_id ? await Warehouse.findById(product.warehouse_id) : null;
      updates.warehouse_name = warehouse?.name || '';
    }

    if (Object.keys(updates).length) {
      await Product.collection.updateOne({ _id: product._id }, { $set: updates });
      modified += 1;
    }
  }

  console.log(`Matched ${products.length} products`);
  console.log(`Modified ${modified} products`);
};

run()
  .catch((error) => {
    console.error('Item field migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  });
