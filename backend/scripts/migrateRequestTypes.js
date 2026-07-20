const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Order = require('../models/orderModel');

const run = async () => {
  await connectDB();
  const result = await Order.updateMany(
    { request_type: { $exists: false } },
    { $set: { request_type: 'warehouse_request' } }
  );
  console.log(`Orders updated with request_type=warehouse_request: ${result.modifiedCount || 0}`);
};

run()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
