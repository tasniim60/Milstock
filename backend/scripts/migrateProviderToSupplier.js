const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

const run = async () => {
  await connectDB();

  const users = await User.updateMany(
    { role: 'provider' },
    { $set: { role: 'supplier' } }
  );

  const providerRequests = await Order.updateMany(
    { request_type: 'provider' },
    [{ $set: { request_type: 'supplier_request', supplier_id: { $ifNull: ['$supplier_id', '$provider_id'] } } }]
  );

  const warehouseTransfers = await Order.updateMany(
    { request_type: 'warehouse_transfer' },
    { $set: { request_type: 'warehouse_request' } }
  );

  const missingTypes = await Order.updateMany(
    { request_type: { $exists: false } },
    { $set: { request_type: 'warehouse_request' } }
  );

  console.log(`Users provider -> supplier: ${users.modifiedCount || 0}`);
  console.log(`Orders provider -> supplier_request: ${providerRequests.modifiedCount || 0}`);
  console.log(`Orders warehouse_transfer -> warehouse_request: ${warehouseTransfers.modifiedCount || 0}`);
  console.log(`Orders missing request_type -> warehouse_request: ${missingTypes.modifiedCount || 0}`);
};

run()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
